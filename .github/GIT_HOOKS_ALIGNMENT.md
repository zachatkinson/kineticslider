# Git Hooks and CI Alignment

This document outlines how our Git hooks align with CI/CD to ensure seamless development.

## Pre-commit Hook (Fast - ~5-10 seconds)
Runs on `git commit` via lint-staged:

1. **ESLint** - Fix and check linting (same as CI)
2. **Prettier** - Format files (same as CI)
3. **TypeScript** - Type check changed files (same as CI)
4. **Critical Tests** - Run only core unit tests when source files change

## Pre-push Hook (Moderate - ~30-60 seconds)
Runs on `git push`:

1. **Lint** - Full project lint (same as CI)
2. **Format Check** - Verify formatting (same as CI)
3. **Quick Tests** - Run unit/core/rendering tests with bail (subset of CI)
4. **Build** - Ensure project builds (same as CI)

## CI Pipeline (Complete - ~10-15 minutes)
Runs on GitHub:

1. **Security Scan** - Trivy + audit (CI only)
2. **Test & Quality**:
   - Lint, Format, TypeScript (same as hooks)
   - ALL unit/integration/core/rendering tests
   - Coverage enforcement (85%)
3. **E2E Tests** - 1488 tests across 12 shards (CI only)
4. **Performance** - Bundle size + Lighthouse (CI only)
5. **Accessibility** - WCAG compliance (CI only)

## Optimization Strategy

### Local (Git Hooks)
- **Fast feedback** - Catch issues before push
- **Subset of CI** - Only critical checks
- **Non-blocking** - Can bypass with `--no-verify` if needed

### CI
- **Comprehensive** - All tests and checks
- **Parallel** - Multiple jobs and shards
- **Blocking** - Must pass for merge

## Commands Reference

```bash
# Skip hooks if needed (use sparingly)
git commit --no-verify
git push --no-verify

# Run full CI locally
pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm test:e2e
```