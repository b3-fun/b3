# NPM 2FA Setup for CI/CD Publishing

This document explains how to set up NPM authentication with 2FA (Two-Factor Authentication) enabled for automated publishing in GitHub Actions.

## Overview

When 2FA is enabled on your NPM account, standard authentication tokens won't work for automated publishing. NPM provides **Automation Tokens** specifically for CI/CD pipelines that bypass 2FA requirements.

## Token Types

NPM offers different token types:

1. **Publish Token** - Requires 2FA for publishing (not suitable for CI/CD)
2. **Automation Token** - Bypasses 2FA for automated workflows ✅ **Use this for CI/CD**
3. **Read-only Token** - Only for reading packages

## Setup Instructions

### Step 1: Generate an Automation Token

1. Log in to [npmjs.com](https://www.npmjs.com)
2. Navigate to your account settings:
   - Click your profile picture → **Access Tokens**
   - Or visit: `https://www.npmjs.com/settings/[your-username]/tokens`

3. Click **Generate New Token**

4. Select **Automation** as the token type
   - This token type bypasses 2FA for automated publishing
   - It has the same permissions as a publish token but works in CI/CD

5. Give your token a descriptive name (e.g., `GitHub Actions - SDK Publishing`)

6. Click **Generate Token**

7. **IMPORTANT**: Copy the token immediately - you won't be able to see it again!

### Step 2: Add Token to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Paste the automation token you copied
6. Click **Add secret**

### Step 3: Verify the Setup

The workflows now include automatic verification:

```yaml
- name: Setup npm authentication
  run: |
    echo "//registry.npmjs.org/:_authToken=${{ secrets.NPM_TOKEN }}" > ~/.npmrc
    if ! npm whoami > /dev/null 2>&1; then
      echo "❌ NPM authentication failed. Please ensure NPM_TOKEN is a valid automation token."
      exit 1
    fi
    echo "✅ NPM authentication successful"
```

This step will:
- Configure NPM authentication
- Verify the token works by running `npm whoami`
- Fail the workflow early if authentication is incorrect

## Workflows Updated

The following workflows have been updated to support NPM 2FA:

1. **`publish-sdk-alpha.yml`** - Automatic alpha releases on main branch pushes
2. **`publish-sdk-latest.yml`** - Manual latest releases via workflow dispatch

## Security Best Practices

### Token Security

- ✅ **DO** use Automation tokens for CI/CD
- ✅ **DO** store tokens in GitHub Secrets (never commit them)
- ✅ **DO** use descriptive names for tokens to track their usage
- ✅ **DO** rotate tokens periodically (every 6-12 months)
- ❌ **DON'T** use Publish tokens in CI/CD (they require 2FA)
- ❌ **DON'T** share tokens between multiple projects
- ❌ **DON'T** commit tokens to the repository

### Token Rotation

When rotating tokens:

1. Generate a new automation token on NPM
2. Update the `NPM_TOKEN` secret in GitHub
3. Revoke the old token on NPM
4. Test the workflow to ensure it works

### Monitoring

- Regularly review active tokens in your NPM account settings
- Remove unused or expired tokens
- Monitor GitHub Actions logs for authentication failures

## Troubleshooting

### Authentication Failed Error

If you see `❌ NPM authentication failed`:

1. **Verify token type**: Ensure you created an **Automation** token, not a Publish token
2. **Check token validity**: The token might have expired or been revoked
3. **Verify secret name**: Ensure the GitHub secret is named exactly `NPM_TOKEN`
4. **Check permissions**: Ensure the token has publish permissions for `@b3dotfun/sdk`

### 2FA Prompt During Publish

If the workflow prompts for 2FA:

- You're using a Publish token instead of an Automation token
- Generate a new Automation token and update the secret

### Token Not Found

If you see authentication errors:

1. Verify the secret exists in GitHub repository settings
2. Ensure the secret name matches exactly (case-sensitive)
3. Check that the workflow has permission to access secrets

## Additional Resources

- [NPM Tokens Documentation](https://docs.npmjs.com/about-access-tokens)
- [NPM 2FA Documentation](https://docs.npmjs.com/configuring-two-factor-authentication)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

## Support

For issues with:
- **NPM tokens**: Contact NPM support or check their documentation
- **GitHub Actions**: Check the workflow logs and GitHub Actions documentation
- **This repository**: Open an issue or contact the maintainers
