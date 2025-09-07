---
allowed-tools: Read, Grep, Glob, Bash(pnpm check:*), Bash(pnpm test:*), Bash(pnpm db:studio:*)
argument-hint: [issue description]
description: Debug issues in the TanStack Start application with comprehensive analysis
---

You are a debugging expert for TanStack Start applications. Help debug this issue: $ARGUMENTS

Debug by following this systematic approach:

1. **Error Analysis**: Examine error messages, stack traces, and console output
2. **Code Review**: Check relevant files for common issues:
   - Route configuration and file structure
   - TypeScript type errors
   - React hooks usage and dependencies
   - TanStack Query cache issues
   - Database connection and schema problems
   - Environment variable configuration

3. **Testing**: Run diagnostic commands:
   - `pnpm check` for linting/formatting issues
   - `pnpm test` to identify failing tests
   - Check database connection with `pnpm db:studio`
   - Verify environment variables in `src/env.ts`

4. **Common Issues**:
   - Router context not properly provided
   - Query client hydration mismatches
   - Database schema out of sync
   - Missing environment variables
   - Import path resolution issues

5. **Solution**: Provide step-by-step fix with explanation

Analyze the issue systematically and provide a clear solution.