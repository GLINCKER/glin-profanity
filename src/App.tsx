import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  SeverityLevel,
  useProfanityChecker,
  Filter,
  normalizeLeetspeak,
  normalizeUnicode,
  containsLeetspeak,
  containsUnicodeObfuscation,
} from 'glin-profanity';
// TensorFlow.js must be imported before toxicity model to register backends
import '@tensorflow/tfjs';
import * as toxicity from '@tensorflow-models/toxicity';

// Theme types
type Theme = 'dark' | 'light';

interface ThemeColors {
  bg: string;
  bgSecondary: string;
  text: string;
  textMuted: string;
  border: string;
  glassBg: string;
  inputBg: string;
  terminal: string;
}

const themes: Record<Theme, ThemeColors> = {
  dark: {
    bg: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%)',
    bgSecondary: 'rgba(0, 0, 0, 0.3)',
    text: '#e0e0e0',
    textMuted: '#888',
    border: 'rgba(255, 255, 255, 0.08)',
    glassBg: 'rgba(255, 255, 255, 0.03)',
    inputBg: 'rgba(0, 0, 0, 0.3)',
    terminal: '#09090b',
  },
  light: {
    bg: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
    bgSecondary: 'rgba(255, 255, 255, 0.8)',
    text: '#1e293b',
    textMuted: '#64748b',
    border: 'rgba(0, 0, 0, 0.1)',
    glassBg: 'rgba(255, 255, 255, 0.7)',
    inputBg: 'rgba(255, 255, 255, 0.9)',
    terminal: '#1e293b',
  },
};

// Spinner component for loading states
const Spinner: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    style={{
      animation: 'spin 1s linear infinite',
    }}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </svg>
);

// SVG Icons
const Icons = {
  sun: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  ),
  moon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  refresh: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 21h5v-5" />
    </svg>
  ),
  flask: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6" />
      <path d="M10 3v6.5L5.5 18A2 2 0 0 0 7.28 21h9.44a2 2 0 0 0 1.78-3L14 9.5V3" />
    </svg>
  ),
  brain: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" />
      <path d="M19.967 17.484A4 4 0 0 1 18 18" />
    </svg>
  ),
  block: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m4.9 4.9 14.2 14.2" />
    </svg>
  ),
  check: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  document: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  hash: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  ),
  globe: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  alert: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  xCircle: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  ),
  checkCircle: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
};

// Styles
const styles = {
  app: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%)',
    color: '#e0e0e0',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: '20px',
  } as React.CSSProperties,
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  } as React.CSSProperties,
  header: {
    textAlign: 'center' as const,
    marginBottom: '30px',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '8px',
  } as React.CSSProperties,
  subtitle: {
    color: '#888',
    fontSize: '0.95rem',
  },
  glass: {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
  } as React.CSSProperties,
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
  },
  tab: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
  tabActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
  },
  tabInactive: {
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#888',
  },
  input: {
    width: '100%',
    padding: '16px',
    fontSize: '1rem',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#fff',
    outline: 'none',
    marginBottom: '16px',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,
  textarea: {
    width: '100%',
    padding: '16px',
    fontSize: '1rem',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#fff',
    outline: 'none',
    minHeight: '120px',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,
  button: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  primaryButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
  },
  secondaryButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
  },
  quickTestButton: {
    padding: '8px 16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#ccc',
    cursor: 'pointer',
    fontSize: '0.85rem',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  resultBox: {
    padding: '20px',
    borderRadius: '12px',
    marginTop: '16px',
  } as React.CSSProperties,
  resultClean: {
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },
  resultProfane: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 600,
    marginRight: '8px',
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  } as React.CSSProperties,
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '14px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  } as React.CSSProperties,
  toggle: {
    position: 'relative' as const,
    width: '44px',
    height: '24px',
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  } as React.CSSProperties,
  toggleKnob: {
    position: 'absolute' as const,
    top: '2px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: '#fff',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  } as React.CSSProperties,
  slider: {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    background: 'rgba(255, 255, 255, 0.1)',
    outline: 'none',
    marginTop: '8px',
  } as React.CSSProperties,
  testItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    marginBottom: '8px',
  } as React.CSSProperties,
  terminal: {
    background: '#09090b',
    borderRadius: '12px',
    padding: '16px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '0.85rem',
    maxHeight: '300px',
    overflow: 'auto',
  } as React.CSSProperties,
  normalizationBox: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    padding: '12px',
    marginTop: '12px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.9rem',
  } as React.CSSProperties,
  iconLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
};

type TabType = 'basic' | 'advanced' | 'ml' | 'tests' | 'normalize';

const VALID_TABS: TabType[] = ['basic', 'advanced', 'ml', 'tests', 'normalize'];

