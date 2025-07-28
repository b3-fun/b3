# SDK Release Workflows

## 🚀 Automatic Alpha Releases (`publish-sdk-alpha.yml`)

**Trigger**: Push to `main` branch with changes in `packages/sdk/**`

- Automatically calculates next alpha version (e.g., `0.0.12-alpha.0`)
- Publishes to NPM with `@alpha` tag
- Creates git tags
- **No repository commits**

**Install**: `pnpm add @b3dotfun/sdk@alpha`

## 🎯 Manual Latest Releases (`publish-sdk-latest.yml`)

**Trigger**: Manual workflow dispatch in GitHub Actions

**Steps**:

1. Go to **Actions** → **"Publish SDK Latest"**
2. Click **"Run workflow"**
3. Enter new version (e.g., `0.0.12` for patch, `0.1.0` for minor, `1.0.0` for major)
4. Workflow handles everything automatically

**What it does**:

- Updates `package.json` with your specified version
- Commits version change to repository
- Publishes to NPM with `@latest` tag
- Creates git tags and GitHub releases

## 📋 Quick Reference

| Action            | How                          | Result           |
| ----------------- | ---------------------------- | ---------------- |
| **Development**   | Push to main                 | `0.0.12-alpha.0` |
| **Patch Release** | Manual trigger with `0.0.13` | `0.0.13`         |
| **Minor Release** | Manual trigger with `0.1.0`  | `0.1.0`          |
| **Major Release** | Manual trigger with `1.0.0`  | `1.0.0`          |
