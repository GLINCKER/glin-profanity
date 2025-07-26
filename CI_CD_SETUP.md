# 🚀 CI/CD Setup Guide for glin-profanity

This guide explains how to set up and use the automated CI/CD pipeline for the `glin-profanity` package.

## 📋 Prerequisites

1. **GitHub Repository Secrets**
2. **Branch Structure**
3. **Node.js 18+ for development**

## 🔐 Required GitHub Secrets

Add these secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

### Required Secrets

1. **`NPM_TOKEN`** (Required for publishing)
   ```bash
   # Generate an npm token at https://www.npmjs.com/settings/tokens
   # Choose "Automation" token type
   # Copy the token and add it as a GitHub secret
   ```

2. **`CODECOV_TOKEN`** (Optional, for coverage reporting)
   ```bash
   # Get token from https://codecov.io/
   # Add your repository and copy the token
   ```

### Setting up NPM_TOKEN

1. Go to [npmjs.com](https://www.npmjs.com) and log in
2. Navigate to **Access Tokens** in your account settings
3. Click **Generate New Token** > **Automation**
4. Copy the token (it starts with `npm_...`)
5. In GitHub: **Settings** > **Secrets and variables** > **Actions** > **New repository secret**
6. Name: `NPM_TOKEN`, Value: your token

## 🌳 Branch Strategy

```
main (development)
├── feature/new-feature
├── bugfix/issue-123
└── release (production-ready)
    └── Tagged releases (v2.1.0, etc.)
```

### Branch Rules

- **`main`**: Main development branch
  - All feature PRs target this branch
  - CI runs on every PR and push
  - Beta releases can be published from here

- **`release`**: Production release branch
  - Only merge to this when ready for release
  - Requires `publish` label on PR to trigger release
  - Triggers semantic versioning and npm publishing

## 🔄 Workflows Overview

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Pull requests to `main` or `release/**`
- Pushes to `main`

**What it does:**
- ✅ TypeScript type checking
- 🏗️ Builds both CommonJS and ESM versions
- 🧪 Runs Jest tests with coverage
- 📊 Uploads coverage to Codecov
- 🔒 Security audit with npm audit
- 💾 Creates build artifacts

### 2. Release Workflow (`.github/workflows/release.yml`)

**Triggers:**
- Manual workflow dispatch
- PR with `publish` label merged to `release` branch

**What it does:**
- 🔍 Validates release conditions
- 🧪 Runs comprehensive tests
- 📦 Publishes to npm using semantic-release
- 🏷️ Creates git tags
- 📝 Generates changelog
- 🎉 Creates GitHub release

## 🚀 How to Use

### Development Workflow

1. **Create a feature branch:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/my-new-feature
   ```

2. **Make changes and commit:**
   ```bash
   # Make your changes
   git add .
   git commit -m "feat: add new context-aware filtering"
   ```

3. **Push and create PR:**
   ```bash
   git push origin feature/my-new-feature
   # Create PR on GitHub targeting 'main'
   ```

4. **CI automatically runs:**
   - Tests must pass
   - Coverage is reported
   - Build artifacts are created

### Release Workflow

#### Option 1: Semantic Release (Recommended)

1. **Merge feature to main:**
   ```bash
   # PR gets merged to main
   ```

2. **Create release PR:**
   ```bash
   git checkout release
   git pull origin release
   git merge main
   git push origin release
   # Create PR from release to release (for tracking)
   ```

3. **Add `publish` label:**
   - Go to the PR on GitHub
   - Add the `publish` label
   - Merge the PR

4. **Automatic release:**
   - Semantic-release analyzes commits
   - Determines version bump (patch/minor/major)
   - Publishes to npm
   - Creates GitHub release

#### Option 2: Manual Release

1. **Go to Actions tab in GitHub**
2. **Select "🚀 Release & Publish" workflow**
3. **Click "Run workflow"**
4. **Choose version bump type:**
   - `patch`: Bug fixes (2.1.0 → 2.1.1)
   - `minor`: New features (2.1.0 → 2.2.0)
   - `major`: Breaking changes (2.1.0 → 3.0.0)
5. **Optional: Enable dry run for testing**

## 📝 Commit Message Format

Use [Conventional Commits](https://conventionalcommits.org/) for automatic versioning:

```bash
# Features (minor version bump)
git commit -m "feat: add context-aware profanity filtering"
git commit -m "feat(api): add new configuration options"

# Bug fixes (patch version bump)
git commit -m "fix: resolve memory leak in filter"
git commit -m "fix(build): correct ESM export paths"

# Breaking changes (major version bump)
git commit -m "feat!: redesign API for better performance"
git commit -m "feat(core)!: remove deprecated methods"

# Other types (no version bump)
git commit -m "docs: update README with new examples"
git commit -m "test: add more context-aware tests"
git commit -m "chore: update dependencies"
git commit -m "style: fix linting issues"
```

### Version Bump Rules

| Type | Example | Version Bump |
|------|---------|--------------|
| `feat` | New features | Minor (2.1.0 → 2.2.0) |
| `fix` | Bug fixes | Patch (2.1.0 → 2.1.1) |
| `perf` | Performance improvements | Patch (2.1.0 → 2.1.1) |
| `feat!` or `BREAKING CHANGE:` | Breaking changes | Major (2.1.0 → 3.0.0) |
| `docs`, `test`, `chore` | No release | No bump |

## 🏷️ GitHub Labels

Create these labels in your repository for better workflow management:

```bash
# Release labels
publish         # 🚀 Triggers release when PR is merged
breaking        # ⚠️ Indicates breaking changes
enhancement     # ✨ New features
bug            # 🐛 Bug fixes
documentation  # 📚 Documentation updates
security       # 🔒 Security fixes

# Status labels
ready-for-review    # ✅ PR is ready for review
work-in-progress   # 🚧 Still being worked on
needs-testing      # 🧪 Requires additional testing
```

## 📊 Monitoring and Artifacts

### Coverage Reports
- **Codecov**: Automatic coverage reporting
- **Artifacts**: Coverage reports available in workflow runs

### Build Artifacts
- **Build outputs**: CommonJS and ESM builds
- **Test results**: Jest test results and coverage
- **Package files**: Ready-to-publish npm package

### Release Artifacts
- **npm package**: Published to npmjs.com
- **GitHub releases**: Tagged releases with changelogs
- **Git tags**: Semantic version tags

## 🔧 Troubleshooting

### Common Issues

1. **Tests failing in CI but passing locally**
   ```bash
   # Run tests exactly like CI
   npm run test:ci
   ```

2. **Build failing in CI**
   ```bash
   # Check TypeScript errors
   npx tsc --noEmit
   
   # Run both builds
   npm run build
   ```

3. **Semantic release not working**
   - Check commit message format
   - Ensure `NPM_TOKEN` secret is set
   - Verify branch is `release`

4. **NPM publish permission denied**
   - Verify `NPM_TOKEN` is valid
   - Check npm package ownership
   - Ensure token has publish permissions

### Debug Commands

```bash
# Check package before publishing
npm pack --dry-run

# Validate semantic-release locally
npx semantic-release --dry-run

# Test workflow locally (with act)
act -j test

# Check coverage locally
npm run test:coverage
```

## 🎯 Example Scenarios

### Scenario 1: Bug Fix Release

```bash
# 1. Create fix branch
git checkout -b fix/memory-leak main

# 2. Make fix and commit
git commit -m "fix: resolve memory leak in context analyzer"

# 3. Create PR to main → CI runs
# 4. Merge PR to main
# 5. Create release PR to release branch
# 6. Add 'publish' label and merge
# Result: 2.1.0 → 2.1.1
```

### Scenario 2: Feature Release

```bash
# 1. Create feature branch
git checkout -b feat/new-language-support main

# 2. Implement feature
git commit -m "feat: add Spanish language support"

# 3. Create PR to main → CI runs
# 4. Merge PR to main  
# 5. Create release PR to release branch
# 6. Add 'publish' label and merge
# Result: 2.1.0 → 2.2.0
```

### Scenario 3: Breaking Change Release

```bash
# 1. Create breaking change branch
git checkout -b feat/api-redesign main

# 2. Implement breaking changes
git commit -m "feat!: redesign Filter API for better performance

BREAKING CHANGE: Filter constructor options have changed.
See migration guide for details."

# 3. Create PR to main → CI runs
# 4. Merge PR to main
# 5. Create release PR to release branch  
# 6. Add 'publish' label and merge
# Result: 2.1.0 → 3.0.0
```

### Scenario 4: Manual Emergency Release

```bash
# 1. Go to GitHub Actions
# 2. Select "🚀 Release & Publish"
# 3. Click "Run workflow"
# 4. Select branch: release
# 5. Choose: patch (for hotfix)
# 6. Leave dry_run: false
# 7. Click "Run workflow"
# Result: Immediate release
```

## 📈 Best Practices

1. **Always test locally first:**
   ```bash
   npm run build && npm run test:ci
   ```

2. **Use conventional commits for automatic versioning**

3. **Keep the release branch clean:**
   - Only merge when ready for production
   - Use `publish` label intentionally

4. **Monitor the CI/CD:**
   - Check workflow status
   - Review build artifacts
   - Watch coverage trends

5. **Use dry runs for testing:**
   - Test manual releases with `dry_run: true`
   - Verify semantic-release with `--dry-run`

## 🆘 Support

If you encounter issues with the CI/CD setup:

1. Check the [GitHub Actions logs](../../actions)
2. Review the [troubleshooting section](#🔧-troubleshooting)
3. Open an issue with the `ci/cd` label

---

**Happy Releasing! 🚀**