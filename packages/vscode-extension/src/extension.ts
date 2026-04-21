/**
 * Glin Profanity VS Code Extension
 *
 * Highlights profanity, PII, secrets, and prompt-injection in the active editor
 * using the glin-profanity scanner suite.
 */

import * as vscode from 'vscode';
import { checkProfanity } from 'glin-profanity';
import {
  PromptInjectionScanner,
  SecretsScanner,
  PiiScanner,
  type ScanMatch,
  type ScanContext,
} from 'glin-profanity/scanners';

// ─── Types ───────────────────────────────────────────────────────────────────

type ScannerKey = 'profanity' | 'injection' | 'secrets' | 'pii';
type Strictness = 'lenient' | 'moderate' | 'strict';

interface ExtensionConfig {
  enableOnSave: boolean;
  enableOnType: boolean;
  scanners: ScannerKey[];
  strictness: Strictness;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_BYTES = 1_000_000; // 1 MB
const ON_TYPE_DEBOUNCE_MS = 500;
const DIAGNOSTIC_SOURCE = 'glin-profanity';

// ─── Globals ─────────────────────────────────────────────────────────────────

let diagnosticCollection: vscode.DiagnosticCollection;
let onTypeTimer: ReturnType<typeof setTimeout> | undefined;

// ─── Config helper ───────────────────────────────────────────────────────────

function getConfig(): ExtensionConfig {
  const cfg = vscode.workspace.getConfiguration('glinProfanity');
  return {
    enableOnSave: cfg.get<boolean>('enableOnSave', true),
    enableOnType: cfg.get<boolean>('enableOnType', false),
    scanners: cfg.get<ScannerKey[]>('scanners', ['profanity', 'secrets', 'pii']),
    strictness: cfg.get<Strictness>('strictness', 'moderate'),
  };
}

// ─── Diagnostic builders ─────────────────────────────────────────────────────

function buildRange(doc: vscode.TextDocument, startIndex: number, endIndex: number): vscode.Range {
  return new vscode.Range(doc.positionAt(startIndex), doc.positionAt(endIndex));
}

function matchesToDiagnostics(
  doc: vscode.TextDocument,
  matches: ScanMatch[],
  severity: vscode.DiagnosticSeverity,
  source: string,
): vscode.Diagnostic[] {
  return matches.map((m) => {
    const range = buildRange(doc, m.startIndex, m.endIndex);
    const diag = new vscode.Diagnostic(
      range,
      `[${source}] ${m.pattern} (${m.category})`,
      severity,
    );
    diag.source = DIAGNOSTIC_SOURCE;
    diag.code = m.category;
    return diag;
  });
}

// ─── Core scan ───────────────────────────────────────────────────────────────

async function scanDocument(doc: vscode.TextDocument): Promise<void> {
  // Skip large / binary files
  if (doc.getText().length > MAX_FILE_SIZE_BYTES) {
    return;
  }

  const config = getConfig();
  const text = doc.getText();
  const diagnostics: vscode.Diagnostic[] = [];
  const ctx: ScanContext = { strictness: config.strictness };

  // ── Profanity scanner ──────────────────────────────────────────────────────
  if (config.scanners.includes('profanity')) {
    const result = checkProfanity(text);
    if (result.containsProfanity && result.matches) {
      for (const match of result.matches) {
        if (match.isWhitelisted) continue;
        // checkProfanity uses match.index; derive end from word length
        const start = match.index;
        const end = start + match.word.length;
        const range = buildRange(doc, start, end);
        const diag = new vscode.Diagnostic(
          range,
          `[profanity] "${match.word}"`,
          vscode.DiagnosticSeverity.Warning,
        );
        diag.source = DIAGNOSTIC_SOURCE;
        diag.code = 'profanity';
        diagnostics.push(diag);
      }
    }
  }

  // ── Prompt-injection scanner ───────────────────────────────────────────────
  if (config.scanners.includes('injection')) {
    const scanner = new PromptInjectionScanner({ strictness: config.strictness });
    const result = await Promise.resolve(scanner.scan(text, ctx));
    if (!result.valid && result.matches && result.matches.length > 0) {
      diagnostics.push(
        ...matchesToDiagnostics(doc, result.matches, vscode.DiagnosticSeverity.Error, 'injection'),
      );
    }
  }

  // ── Secrets scanner ────────────────────────────────────────────────────────
  if (config.scanners.includes('secrets')) {
    const scanner = new SecretsScanner();
    const result = await Promise.resolve(scanner.scan(text, ctx));
    if (!result.valid && result.matches && result.matches.length > 0) {
      diagnostics.push(
        ...matchesToDiagnostics(doc, result.matches, vscode.DiagnosticSeverity.Error, 'secret'),
      );
    }
  }

  // ── PII scanner ────────────────────────────────────────────────────────────
  if (config.scanners.includes('pii')) {
    const scanner = new PiiScanner();
    const result = await Promise.resolve(scanner.scan(text, ctx));
    if (!result.valid && result.matches && result.matches.length > 0) {
      diagnostics.push(
        ...matchesToDiagnostics(doc, result.matches, vscode.DiagnosticSeverity.Warning, 'pii'),
      );
    }
  }

  diagnosticCollection.set(doc.uri, diagnostics);
}

// ─── Activation ──────────────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext): void {
  diagnosticCollection = vscode.languages.createDiagnosticCollection(DIAGNOSTIC_SOURCE);
  context.subscriptions.push(diagnosticCollection);

  // Command: scan active file manually
  context.subscriptions.push(
    vscode.commands.registerCommand('glinProfanity.scanActiveFile', () => {
      const doc = vscode.window.activeTextEditor?.document;
      if (doc) {
        void scanDocument(doc);
      }
    }),
  );

  // Command: clear all diagnostics
  context.subscriptions.push(
    vscode.commands.registerCommand('glinProfanity.clearDiagnostics', () => {
      diagnosticCollection.clear();
    }),
  );

  // Event: on save
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc) => {
      if (getConfig().enableOnSave) {
        void scanDocument(doc);
      }
    }),
  );

  // Event: on type (debounced)
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (!getConfig().enableOnType) return;
      if (onTypeTimer !== undefined) {
        clearTimeout(onTypeTimer);
      }
      onTypeTimer = setTimeout(() => {
        void scanDocument(event.document);
        onTypeTimer = undefined;
      }, ON_TYPE_DEBOUNCE_MS);
    }),
  );

  // Scan already-open editors on activation
  if (vscode.window.activeTextEditor) {
    void scanDocument(vscode.window.activeTextEditor.document);
  }
}

export function deactivate(): void {
  if (onTypeTimer !== undefined) {
    clearTimeout(onTypeTimer);
    onTypeTimer = undefined;
  }
  diagnosticCollection?.dispose();
}
