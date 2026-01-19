# GitHub Actions Workflows

This directory contains CI/CD workflows for the B3 SDK.

## Publishing Workflows

### 🔄 Alpha Releases (`publish-sdk-alpha.yml`)

**Trigger**: Automatic on push to `main` branch (when SDK files change)

Publishes pre-release versions to NPM with the `alpha` tag.

- **Version format**: `0.1.5-alpha.0`, `0.1.5-alpha.1`, etc.
- **Install**: `pnpm add @b3dotfun/sdk@alpha`
- **Purpose**: Testing and development

### 🚀 Latest Releases (`publish-sdk-latest.yml`)

**Trigger**: Manual via workflow dispatch

Publishes stable versions to NPM with the `latest` tag.

- **Version format**: `0.1.5`, `0.2.0`, etc.
- **Install**: `pnpm add @b3dotfun/sdk`
- **Purpose**: Production use

## NPM 2FA Support

Both workflows support NPM accounts with 2FA enabled using **Automation Tokens**.

### Quick Setup

1. Generate an **Automation Token** at [npmjs.com/settings/tokens](https://www.npmjs.com/settings/tokens)
2. Add it as `NPM_TOKEN` secret in GitHub repository settings
3. Workflows will automatically verify authentication

### Detailed Documentation

See [NPM_2FA_SETUP.md](./NPM_2FA_SETUP.md) for complete setup instructions, troubleshooting, and security best practices.

## Required Secrets

| Secret | Description | Required For |
|--------|-------------|--------------|
| `NPM_TOKEN` | NPM Automation Token (bypasses 2FA) | Both workflows |
| `APP_ID` | GitHub App ID | Latest releases only |
| `PRIVATE_KEY` | GitHub App Private Key | Latest releases only |

## Workflow Features

### Authentication Verification

Both workflows include automatic NPM authentication verification:

```yaml
if ! npm whoami > /dev/null 2>&1; then
  echo "❌ NPM authentication failed"
  exit 1
fi
```

This fails fast if the token is invalid, saving time and resources.

### Version Management

- **Alpha**: Auto-increments alpha versions (`0.1.5-alpha.0` → `0.1.5-alpha.1`)
- **Latest**: Uses version specified in workflow dispatch input

### Git Tagging

Both workflows automatically create and push git tags for published versions.

## Troubleshooting

### Authentication Errors

If you see `❌ NPM authentication failed`:

1. Verify you're using an **Automation** token (not Publish token)
2. Check the token hasn't expired or been revoked
3. Ensure the secret is named exactly `NPM_TOKEN`

See [NPM_2FA_SETUP.md](./NPM_2FA_SETUP.md) for detailed troubleshooting.

## Security

- ✅ Automation tokens bypass 2FA for CI/CD
- ✅ Tokens stored securely in GitHub Secrets
- ✅ Authentication verified before publishing
- ✅ Minimal permissions using GitHub Apps (latest workflow)

## Additional Resources

- [NPM Tokens Documentation](https://docs.npmjs.com/about-access-tokens)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
