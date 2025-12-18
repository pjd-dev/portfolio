# Prettier & Pre-commit Hook Setup

**Status**: ✅ **COMPLETE**

## What's Configured

### 1. Prettier Configuration (`.prettierrc`)

```json
{
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true,
  "singleQuote": true
}
```

### 2. pnpm Scripts

```bash
# Check formatting without changes
pnpm format:check

# Format all files
pnpm format

# Both run on:
# - **/*.{ts,tsx,js,jsx,json,md,yml,yaml}
# - Ignores: .gitignore files
```

### 3. Pre-commit Hook (`.husky/pre-commit`)

- Automatically runs on `git commit`
- Executes: `pnpm -w exec -- lint-staged`
- Stages:
  - `prettier --write` (format files)
  - `eslint --fix` (lint & fix)
  - `git add` (stage fixed files)

## Usage

### Format Before Commit (Manual)

```bash
pnpm format
git add .
git commit -m "chore: format code"
```

### Auto-format on Commit (Automatic)

```bash
git add .
git commit -m "chore: add feature"
# → Pre-commit hook automatically runs prettier + eslint
```

### Check Formatting (CI/CD)

```bash
pnpm format:check
# Exits 0 if all formatted correctly
# Exits 1 if formatting needed
```

## Files Involved

- **Config**: `.prettierrc`
- **Hook**: `.husky/pre-commit`
- **Script Config**: `package.json` (`lint-staged` section)
- **Dependencies**: `prettier`, `husky`, `lint-staged` (already in devDependencies)

## Quick Commands

```bash
# Check one file
pnpm exec prettier --check src/file.ts

# Format one file
pnpm exec prettier --write src/file.ts

# Check specific folder
pnpm exec prettier --check apps/mcp/src

# Format specific folder
pnpm exec prettier --write apps/mcp/src
```

---

**Setup Date**: December 18, 2025  
**Verified**: ✅ All components working