// Get initial tab from URL hash
const getTabFromHash = (): TabType => {
  const hash = window.location.hash.slice(1) as TabType;
  return VALID_TABS.includes(hash) ? hash : 'basic';
};

interface TestCase {
  id: string;
  input: string;
  expected: boolean;
  category: 'leetspeak' | 'unicode' | 'standard' | 'edge';
  description: string;
}

const TEST_CASES: TestCase[] = [
  // Standard profanity
  { id: '1', input: 'fuck', expected: true, category: 'standard', description: 'Basic profanity' },
  { id: '2', input: 'shit', expected: true, category: 'standard', description: 'Basic profanity' },
  { id: '3', input: 'hello world', expected: false, category: 'standard', description: 'Clean text' },

  // Leetspeak
  { id: '4', input: 'f4ck', expected: true, category: 'leetspeak', description: '4 -> a substitution' },
  { id: '5', input: 'sh1t', expected: true, category: 'leetspeak', description: '1 -> i substitution' },
  { id: '6', input: '@ss', expected: true, category: 'leetspeak', description: '@ -> a substitution' },
  { id: '7', input: '$h!t', expected: true, category: 'leetspeak', description: 'Multiple substitutions' },
  { id: '8', input: 'f u c k', expected: true, category: 'leetspeak', description: 'Spaced characters' },
  { id: '9', input: 'fuuuuck', expected: true, category: 'leetspeak', description: 'Repeated characters' },

  // Unicode homoglyphs
  { id: '10', input: 'fυck', expected: true, category: 'unicode', description: 'Greek upsilon' },
  { id: '11', input: 'ƒυ¢к', expected: true, category: 'unicode', description: 'Multiple homoglyphs' },
  { id: '12', input: 'аss', expected: true, category: 'unicode', description: 'Cyrillic a' },
  { id: '13', input: 'shіt', expected: true, category: 'unicode', description: 'Cyrillic i' },

  // Edge cases
  { id: '14', input: 'scunthorpe', expected: false, category: 'edge', description: 'Scunthorpe problem' },
  { id: '15', input: 'classic', expected: false, category: 'edge', description: 'Contains "ass" substring' },
  { id: '16', input: 'hello123', expected: false, category: 'edge', description: 'Numbers in clean text' },
];

// Custom Toggle Component
const Toggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  theme: Theme;
}> = ({ checked, onChange, label, theme }) => {
  const colors = themes[theme];
  return (
    <label style={styles.checkbox}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          ...styles.toggle,
          cursor: 'pointer',
          background: checked
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
          boxShadow: checked
            ? '0 0 12px rgba(102, 126, 234, 0.4)'
            : 'inset 0 1px 3px rgba(0,0,0,0.2)',
        }}
      >
        <div
          style={{
            ...styles.toggleKnob,
            left: checked ? '22px' : '2px',
            transform: checked ? 'scale(1.05)' : 'scale(1)',
          }}
        />
      </div>
      <span style={{ color: colors.text }}>{label}</span>
    </label>
  );
};

