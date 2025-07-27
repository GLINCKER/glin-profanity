#!/usr/bin/env node

/**
 * GLINR Commit Tool
 * Enhanced commit tool with semantic release integration
 */

const { execSync } = require('child_process');
const path = require('path');

// Import the version sync utility
const VersionSync = require('./sync-versions.js');

class GlinrCommit {
    constructor() {
        this.versionSync = new VersionSync();
    }

    /**
     * Execute commitweave with glinr-commit preset
     */
    async commit() {
        try {
            console.log('🎯 GLINR Commit Tool');
            console.log('📝 Creating semantic commit with automatic release detection...\n');

            // Run commitweave with glinr-commit preset
            execSync('npx commitweave --preset glinr-commit', { 
                stdio: 'inherit',
                cwd: path.resolve(__dirname, '..')
            });

            // After commit, check if it should trigger a release
            console.log('\n🔍 Checking if commit should trigger release...');
            const releaseInfo = this.versionSync.autoRelease();
            
            if (releaseInfo) {
                console.log(`✅ Release triggered! New version: ${releaseInfo}`);
                console.log('🚀 Version synchronized across all packages');
                
                // Show release summary
                console.log('\n📋 Release Summary:');
                this.versionSync.status();
                
                console.log('\n💡 Next steps:');
                console.log('   1. Push to main/release branch to trigger CI/CD');
                console.log('   2. GitHub Actions will publish to npm and PyPI');
                console.log('   3. GitHub release will be created automatically');
            } else {
                console.log('ℹ️  No automatic release triggered');
                console.log('💡 Use conventional commit types (feat:, fix:) for auto-releases');
            }

        } catch (error) {
            console.error('❌ Commit failed:', error.message);
            process.exit(1);
        }
    }

    /**
     * Show semantic release rules
     */
    showRules() {
        console.log('📋 GLINR Semantic Release Rules:');
        console.log('');
        console.log('🎯 Release Types:');
        console.log('  feat:       → minor release (new features)');
        console.log('  fix:        → patch release (bug fixes)');
        console.log('  perf:       → patch release (performance improvements)');
        console.log('  docs:       → patch release (documentation)');
        console.log('  style:      → patch release (code style)');
        console.log('  refactor:   → patch release (code refactoring)');
        console.log('  test:       → patch release (tests)');
        console.log('  chore:      → patch release (maintenance)');
        console.log('  BREAKING:   → major release (breaking changes)');
        console.log('');
        console.log('🎨 Commit Format:');
        console.log('  {emoji} {type}({scope}): {subject}');
        console.log('');
        console.log('📦 Examples:');
        console.log('  ✨ feat(core): add multi-language support');
        console.log('  🐛 fix(filters): resolve case sensitivity issue');
        console.log('  ⚡ perf(python): optimize dictionary loading');
        console.log('  📚 docs: update API documentation');
        console.log('');
        console.log('🚀 Manual Release Commands:');
        console.log('  npm run release:patch   → 2.1.0 → 2.1.1');
        console.log('  npm run release:minor   → 2.1.0 → 2.2.0');
        console.log('  npm run release:major   → 2.1.0 → 3.0.0');
        console.log('  npm run release:beta    → 2.1.0 → 2.2.0-beta.1');
        console.log('  npm run release:alpha   → 2.1.0 → 2.2.0-alpha.1');
    }
}

// CLI Interface
if (require.main === module) {
    const glinrCommit = new GlinrCommit();
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'rules':
        case 'help':
        case '--help':
        case '-h':
            glinrCommit.showRules();
            break;
            
        default:
            glinrCommit.commit();
            break;
    }
}

module.exports = GlinrCommit;