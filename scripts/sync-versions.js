#!/usr/bin/env node

/**
 * Version Synchronization Script
 * Keeps JavaScript and Python package versions in sync
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class VersionSync {
    constructor() {
        this.rootDir = path.resolve(__dirname, '..');
        this.jsPackagePath = path.join(this.rootDir, 'packages/js/package.json');
        this.pyPackagePath = path.join(this.rootDir, 'packages/py/pyproject.toml');
        this.pyInitPath = path.join(this.rootDir, 'packages/py/glin_profanity/__init__.py');
        this.rootPackagePath = path.join(this.rootDir, 'package.json');
    }

    /**
     * Get current version from JavaScript package
     */
    getJsVersion() {
        const packageJson = JSON.parse(fs.readFileSync(this.jsPackagePath, 'utf8'));
        return packageJson.version;
    }

    /**
     * Get current version from Python package
     */
    getPyVersion() {
        const pyprojectContent = fs.readFileSync(this.pyPackagePath, 'utf8');
        const versionMatch = pyprojectContent.match(/version = "(.*?)"/);
        return versionMatch ? versionMatch[1] : null;
    }

    /**
     * Update JavaScript package version
     */
    setJsVersion(version) {
        const packageJson = JSON.parse(fs.readFileSync(this.jsPackagePath, 'utf8'));
        packageJson.version = version;
        fs.writeFileSync(this.jsPackagePath, JSON.stringify(packageJson, null, 2) + '\n');
        
        // Also update root package.json
        const rootPackageJson = JSON.parse(fs.readFileSync(this.rootPackagePath, 'utf8'));
        rootPackageJson.version = version;
        fs.writeFileSync(this.rootPackagePath, JSON.stringify(rootPackageJson, null, 2) + '\n');
    }

    /**
     * Update Python package version
     */
    setPyVersion(version) {
        // Update pyproject.toml
        let pyprojectContent = fs.readFileSync(this.pyPackagePath, 'utf8');
        pyprojectContent = pyprojectContent.replace(
            /version = "(.*?)"/,
            `version = "${version}"`
        );
        fs.writeFileSync(this.pyPackagePath, pyprojectContent);

        // Update __init__.py
        let initContent = fs.readFileSync(this.pyInitPath, 'utf8');
        initContent = initContent.replace(
            /__version__ = "(.*?)"/,
            `__version__ = "${version}"`
        );
        fs.writeFileSync(this.pyInitPath, initContent);
    }

    /**
     * Bump version based on release type
     */
    bumpVersion(currentVersion, releaseType, channel = 'stable') {
        const [major, minor, patch] = currentVersion.split('-')[0].split('.').map(Number);
        let newVersion;

        switch (releaseType) {
            case 'major':
                newVersion = `${major + 1}.0.0`;
                break;
            case 'minor':
                newVersion = `${major}.${minor + 1}.0`;
                break;
            case 'patch':
                newVersion = `${major}.${minor}.${patch + 1}`;
                break;
            default:
                throw new Error(`Unknown release type: ${releaseType}`);
        }

        // Add prerelease identifier
        if (channel === 'beta') {
            newVersion += '-beta.1';
        } else if (channel === 'alpha') {
            newVersion += '-alpha.1';
        }

        // Handle prerelease increments
        if (currentVersion.includes('-')) {
            const [baseVersion, prerelease] = currentVersion.split('-');
            const [prereleaseType, prereleaseNumber] = prerelease.split('.');
            
            if (channel === prereleaseType) {
                // Increment prerelease number
                const newPrereleaseNumber = parseInt(prereleaseNumber) + 1;
                newVersion = `${baseVersion}-${prereleaseType}.${newPrereleaseNumber}`;
            }
        }

        return newVersion;
    }

    /**
     * Parse commit message to determine release type and channel
     */
    parseCommitMessage(message) {
        const releasePatterns = {
            'patch': /^release: patch /,
            'minor': /^release: minor /,
            'major': /^release: major /,
            'beta-patch': /^release: beta-patch /,
            'beta-minor': /^release: beta-minor /,
            'beta-major': /^release: beta-major /,
            'alpha-patch': /^release: alpha-patch /,
            'alpha-minor': /^release: alpha-minor /,
            'alpha-major': /^release: alpha-major /,
        };

        for (const [type, pattern] of Object.entries(releasePatterns)) {
            if (pattern.test(message)) {
                const [channel, releaseType] = type.includes('-') 
                    ? type.split('-') 
                    : ['stable', type];
                return { releaseType, channel };
            }
        }

        return null;
    }

    /**
     * Get npm dist tag for version
     */
    getNpmTag(version) {
        if (version.includes('-beta')) return 'beta';
        if (version.includes('-alpha')) return 'alpha';
        return 'latest';
    }

    /**
     * Get PyPI classifier for version
     */
    getPyPIClassifier(version) {
        if (version.includes('-alpha')) return '3 - Alpha';
        if (version.includes('-beta')) return '4 - Beta';
        return '5 - Production/Stable';
    }

    /**
     * Sync versions between packages
     */
    syncVersions(targetVersion = null) {
        const jsVersion = this.getJsVersion();
        const pyVersion = this.getPyVersion();

        console.log(`📦 Current versions:`);
        console.log(`   JavaScript: ${jsVersion}`);
        console.log(`   Python: ${pyVersion}`);

        if (targetVersion) {
            console.log(`🎯 Setting both packages to: ${targetVersion}`);
            this.setJsVersion(targetVersion);
            this.setPyVersion(targetVersion);
        } else if (jsVersion !== pyVersion) {
            console.log(`⚠️  Version mismatch detected!`);
            console.log(`🔄 Syncing Python version to match JavaScript: ${jsVersion}`);
            this.setPyVersion(jsVersion);
        } else {
            console.log(`✅ Versions are already synchronized`);
        }
    }

    /**
     * Release with automatic version bumping
     */
    release(releaseType, channel = 'stable') {
        const currentVersion = this.getJsVersion();
        const newVersion = this.bumpVersion(currentVersion, releaseType, channel);
        
        console.log(`🚀 Releasing new ${channel} ${releaseType} version`);
        console.log(`   ${currentVersion} → ${newVersion}`);
        
        // Update versions
        this.setJsVersion(newVersion);
        this.setPyVersion(newVersion);
        
        console.log(`✅ Version bumped to: ${newVersion}`);
        console.log(`📦 npm tag: ${this.getNpmTag(newVersion)}`);
        console.log(`🐍 PyPI classifier: ${this.getPyPIClassifier(newVersion)}`);
        
        return newVersion;
    }

    /**
     * Auto-release based on commit message
     */
    autoRelease() {
        try {
            // Get the last commit message
            const lastCommit = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
            console.log(`📝 Last commit: ${lastCommit}`);
            
            const releaseInfo = this.parseCommitMessage(lastCommit);
            
            if (releaseInfo) {
                const { releaseType, channel } = releaseInfo;
                console.log(`🎯 Detected ${channel} ${releaseType} release`);
                return this.release(releaseType, channel);
            } else {
                console.log(`ℹ️  No release pattern detected in commit message`);
                return null;
            }
        } catch (error) {
            console.error(`❌ Error in auto-release: ${error.message}`);
            return null;
        }
    }

    /**
     * Validate version format
     */
    validateVersion(version) {
        const semverRegex = /^(\d+)\.(\d+)\.(\d+)(-((alpha|beta)\.(\d+)))?$/;
        return semverRegex.test(version);
    }

    /**
     * Display current status
     */
    status() {
        const jsVersion = this.getJsVersion();
        const pyVersion = this.getPyVersion();
        
        console.log(`📊 Version Status:`);
        console.log(`┌─────────────────┬──────────────┐`);
        console.log(`│ Package         │ Version      │`);
        console.log(`├─────────────────┼──────────────┤`);
        console.log(`│ JavaScript      │ ${jsVersion.padEnd(12)} │`);
        console.log(`│ Python          │ ${pyVersion.padEnd(12)} │`);
        console.log(`└─────────────────┴──────────────┘`);
        
        if (jsVersion === pyVersion) {
            console.log(`✅ Versions are synchronized`);
        } else {
            console.log(`⚠️  Versions are out of sync!`);
        }
        
        console.log(`\n🏷️  Tags:`);
        console.log(`   npm: ${this.getNpmTag(jsVersion)}`);
        console.log(`   PyPI: Development Status :: ${this.getPyPIClassifier(jsVersion)}`);
    }
}