const QUICK_TESTS = [
  { label: 'f4ck', input: 'f4ck' },
  { label: 'sh1t', input: 'sh1t' },
  { label: '@ss', input: '@ss' },
  { label: 'fυck', input: 'ƒυ¢к' },
  { label: 'f u c k', input: 'f u c k' },
  { label: 'fuuuuck', input: 'fuuuuck' },
  { label: '$h!t', input: '$h!t' },
  { label: 'Clean', input: 'Hello world!' },
];

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [activeTab, setActiveTab] = useState<TabType>(getTabFromHash);
  const [text, setText] = useState('');

  // Sync tab with URL hash
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    window.history.pushState(null, '', `#${tab}`);
  }, []);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromHash());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const colors = themes[theme];
  const [checkAllLanguages, setCheckAllLanguages] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wordBoundaries, setWordBoundaries] = useState(true);
  const [allowObfuscatedMatch, setAllowObfuscatedMatch] = useState(true);
  const [detectLeetspeak, setDetectLeetspeak] = useState(true);
  const [normalizeUnicodeOption, setNormalizeUnicodeOption] = useState(true);
  const [fuzzyToleranceLevel, setFuzzyToleranceLevel] = useState(0.8);
  const [autoReplace, setAutoReplace] = useState(false);
  const [minSeverity, setMinSeverity] = useState<SeverityLevel>(SeverityLevel.EXACT);
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [customWordsText, setCustomWordsText] = useState('');
  const [replaceWith, setReplaceWith] = useState('***');
  const [checkedOutput, setCheckedOutput] = useState<any>(null);
  const [logEntries, setLogEntries] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<Record<string, { passed: boolean; actual: boolean }>>({});
  const [isRunningTests, setIsRunningTests] = useState(false);

  // ML State
  const [mlLoading, setMlLoading] = useState(false);
  const [mlResult, setMlResult] = useState<any>(null);
  const [mlThreshold, setMlThreshold] = useState(0.9);
  const [mlModelLoaded, setMlModelLoaded] = useState(false);
  const [mlModelLoading, setMlModelLoading] = useState(false);
  const [mlDemoMode, setMlDemoMode] = useState(false);
  const mlModelRef = useRef<any>(null);

  // ML Feedback for learning demonstration
  const [mlFeedback, setMlFeedback] = useState<{ correct: number; incorrect: number }>({ correct: 0, incorrect: 0 });
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  // Simulated ML analysis for demo mode
  const runDemoAnalysis = useCallback((inputText: string) => {
    const lowerText = inputText.toLowerCase();
    const hasBadWords = ['hate', 'kill', 'die', 'stupid', 'idiot', 'dumb'].some(w => lowerText.includes(w));
    const hasThreats = ['kill', 'die', 'hurt', 'attack'].some(w => lowerText.includes(w));
    const hasInsults = ['stupid', 'idiot', 'dumb', 'ugly', 'loser'].some(w => lowerText.includes(w));

    return {
      isToxic: hasBadWords,
      predictions: [
        { label: 'toxicity', probability: hasBadWords ? 0.85 + Math.random() * 0.1 : 0.05 + Math.random() * 0.1, match: hasBadWords },
        { label: 'severe_toxicity', probability: hasBadWords ? 0.4 + Math.random() * 0.2 : 0.01 + Math.random() * 0.05, match: false },
        { label: 'insult', probability: hasInsults ? 0.8 + Math.random() * 0.15 : 0.02 + Math.random() * 0.08, match: hasInsults },
        { label: 'threat', probability: hasThreats ? 0.75 + Math.random() * 0.2 : 0.01 + Math.random() * 0.05, match: hasThreats },
        { label: 'identity_attack', probability: 0.01 + Math.random() * 0.05, match: false },
        { label: 'obscene', probability: hasBadWords ? 0.3 + Math.random() * 0.2 : 0.02 + Math.random() * 0.08, match: false },
      ],
    };
  }, []);

  // Function to load ML model
  const loadMlModel = useCallback(async () => {
    if (mlModelLoaded || mlModelLoading) return;
    setMlModelLoading(true);
    try {
      const model = await toxicity.load(mlThreshold, []);
      mlModelRef.current = model;
      setMlModelLoaded(true);
      setMlDemoMode(false);
    } catch (err: any) {
      console.error('Failed to load toxicity model:', err);
      // Fall back to demo mode
      setMlDemoMode(true);
      setMlModelLoaded(true); // Mark as "loaded" so UI works
    }
    setMlModelLoading(false);
  }, [mlModelLoaded, mlModelLoading, mlThreshold]);

  // Load ML model when ML tab is active
  useEffect(() => {
    if (activeTab === 'ml' && !mlModelLoaded && !mlModelLoading) {
      loadMlModel();
    }
  }, [activeTab, mlModelLoaded, mlModelLoading, loadMlModel]);

  const { checkText, reset } = useProfanityChecker({
    allLanguages: checkAllLanguages,
    caseSensitive,
    wordBoundaries,
    customWords,
    severityLevels: true,
    allowObfuscatedMatch,
    fuzzyToleranceLevel,
    minSeverity,
    autoReplace,
    replaceWith,
    detectLeetspeak,
    normalizeUnicode: normalizeUnicodeOption,
    customActions: (res) => {
      const detected = res.profaneWords?.join(', ') || 'none';
      const timestamp = new Date().toLocaleTimeString();
      const status = res.containsProfanity ? '[BLOCKED]' : '[OK]';
      const logMsg = `[${timestamp}] ${status} "${text.slice(0, 30)}${text.length > 30 ? '...' : ''}" -> ${res.containsProfanity ? detected : 'clean'}`;
      setLogEntries((prev) => [logMsg, ...prev.slice(0, 19)]);
    },
  });

  const handleCheck = useCallback(() => {
    if (!text.trim()) return;
    const output = checkText(text);
    setCheckedOutput(output);
  }, [text, checkText]);

  const handleQuickTest = (input: string) => {
    setText(input);
    setTimeout(() => {
      const output = checkText(input);
      setCheckedOutput(output);
    }, 0);
  };

  const handleReset = () => {
    setText('');
    setCheckedOutput(null);
    reset();
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults({});

    const filter = new Filter({
      languages: ['english'],
      detectLeetspeak: true,
      normalizeUnicode: true,
      wordBoundaries: true,
    });

    const results: Record<string, { passed: boolean; actual: boolean }> = {};

    for (const test of TEST_CASES) {
      await new Promise(resolve => setTimeout(resolve, 50));
      const actual = filter.isProfane(test.input);
      results[test.id] = {
        passed: actual === test.expected,
        actual,
      };
      setTestResults({ ...results });
    }

    setIsRunningTests(false);
  };

  const applyCustomWords = () => {
    if (!customWordsText.trim()) {
      setCustomWords([]);
      return;
    }
    const words = customWordsText.split(',').map(w => w.trim()).filter(Boolean);
    setCustomWords(words);
  };

  const getNormalizationPreview = (input: string) => {
    if (!input) return { leetspeak: '', unicode: '', hasLeet: false, hasUnicode: false };
    return {
      leetspeak: normalizeLeetspeak(input),
      unicode: normalizeUnicode(input),
      hasLeet: containsLeetspeak(input),
      hasUnicode: containsUnicodeObfuscation(input),
    };
  };

  const normPreview = getNormalizationPreview(text);
  const passedTests = Object.values(testResults).filter(r => r.passed).length;
  const totalTests = Object.keys(testResults).length;

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <div style={{ ...styles.app, background: colors.bg, color: colors.text }}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button
              onClick={toggleTheme}
              style={{
                ...styles.button,
                ...styles.secondaryButton,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                color: colors.text,
              }}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? Icons.sun : Icons.moon}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
          <h1 style={styles.title}>Glin-Profanity</h1>
          <p style={{ ...styles.subtitle, color: colors.textMuted }}>
            Advanced profanity detection with leetspeak, Unicode normalization & ML support
          </p>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {(['basic', 'advanced', 'normalize', 'tests', 'ml'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              style={{
                ...styles.tab,
                ...(activeTab === tab ? styles.tabActive : {
                  ...styles.tabInactive,
                  background: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  color: colors.textMuted,
                }),
              }}
            >
              {tab === 'basic' && <>{Icons.search} Basic</>}
              {tab === 'advanced' && <>{Icons.settings} Advanced</>}
              {tab === 'normalize' && <>{Icons.refresh} Normalize</>}
              {tab === 'tests' && <>{Icons.flask} Test Suite</>}
              {tab === 'ml' && <>{Icons.brain} ML Detection</>}
            </button>
          ))}
        </div>

        {/* Basic Tab */}
        {activeTab === 'basic' && (
          <>
            <div style={{ ...styles.glass, background: colors.glassBg, border: `1px solid ${colors.border}` }}>
              <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Quick Test</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                {QUICK_TESTS.map((test) => (
                  <button
                    key={test.label}
                    onClick={() => handleQuickTest(test.input)}
                    style={{
                      ...styles.quickTestButton,
                      background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                    }}
                  >
                    {test.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                placeholder="Type text to check for profanity..."
                style={{
                  ...styles.input,
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                }}
              />

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleCheck}
                  style={{ ...styles.button, ...styles.primaryButton }}
                >
                  Check Profanity
                </button>
                <button
                  onClick={handleReset}
                  style={{ ...styles.button, ...styles.secondaryButton }}
                >
                  Reset
                </button>
              </div>

              {/* Normalization Preview */}
              {text && (normPreview.hasLeet || normPreview.hasUnicode) && (
                <div style={{ ...styles.normalizationBox, background: colors.bgSecondary }}>
                  <div style={{ color: colors.textMuted, marginBottom: '8px', fontSize: '0.8rem' }}>
                    NORMALIZATION PREVIEW
                  </div>
                  {normPreview.hasLeet && (
                    <div style={{ marginBottom: '4px' }}>
                      <span style={{ color: '#f59e0b' }}>Leetspeak:</span>{' '}
                      <span style={{ color: '#22c55e' }}>{normPreview.leetspeak}</span>
                    </div>
                  )}
                  {normPreview.hasUnicode && (
                    <div>
                      <span style={{ color: '#8b5cf6' }}>Unicode:</span>{' '}
                      <span style={{ color: '#22c55e' }}>{normPreview.unicode}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Result */}
              {checkedOutput && (
                <div
                  style={{
                    ...styles.resultBox,
                    ...(checkedOutput.containsProfanity ? styles.resultProfane : styles.resultClean),
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span>
                      {checkedOutput.containsProfanity ? Icons.block : Icons.check}
                    </span>
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                        {checkedOutput.containsProfanity ? 'Profanity Detected' : 'No Profanity Found'}
                      </div>
                      <div style={{ color: '#888', fontSize: '0.9rem' }}>
                        {checkedOutput.profaneWords?.length || 0} matches found
                      </div>
                    </div>
                  </div>

                  {checkedOutput.containsProfanity && (
                    <>
                      <div style={{ marginBottom: '12px' }}>
                        {checkedOutput.filteredWords?.map((word: string, i: number) => (
                          <span
                            key={i}
                            style={{
                              ...styles.badge,
                              background: 'rgba(239, 68, 68, 0.2)',
                              color: '#ef4444',
                            }}
                          >
                            {word}
                            {checkedOutput.severityMap?.[word] !== undefined && (
                              <span style={{ opacity: 0.7, marginLeft: '4px' }}>
                                (lvl {checkedOutput.severityMap[word]})
                              </span>
                            )}
                          </span>
                        ))}
                      </div>

                      {autoReplace && checkedOutput.autoReplaced && (
                        <div style={styles.normalizationBox}>
                          <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '4px' }}>
                            FILTERED OUTPUT
                          </div>
                          <div style={{ color: '#22c55e' }}>{checkedOutput.autoReplaced}</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Activity Log */}
            {logEntries.length > 0 && (
              <div style={{ ...styles.glass, background: colors.glassBg, border: `1px solid ${colors.border}` }}>
                <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Activity Log</h3>
                <div style={{ ...styles.terminal, background: colors.terminal, color: theme === 'dark' ? '#e0e0e0' : '#fff' }}>
                  {logEntries.map((entry, i) => (
                    <div key={i} style={{ marginBottom: '4px', opacity: 1 - i * 0.04 }}>
                      {entry}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
          <div style={{ ...styles.glass, background: colors.glassBg, border: `1px solid ${colors.border}` }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Configuration</h3>
            <div style={styles.grid}>
              <div>
                <h4 style={{ marginTop: 0, color: colors.textMuted }}>Detection Options</h4>
                <Toggle
                  checked={detectLeetspeak}
                  onChange={setDetectLeetspeak}
                  label="Detect Leetspeak (f4ck → fuck)"
                  theme={theme}
                />
                <Toggle
                  checked={normalizeUnicodeOption}
                  onChange={setNormalizeUnicodeOption}
                  label="Normalize Unicode (fυck → fuck)"
                  theme={theme}
                />
                <Toggle
                  checked={checkAllLanguages}
                  onChange={setCheckAllLanguages}
                  label="Check All Languages"
                  theme={theme}
                />
                <Toggle
                  checked={caseSensitive}
                  onChange={setCaseSensitive}
                  label="Case Sensitive"
                  theme={theme}
                />
                <Toggle
                  checked={wordBoundaries}
                  onChange={setWordBoundaries}
                  label="Word Boundaries"
                  theme={theme}
                />
                <Toggle
                  checked={allowObfuscatedMatch}
                  onChange={setAllowObfuscatedMatch}
                  label="Detect Obfuscated Profanity"
                  theme={theme}
                />
              </div>

              <div>
                <h4 style={{ marginTop: 0, color: colors.textMuted }}>Filtering Options</h4>
                <Toggle
                  checked={autoReplace}
                  onChange={setAutoReplace}
                  label="Auto Replace Profanity"
                  theme={theme}
                />
                {autoReplace && (
                  <div style={{ marginLeft: '24px', marginBottom: '12px' }}>
                    <label style={{ color: '#888', fontSize: '0.9rem' }}>
                      Replace with:
                      <select
                        value={replaceWith}
                        onChange={(e) => setReplaceWith(e.target.value)}
                        style={{
                          marginLeft: '10px',
                          padding: '6px 12px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '6px',
                          color: '#fff',
                        }}
                      >
                        <option value="***">***</option>
                        <option value="[censored]">[censored]</option>
                        <option value="****">****</option>
                        <option value="#@%!">#@%!</option>
                      </select>
                    </label>
                  </div>
                )}

                <div style={{ marginTop: '16px' }}>
                  <label style={{ color: '#888', fontSize: '0.9rem' }}>
                    Minimum Severity Level:
                    <select
                      value={minSeverity}
                      onChange={(e) => setMinSeverity(Number(e.target.value))}
                      style={{
                        marginLeft: '10px',
                        padding: '6px 12px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        color: '#fff',
                      }}
                    >
                      <option value={SeverityLevel.EXACT}>Exact (strict)</option>
                      <option value={SeverityLevel.FUZZY}>Fuzzy (lenient)</option>
                    </select>
                  </label>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <label style={{ color: '#888', fontSize: '0.9rem' }}>
                    Fuzzy Tolerance: {fuzzyToleranceLevel.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1"
                    step="0.05"
                    value={fuzzyToleranceLevel}
                    onChange={(e) => setFuzzyToleranceLevel(parseFloat(e.target.value))}
                    style={styles.slider}
                  />
                </div>
              </div>

              <div>
                <h4 style={{ marginTop: 0, color: colors.textMuted }}>Custom Words</h4>
                <textarea
                  value={customWordsText}
                  onChange={(e) => setCustomWordsText(e.target.value)}
                  placeholder="word1, word2, word3..."
                  style={{ ...styles.textarea, minHeight: '80px', background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.text }}
                />
                <button
                  onClick={applyCustomWords}
                  style={{ ...styles.button, ...styles.secondaryButton, marginTop: '8px' }}
                >
                  Apply Custom Words
                </button>
                {customWords.length > 0 && (
                  <div style={{ marginTop: '8px', color: '#22c55e', fontSize: '0.85rem' }}>
                    {customWords.length} custom word(s) active
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Normalize Tab */}
        {activeTab === 'normalize' && (
          <div style={{ ...styles.glass, background: colors.glassBg, border: `1px solid ${colors.border}` }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Text Normalization Tool</h3>
            <p style={{ color: colors.textMuted, marginBottom: '20px' }}>
              See how leetspeak and Unicode text gets normalized before profanity detection.
            </p>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text with leetspeak (f4ck) or Unicode (fυck) to see normalization..."
              style={{ ...styles.textarea, background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.text }}
            />

            <div style={{ marginTop: '20px' }}>
              <div style={{ ...styles.glass, background: colors.bgSecondary, marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ color: colors.textMuted }}>{Icons.document}</span>
                  <div>
                    <div style={{ color: colors.textMuted, fontSize: '0.8rem' }}>ORIGINAL INPUT</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>{text || '(empty)'}</div>
                  </div>
                </div>
              </div>

              <div style={{ ...styles.glass, background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#f59e0b' }}>{Icons.hash}</span>
                  <div>
                    <div style={{ color: '#f59e0b', fontSize: '0.8rem' }}>
                      LEETSPEAK NORMALIZED {normPreview.hasLeet && <span style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '2px 8px', borderRadius: '4px', marginLeft: '8px' }}>Detected!</span>}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>{normPreview.leetspeak || '(empty)'}</div>
                  </div>
                </div>
              </div>

              <div style={{ ...styles.glass, background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#8b5cf6' }}>{Icons.globe}</span>
                  <div>
                    <div style={{ color: '#8b5cf6', fontSize: '0.8rem' }}>
                      UNICODE NORMALIZED {normPreview.hasUnicode && <span style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '2px 8px', borderRadius: '4px', marginLeft: '8px' }}>Detected!</span>}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>{normPreview.unicode || '(empty)'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <h4 style={{ color: colors.textMuted }}>Quick Examples</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { label: 'f4ck', desc: 'Leetspeak 4->a' },
                  { label: 'sh1t', desc: 'Leetspeak 1->i' },
                  { label: '@$$', desc: 'Leetspeak @->a, $->s' },
                  { label: 'fυck', desc: 'Greek υ->u' },
                  { label: 'ƒυ¢к', desc: 'Multiple homoglyphs' },
                  { label: 'f u c k', desc: 'Spaced chars' },
                  { label: 'fuuuuck', desc: 'Repeated chars' },
                ].map((ex) => (
                  <button
                    key={ex.label}
                    onClick={() => setText(ex.label)}
                    style={{
                      ...styles.quickTestButton,
                      background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                    }}
                    title={ex.desc}
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Test Suite Tab */}
        {activeTab === 'tests' && (
          <div style={{ ...styles.glass, background: colors.glassBg, border: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Test Suite</h3>
                <p style={{ color: colors.textMuted, margin: '4px 0 0 0', fontSize: '0.9rem' }}>
                  Run automated tests to verify profanity detection
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {totalTests > 0 && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: passedTests === totalTests ? '#22c55e' : '#ef4444' }}>
                      {passedTests}/{totalTests}
                    </div>
                    <div style={{ color: '#888', fontSize: '0.8rem' }}>tests passed</div>
                  </div>
                )}
                <button
                  onClick={runAllTests}
                  disabled={isRunningTests}
                  style={{
                    ...styles.button,
                    ...styles.primaryButton,
                    opacity: isRunningTests ? 0.7 : 1,
                  }}
                >
                  {isRunningTests ? 'Running...' : 'Run All Tests'}
                </button>
              </div>
            </div>

            {/* Test Categories */}
            {(['standard', 'leetspeak', 'unicode', 'edge'] as const).map((category) => (
              <div key={category} style={{ marginBottom: '20px' }}>
                <h4 style={{ color: colors.textMuted, marginBottom: '12px', textTransform: 'uppercase', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {category === 'standard' && <><span style={{ color: colors.textMuted }}>{Icons.document}</span> Standard Profanity</>}
                  {category === 'leetspeak' && <><span style={{ color: '#f59e0b' }}>{Icons.hash}</span> Leetspeak Detection</>}
                  {category === 'unicode' && <><span style={{ color: '#8b5cf6' }}>{Icons.globe}</span> Unicode Homoglyphs</>}
                  {category === 'edge' && <><span style={{ color: '#f59e0b' }}>{Icons.alert}</span> Edge Cases (Scunthorpe)</>}
                </h4>
                {TEST_CASES.filter((t) => t.category === category).map((test) => {
                  const result = testResults[test.id];
                  return (
                    <div key={test.id} style={{ ...styles.testItem, background: colors.bgSecondary }}>
                      <div>
                        <code style={{ color: colors.text, background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                          {test.input}
                        </code>
                        <span style={{ color: colors.textMuted, marginLeft: '12px', fontSize: '0.85rem' }}>
                          {test.description}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ color: colors.textMuted, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          expect: {test.expected ? Icons.xCircle : Icons.checkCircle}
                        </span>
                        {result && (
                          <span
                            style={{
                              ...styles.badge,
                              background: result.passed ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              color: result.passed ? '#22c55e' : '#ef4444',
                            }}
                          >
                            {result.passed ? 'PASS' : 'FAIL'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* ML Tab */}
        {activeTab === 'ml' && (
          <div style={{ ...styles.glass, background: colors.glassBg, border: `1px solid ${colors.border}` }}>
            <h3 style={{ marginTop: 0, marginBottom: '8px' }}>ML-Based Toxicity Detection</h3>
            <p style={{ color: colors.textMuted, marginBottom: '20px' }}>
              Uses TensorFlow.js toxicity model for advanced content analysis.
            </p>

            <div style={{
              background: mlDemoMode ? 'rgba(245, 158, 11, 0.1)' : mlModelLoaded ? 'rgba(34, 197, 94, 0.1)' : mlModelLoading ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)',
              border: `1px solid ${mlDemoMode ? 'rgba(245, 158, 11, 0.3)' : mlModelLoaded ? 'rgba(34, 197, 94, 0.3)' : mlModelLoading ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: mlDemoMode ? '#f59e0b' : mlModelLoaded ? '#22c55e' : '#8b5cf6' }}>
                  {mlDemoMode ? Icons.alert : mlModelLoaded ? Icons.checkCircle : mlModelLoading ? Icons.refresh : Icons.brain}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: mlDemoMode ? '#f59e0b' : mlModelLoaded ? '#22c55e' : '#8b5cf6' }}>
                    {mlDemoMode
                      ? 'Demo Mode (CORS Blocked)'
                      : mlModelLoaded
                        ? 'TensorFlow Model Active'
                        : mlModelLoading
                          ? 'Loading TensorFlow Model...'
                          : 'TensorFlow.js Toxicity Model'}
                  </div>
                  <div style={{ color: colors.textMuted, fontSize: '0.9rem', marginTop: '4px' }}>
                    {mlDemoMode
                      ? 'TensorFlow Hub blocked by CORS from localhost. Using simulated analysis - deploy to production for real ML.'
                      : mlModelLoaded
                        ? 'Model loaded and ready. Analyzes text for toxicity, insults, threats, identity attacks, and more.'
                        : mlModelLoading
                          ? 'Downloading ~5MB model from TensorFlow Hub. This only happens once per session.'
                          : 'Real-time toxicity detection using pre-trained neural network (~5MB download on first use).'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: colors.textMuted, fontSize: '0.9rem' }}>
                ML Confidence Threshold: {mlThreshold.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.5"
                max="0.99"
                step="0.01"
                value={mlThreshold}
                onChange={(e) => setMlThreshold(parseFloat(e.target.value))}
                style={styles.slider}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '0.75rem', marginTop: '4px' }}>
                <span>More sensitive (0.5)</span>
                <span>More strict (0.99)</span>
              </div>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text for ML toxicity analysis..."
              style={{ ...styles.textarea, background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.text }}
            />

            <div style={{ marginTop: '16px' }}>
              <button
                onClick={async () => {
                  setMlLoading(true);
                  setFeedbackGiven(false); // Reset feedback for new analysis
                  try {
                    if (mlDemoMode || !mlModelRef.current) {
                      // Demo mode - simulated analysis
                      await new Promise(resolve => setTimeout(resolve, 500));
                      setMlResult(runDemoAnalysis(text));
                    } else {
                      // Real TensorFlow model
                      const predictions = await mlModelRef.current.classify([text]);
                      const results = predictions.map((p: any) => ({
                        label: p.label,
                        probability: p.results[0].probabilities[1],
                        match: p.results[0].match,
                      }));
                      setMlResult({
                        isToxic: results.some((r: any) => r.match),
                        predictions: results,
                      });
                    }
                  } catch (err) {
                    console.error('ML analysis failed:', err);
                    // Fall back to demo
                    setMlResult(runDemoAnalysis(text));
                  }
                  setMlLoading(false);
                }}
                disabled={mlLoading || !text.trim() || !mlModelLoaded}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: mlLoading || !text.trim() || !mlModelLoaded ? 0.7 : 1,
                }}
              >
                {mlModelLoading ? (
                  <><Spinner /> Loading Model...</>
                ) : mlLoading ? (
                  <><Spinner /> Analyzing...</>
                ) : (
                  <>{Icons.brain} Analyze with ML</>
                )}
              </button>
              {mlModelLoaded && !mlDemoMode && (
                <span style={{ color: '#22c55e', fontSize: '0.85rem', marginLeft: '12px' }}>
                  TensorFlow ready
                </span>
              )}
              {mlModelLoaded && mlDemoMode && (
                <span style={{ color: '#f59e0b', fontSize: '0.85rem', marginLeft: '12px' }}>
                  Demo mode (CORS)
                </span>
              )}
              {mlModelLoading && (
                <span style={{ color: '#f59e0b', fontSize: '0.85rem', marginLeft: '12px' }}>
                  Loading TensorFlow model...
                </span>
              )}
            </div>

            {mlResult && (
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ color: '#888', marginBottom: '12px' }}>ML Analysis Results</h4>
                <div style={styles.grid}>
                  {mlResult.predictions.map((pred: any) => (
                    <div
                      key={pred.label}
                      style={{
                        ...styles.glass,
                        background: pred.probability > mlThreshold ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0,0,0,0.2)',
                        border: pred.probability > mlThreshold ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                        marginBottom: 0,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ textTransform: 'capitalize' }}>{pred.label.replace('_', ' ')}</span>
                        <span
                          style={{
                            fontWeight: 700,
                            color: pred.probability > mlThreshold ? '#ef4444' : '#22c55e',
                          }}
                        >
                          {(pred.probability * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div
                        style={{
                          height: '4px',
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: '2px',
                          marginTop: '8px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${pred.probability * 100}%`,
                            background: pred.probability > mlThreshold
                              ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                              : 'linear-gradient(90deg, #22c55e, #16a34a)',
                            borderRadius: '2px',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Feedback Section */}
                <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '12px', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <span style={{ color: colors.text }}>Was this classification accurate?</span>
                    {!feedbackGiven ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setMlFeedback(prev => ({ ...prev, correct: prev.correct + 1 }));
                            setFeedbackGiven(true);
                          }}
                          style={{
                            ...styles.button,
                            padding: '8px 16px',
                            background: 'rgba(34, 197, 94, 0.2)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            color: '#22c55e',
                          }}
                        >
                          {Icons.check} Yes
                        </button>
                        <button
                          onClick={() => {
                            setMlFeedback(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
                            setFeedbackGiven(true);
                          }}
                          style={{
                            ...styles.button,
                            padding: '8px 16px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                          }}
                        >
                          {Icons.block} No
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: '#22c55e' }}>Thanks for your feedback!</span>
                    )}
                  </div>
                  {(mlFeedback.correct > 0 || mlFeedback.incorrect > 0) && (
                    <div style={{ marginTop: '12px', fontSize: '0.85rem', color: colors.textMuted }}>
                      Session stats: {mlFeedback.correct} correct, {mlFeedback.incorrect} incorrect
                      {mlFeedback.correct + mlFeedback.incorrect > 0 && (
                        <span> ({Math.round((mlFeedback.correct / (mlFeedback.correct + mlFeedback.incorrect)) * 100)}% accuracy)</span>
                      )}
                    </div>
                  )}
                  <div style={{ marginTop: '12px', fontSize: '0.8rem', color: colors.textMuted, fontStyle: 'italic' }}>
                    In production, this feedback would be stored and used to periodically retrain the model for improved accuracy.
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: '30px', padding: '20px', background: colors.bgSecondary, borderRadius: '12px' }}>
              <h4 style={{ color: colors.textMuted, marginTop: 0 }}>Usage Example</h4>
              <pre style={{ ...styles.terminal, margin: 0, background: colors.terminal, color: theme === 'dark' ? '#e0e0e0' : '#fff' }}>
{`// Import ML module
import { ToxicityDetector, HybridFilter } from 'glin-profanity/ml';

// Standalone ML detector
const detector = new ToxicityDetector({ threshold: ${mlThreshold} });
await detector.loadModel();
const result = await detector.analyze('some text');

// Hybrid filter (rules + ML)
const filter = new HybridFilter({
  languages: ['english'],
  detectLeetspeak: true,
  enableML: true,
  mlThreshold: ${mlThreshold},
});
await filter.initialize();
const result = await filter.checkProfanityAsync('text');`}
              </pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '40px', color: colors.textMuted, fontSize: '0.85rem' }}>
          <p>
            <strong>glin-profanity</strong> v3.x | Built with TypeScript
          </p>
          <p>
            <a href="https://github.com/GLINCKER/glin-profanity" style={{ color: '#667eea' }}>
              GitHub
            </a>
            {' | '}
            <a href="https://www.npmjs.com/package/glin-profanity" style={{ color: '#667eea' }}>
              npm
            </a>
            {' | '}
            <a href="https://www.glincker.com/tools/glin-profanity" style={{ color: '#667eea' }}>
              Documentation
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
