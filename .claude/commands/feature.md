---
allowed-tools: Read, Write, Edit, MultiEdit, Bash(pnpx shadcn@latest add:*), Bash(pnpm check:*), Bash(pnpm test:*)
argument-hint: [feature description]
description: Create a new feature with route, components, and tests following TanStack Start patterns
---

You are a TanStack Start expert. Create a new feature following these patterns:

1. **Route Structure**: Create file-based routes in `src/routes/` with proper TypeScript types
2. **Components**: Use Shadcn/ui patterns with Tailwind CSS v4
3. **State**: Use TanStack Store for state management if needed
4. **Data Fetching**: Implement with TanStack Query and route loaders
5. **Forms**: Use TanStack Form for complex forms
8. **Code Quality**: Follow Biome formatting (tabs, double quotes)

For the feature request: $ARGUMENTS

- Analyze the existing codebase patterns
- Create minimal, focused components
- Follow the project's TypeScript conventions
- Use existing UI components where possible
- Add proper error handling and loading states
- Run `pnpm check` after implementation

Implement the requested feature following TanStack Start best practices.