// CLI Interface
if (require.main === module) {
    const versionSync = new VersionSync();
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'sync':
            const targetVersion = args[1];
            versionSync.syncVersions(targetVersion);
            break;
            
        case 'release':
            const releaseType = args[1] || 'patch';
            const channel = args[2] || 'stable';
            if (!['patch', 'minor', 'major'].includes(releaseType)) {
                console.error(`❌ Invalid release type: ${releaseType}`);
                process.exit(1);
            }
            if (!['stable', 'beta', 'alpha'].includes(channel)) {
                console.error(`❌ Invalid channel: ${channel}`);
                process.exit(1);
            }
            versionSync.release(releaseType, channel);
            break;
            
        case 'auto':
            versionSync.autoRelease();
            break;
            
        case 'status':
            versionSync.status();
            break;
            
        case 'validate':
            const version = args[1];
            if (!version) {
                console.error(`❌ Please provide a version to validate`);
                process.exit(1);
            }
            if (versionSync.validateVersion(version)) {
                console.log(`✅ Version ${version} is valid`);
            } else {
                console.log(`❌ Version ${version} is invalid`);
                process.exit(1);
            }
            break;
            
        default:
            console.log(`
🔧 Version Sync Tool

Usage:
  node scripts/sync-versions.js <command> [options]

Commands:
  sync [version]           Sync versions between packages (optionally to specific version)
  release <type> [channel] Bump version and create release (patch|minor|major) [stable|beta|alpha]
  auto                     Auto-release based on last commit message
  status                   Show current version status
  validate <version>       Validate version format

Examples:
  node scripts/sync-versions.js sync
  node scripts/sync-versions.js sync 1.2.3
  node scripts/sync-versions.js release minor beta
  node scripts/sync-versions.js auto
  node scripts/sync-versions.js status
            `);
    }
}

module.exports = VersionSync;