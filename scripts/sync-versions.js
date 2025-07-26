#!/usr/bin/env node

/**
 * Script to synchronize versions between JavaScript and Python packages
 */

const fs = require('fs');
const path = require('path');

const JS_PACKAGE_PATH = path.join(__dirname, '../packages/js/package.json');
const PY_PACKAGE_PATH = path.join(__dirname, '../packages/py/pyproject.toml');
const PY_INIT_PATH = path.join(__dirname, '../packages/py/glin_profanity/__init__.py');

function getJSVersion() {
  const packageJson = JSON.parse(fs.readFileSync(JS_PACKAGE_PATH, 'utf8'));
  return packageJson.version;
}

function updatePythonVersion(version) {
  // Update pyproject.toml
  let pyproject = fs.readFileSync(PY_PACKAGE_PATH, 'utf8');
  pyproject = pyproject.replace(
    /dynamic = \["version"\]/,
    `version = "${version}"`
  );
  fs.writeFileSync(PY_PACKAGE_PATH, pyproject);

  // Update __init__.py
  let initFile = fs.readFileSync(PY_INIT_PATH, 'utf8');
  initFile = initFile.replace(
    /__version__ = "[^"]*"/,
    `__version__ = "${version}"`
  );
  fs.writeFileSync(PY_INIT_PATH, initFile);
}

function syncVersions() {
  const jsVersion = getJSVersion();
  console.log(`Syncing to version: ${jsVersion}`);
  
  updatePythonVersion(jsVersion);
  
  console.log('✅ Versions synchronized!');
  console.log(`📦 JavaScript: ${jsVersion}`);
  console.log(`🐍 Python: ${jsVersion}`);
}

if (require.main === module) {
  syncVersions();
}

module.exports = { syncVersions, getJSVersion };