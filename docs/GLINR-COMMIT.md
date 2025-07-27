# GLINR Commit Tool

Enhanced commit tool with semantic release integration using CommitWeave.

## Overview

GLINR Commit provides a streamlined way to create semantic commits that automatically trigger releases when pushed to main/release branches. It integrates with our custom version synchronization system and supports both JavaScript and Python package releases.

## Features

- 🎯 **Semantic Commit Format**: Emoji + conventional commit structure
- 🚀 **Automatic Release Detection**: Triggers version bumps based on commit types
- 📦 **Cross-Package Sync**: Keeps JavaScript and Python versions synchronized
- ⚡ **Fast Workflow**: One command creates commit and prepares release
- 🎨 **Rich Prompts**: Interactive prompts for type, scope, and description

## Quick Start

```bash
# Use the enhanced glinr-commit tool
npm run commit:glinr

# Show semantic release rules
npm run commit:rules

# Traditional commitweave (fallback)
npm run commit
```

## Semantic Release Rules

| Commit Type | Release Type | Description |
|-------------|--------------|-------------|
| `feat:`     | **minor**    | New features |
| `fix:`      | **patch**    | Bug fixes |
| `perf:`     | **patch**    | Performance improvements |
| `docs:`     | **patch**    | Documentation changes |
| `style:`    | **patch**    | Code style/formatting |
| `refactor:` | **patch**    | Code refactoring |
| `test:`     | **patch**    | Adding/updating tests |
| `chore:`    | **patch**    | Maintenance tasks |
| `BREAKING`  | **major**    | Breaking changes |

## Commit Format

```
{emoji} {type}({scope}): {subject}

{body}

{footer}
```

### Examples

```bash
✨ feat(core): add multi-language support
🐛 fix(filters): resolve case sensitivity issue  
⚡ perf(python): optimize dictionary loading
📚 docs: update API documentation
🔧 chore(deps): update dependencies
```

## Scopes

Available scopes for better organization:

- `core` - Core profanity detection engine
- `filters` - Text filtering and processing
- `multiframework` - Multi-framework integration
- `hooks` - React hooks and utilities
- `types` - TypeScript definitions
- `python` - Python package
- `javascript` - JavaScript/TypeScript package
- `tests` - Test suites
- `ci` - CI/CD configuration
- `docs` - Documentation
- `release` - Release automation
- `deps` - Dependencies

## Workflow

1. **Create Commit**: `npm run commit:glinr`
2. **Interactive Prompts**: Select type, scope, write description
3. **Auto-Release Check**: Tool checks if commit should trigger release
4. **Version Sync**: Automatically updates both JS and Python versions
5. **Push to Release**: Push to `main` or `release` branch
6. **CI/CD Takes Over**: GitHub Actions publishes to npm and PyPI

## Manual Release Commands

For direct version control:

```bash
# Patch release (2.1.0 → 2.1.1)
npm run release:patch

# Minor release (2.1.0 → 2.2.0)  
npm run release:minor

# Major release (2.1.0 → 3.0.0)
npm run release:major

# Beta releases
npm run release:beta        # 2.1.0 → 2.2.0-beta.1
npm run release:beta-patch  # 2.1.0 → 2.1.1-beta.1

# Alpha releases  
npm run release:alpha       # 2.1.0 → 2.2.0-alpha.1
npm run release:alpha-patch # 2.1.0 → 2.1.1-alpha.1
```

## Configuration

The tool uses `.commitweaverc.json` for configuration:

```json
{
  "preset": "glinr-commit",
  "config": {
    "semanticRelease": {
      "enabled": true,
      "releaseRules": [
        { "type": "feat", "release": "minor" },
        { "type": "fix", "release": "patch" }
      ]
    }
  }
}
```

## Integration with CI/CD

When commits are pushed to `main` or `release` branches:

1. **Auto-Release Workflow** detects semantic commits
2. **Version Bumping** occurs automatically
3. **Testing** runs (with warnings not blocking releases)
4. **Publishing** to npm and PyPI
5. **GitHub Releases** created with changelogs
6. **Tag Synchronization** across both packages

## Troubleshooting

### Version Sync Issues
```bash
# Check current versions
npm run version:status

# Force sync to specific version
npm run version:sync 2.1.0

# Validate version consistency
npm run version:validate
```

### Release Not Triggering
- Ensure commit follows semantic format
- Check you're on `main` or `release` branch
- Verify GitHub Actions have proper permissions
- Check workflow logs for errors

### Manual Recovery
```bash
# Force auto-release check
npm run release:auto

# Reset to synchronized state
npm run version:sync
```

## Benefits

- **Consistency**: Enforced semantic commit format
- **Automation**: Reduces manual release overhead
- **Synchronization**: Prevents version drift between packages
- **Visibility**: Clear release rules and automated changelogs
- **Flexibility**: Both automatic and manual release options

## Best Practices

1. **Use Descriptive Scopes**: Helps with changelog generation
2. **Write Clear Subjects**: Follow imperative mood ("add", not "added")
3. **Include Breaking Changes**: Use BREAKING CHANGE footer for majors
4. **Test Before Release**: Ensure tests pass before pushing
5. **Review Auto-Releases**: Check version bumps make sense

---

For more information, run `npm run commit:rules` or see the main project README.