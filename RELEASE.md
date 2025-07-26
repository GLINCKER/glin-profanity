# 🚀 Release Guidelines

This document outlines the release process and conventions for the Glin-Profanity monorepo.

## 📋 Release Types & Tagging

### Release Channels

| Channel | Description | npm Tag | PyPI Classifier | Use Case |
|---------|-------------|---------|-----------------|----------|
| **latest** | Stable releases for production | `latest` | `Production/Stable` | Production deployments |
| **beta** | Pre-release testing | `beta` | `Development Status :: 4 - Beta` | Testing & feedback |
| **alpha** | Early development | `alpha` | `Development Status :: 3 - Alpha` | Development testing |

### Version Format

We follow [Semantic Versioning (SemVer)](https://semver.org/):

```
MAJOR.MINOR.PATCH[-PRERELEASE]
```

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)
- **PRERELEASE**: `alpha.N`, `beta.N`, `rc.N`

## 🎯 Commit Conventions for Auto-Release

### Release Trigger Commits

Use these **exact** commit message prefixes to trigger automatic releases:

#### Latest (Stable) Releases
```bash
# Patch release (1.0.0 -> 1.0.1)
git commit -m "release: patch fix for profanity detection"

# Minor release (1.0.0 -> 1.1.0) 
git commit -m "release: minor add new language support"

# Major release (1.0.0 -> 2.0.0)
git commit -m "release: major breaking API changes"
```

#### Beta Releases
```bash
# Beta patch (1.0.0 -> 1.0.1-beta.1)
git commit -m "release: beta-patch experimental fix"

# Beta minor (1.0.0 -> 1.1.0-beta.1)
git commit -m "release: beta-minor new experimental feature"

# Beta major (1.0.0 -> 2.0.0-beta.1)
git commit -m "release: beta-major breaking changes testing"
```

#### Alpha Releases
```bash
# Alpha releases (1.0.0 -> 1.0.1-alpha.1)
git commit -m "release: alpha-patch early development fix"
git commit -m "release: alpha-minor early feature testing"
git commit -m "release: alpha-major early breaking changes"
```

### Non-Release Commits

These commits will **NOT** trigger releases:

```bash
# Regular development
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug in filter"
git commit -m "docs: update README"
git commit -m "test: add unit tests"
git commit -m "chore: update dependencies"
git commit -m "refactor: improve code structure"
```

## 🔄 Release Process Flow

### Automatic Release (Recommended)

1. **Develop & Test**
   ```bash
   git checkout -b feature/my-feature
   # Make your changes
   git commit -m "feat: add amazing feature"
   git push origin feature/my-feature
   ```

2. **Create PR & Merge**
   - Create PR to `main` branch
   - Pass all CI checks
   - Get code review approval
   - Merge to `main`

3. **Trigger Release**
   ```bash
   git checkout main
   git pull origin main
   
   # For stable release
   git commit -m "release: minor add amazing feature" --allow-empty
   git push origin main
   
   # For beta testing
   git commit -m "release: beta-minor test amazing feature" --allow-empty
   git push origin main
   ```

4. **Automatic CI/CD**
   - ✅ Detects release commit
   - ✅ Bumps version in both packages
   - ✅ Runs comprehensive tests
   - ✅ Builds both packages
   - ✅ Publishes to npm with correct tag
   - ✅ Publishes to PyPI with correct classifier
   - ✅ Creates GitHub release with changelog
   - ✅ Syncs versions across packages

### Manual Release (Emergency)

```bash
# Emergency hotfix release
npm run release:patch
# or
npm run release:minor
# or  
npm run release:major

# Beta release
npm run release:beta

# Alpha release
npm run release:alpha
```

## 📦 Package Distribution

### npm (JavaScript/TypeScript)

| Tag | Command | Description |
|-----|---------|-------------|
| `latest` | `npm install glin-profanity` | Latest stable version |
| `beta` | `npm install glin-profanity@beta` | Beta version for testing |
| `alpha` | `npm install glin-profanity@alpha` | Alpha version for early testing |

### PyPI (Python)

| Classifier | Command | Description |
|------------|---------|-------------|
| Stable | `pip install glin-profanity` | Latest stable version |
| Beta | `pip install glin-profanity --pre` | Beta version for testing |
| Alpha | `pip install glin-profanity --pre` | Alpha version for early testing |

## 🔀 Branching Strategy

### Main Branches
- **`main`**: Production-ready code, all releases come from here
- **`develop`**: Integration branch for features (optional)

### Release Flow
```
feature/xxx → main → release (triggered by commit message)
```

### Hotfix Flow
```
hotfix/xxx → main → release: patch hotfix description
```

## 📝 Changelog Generation

Changelogs are automatically generated based on commit messages:

### Commit Categories
- `feat:` → ✨ Features
- `fix:` → 🐛 Bug Fixes  
- `docs:` → 📚 Documentation
- `test:` → 🧪 Tests
- `chore:` → 🔧 Maintenance
- `refactor:` → ♻️ Code Refactoring
- `perf:` → ⚡ Performance
- `style:` → 💄 Styling

### Breaking Changes
```bash
git commit -m "feat!: breaking change in API
BREAKING CHANGE: The filter configuration now uses different property names"
```

## 🚨 Emergency Procedures

### Rollback Release
```bash
# Unpublish from npm (within 24 hours)
npm unpublish glin-profanity@1.2.3

# Revert git tag
git tag -d v1.2.3
git push origin :refs/tags/v1.2.3
```

### Skip CI Release
```bash
git commit -m "fix: urgent fix [skip ci]"
```

## 📊 Release Schedule

### Stable Releases
- **Patch**: As needed for critical fixes
- **Minor**: Bi-weekly for new features
- **Major**: Quarterly for breaking changes

### Beta Releases
- **Weekly**: For testing new features
- **Pre-release**: 1 week before stable release

### Alpha Releases
- **Daily**: For development testing
- **Experimental**: For trying new concepts

## ✅ Release Checklist

### Pre-Release
- [ ] All tests passing in CI
- [ ] Documentation updated
- [ ] CHANGELOG.md reviewed
- [ ] Breaking changes documented
- [ ] Version numbers synchronized
- [ ] Release notes prepared

### Post-Release
- [ ] npm package published correctly
- [ ] PyPI package published correctly
- [ ] GitHub release created
- [ ] Documentation deployed
- [ ] Community notified
- [ ] Social media updates

## 🤝 Contributing to Releases

### For Maintainers
1. Use the correct commit message format
2. Ensure cross-language parity
3. Update documentation
4. Test in both environments
5. Follow security best practices

### For Contributors
1. Focus on feature development
2. Don't use release commit messages
3. Let maintainers handle releases
4. Report any version sync issues

## 📞 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/GLINCKER/glin-profanity/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/GLINCKER/glin-profanity/discussions)
- 📧 **Email**: [hello@glincker.com](mailto:hello@glincker.com)

---

*Last updated: $(date +'%Y-%m-%d')*