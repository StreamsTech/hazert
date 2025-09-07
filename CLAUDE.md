# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📋 AI Development Rules

This project includes comprehensive development rules to ensure consistency, quality, and maintainability. **IMPORTANT**: Always follow these rules when working with this codebase.

When you add or edit some pages or code, always try to use the linting for that page and fix it iteratively.

### Core Rule Files (Located in `/rules/`)

1. **[Form Implementation Rules](./rules/form-rules.md)** - Required patterns for TanStack Form implementation with advanced composition
3. **[Navigation Rules](./rules/navigation-rules.md)** - TanStack Router navigation patterns
4. **[React Query Rules](./rules/react-query-rules.md)** - Data fetching and state management patterns

### Quick Reference

- **Navigation**: Use params object for dynamic routes, avoid template literals in `to` prop
- **Data Fetching**: Always use React Query, proper loading states, cache invalidation

## Development Commands

This project uses `pnpm` as the package manager. Essential commands:

```bash
# Development
pnpm dev          # Start dev server on port 3000
pnpm start        # Start production server
pnpm build        # Build for production
pnpm serve        # Preview production build

# Testing
pnpm test         # Run Vitest tests

# Code Quality (Biome)
pnpm check        # Run all checks (lint, format, organize imports)
pnpm lint         # Lint only
pnpm format       # Format entire project and write changes
```

# Additional Commands

don't run pnpm dev without my permission

## Tech Stack & Architecture

This is a TanStack Start application with a modern React stack:

- **Framework**: TanStack Start (full-stack React with file-based routing)
- **Routing**: TanStack Router with file-based routes in `src/routes/`
- **State Management**: TanStack Store with derived state support
- **Data Fetching**: TanStack Query integrated via context
- **UI Components**: Shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS v4
- **Type Safety**: TypeScript with T3 Env for environment variables
- **Code Quality**: Biome for linting/formatting (2-space indentation, double quotes)

## Key Architecture Patterns

### Routing & Context

- File-based routing in `src/routes/` with automatic route generation
- Root route (`__root.tsx`) provides QueryClient context to all routes
- Routes can use loaders for server-side data loading

#### Navigation Patterns

**IMPORTANT**: Always use the proper TanStack Router Link pattern for dynamic routes:

```tsx
// ✅ Correct: Use route path with params object
<Link to="/building/$buildingId/add-flat" params={{ buildingId }}>
  <Button>Add Flat</Button>
</Link>

// ✅ Correct: Always use params object for any parameterized route
<Link to="/flat/$flatId" params={{ flatId: flat.id }}>
  View Flat
</Link>

// ❌ Avoid: Template literals in `to` prop for ANY parameterized routes
<Link to={`/flat/${flat.id}`}>View Flat</Link>
<Link to={`/building/${buildingId}/add-flat`}>Add Flat</Link>
```

The params object approach ensures proper type safety and route matching with TanStack Router's type-safe routing system.

### State Management

- TanStack Store for global state (`src/lib/demo-store.ts`)
- Derived stores for computed state that auto-update
- React hooks integration with `useStore`

### Data Fetching

- TanStack Query integrated via `src/integrations/tanstack-query/`
- QueryClient provided through router context
- Can use route loaders or useQuery hooks

#### Server Functions

**IMPORTANT**: Use TanStack Start server functions with proper validation for all database operations:

```typescript
// ✅ Correct: Server function with Zod validator
export const getBuildingWithFlats = createServerFn({
  method: "GET",
})
  .validator(
    z.object({
      buildingId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    // Database operations here
    return { building, flats };
  });

// ✅ Correct: Calling server functions
// In loaders:
loader: async ({ params }) => {
  return getBuildingWithFlats({ data: { buildingId: params.buildingId } });
}

// In components:
await addFlat({
  data: {
    buildingId,
    ...formData,
  },
});

// ❌ Avoid: Direct database calls in loaders
loader: async ({ params }) => {
  const data = await db.select()...  // Don't do this
}
```

Server functions ensure proper client/server separation and type safety.


### Application Architecture

**Feature-Based Structure**: Application organized by domain features in `src/features/`:

- **`src/features/auth/`** - Authentication system with forms, hooks, and components
- **`src/features/admin/`** - Admin dashboard with user management and server functions
- **`src/features/buildings/`** - Building and flat management with CRUD operations

**Key Architectural Patterns**:

- **Authentication Middleware**: All server functions use middleware for authentication (`isAuthenticated`, `requireAdmin`, `optionalAuthentication`)
- **Server Functions**: Located in `src/lib/server-functions/` with proper validation and error handling
- **Form Composition**: Advanced TanStack Form patterns with field components in `src/features/auth/components/form-components.tsx`
- **Route Protection**: Authentication guards in route definitions with proper redirects

### Component Structure

- UI components in `src/components/ui/` follow Shadcn patterns
- Feature components organized by domain in `src/features/[feature]/components/`
- Demo components prefixed with `demo.` (can be deleted)
- Tailwind CSS with utility-first approach

### Forms

- **IMPORTANT**: Follow the patterns defined in [`rules/form-rules.md`](./rules/form-rules.md) for all form implementations
- TanStack Form with composition patterns and advanced field components
- Form-level validation using Zod schemas
- Consistent field components with proper labeling
- Reference implementations in `src/features/auth/components/`

## Adding New Components

Use Shadcn CLI for new UI components:

```bash
pnpx shadcn@latest add [component-name]
```

## Claude Code Slash Commands

This project includes custom slash commands for Claude Code:

- `/commit` - Smart Git commit with conventional commit format, automatic staging, and quality checks
- `/feature` - Create new features following TanStack Start patterns with routes, components, and tests
- `/debug` - Comprehensive debugging assistant for TanStack Start applications
- `/deploy` - Deployment preparation with pre-flight checks and platform-specific guidance

Use these commands in Claude Code by typing `/` followed by the command name.

## Development Notes

- Auto-generated files like `routeTree.gen.ts` are ignored by Biome
- Demo files (prefixed with `demo`) can be safely removed
- Devtools available for Router, Query, and Store in development
- Path aliases configured via tsconfig paths

## Application Domain Model



**Key Business Logic**:

- Multi-language support (Bangla/English) for names and locations
- Comprehensive pagination for large datasets (10 items per page)

## Code Style Rules

- **Self-closing tags**: Always use self-closing syntax for empty HTML/JSX elements
  - ✅ Correct: `<div className="spinner" />`
  - ❌ Incorrect: `<div className="spinner"></div>`
- **CUID2 IDs**: Use `createId()` from `@paralleldrive/cuid2` for all entity IDs
- **TypeScript**: Strict type safety with Zod schemas for validation
- **Layout Height Pattern**: Since the application uses a grid layout with header/main/footer structure, always use `h-full` instead of `min-h-screen` for page containers
  - ✅ Correct: `<div className="h-full bg-gradient-to-br from-teal-50 via-slate-50 to-teal-100/50">`
  - ❌ Incorrect: `<div className="min-h-screen bg-gradient-to-br from-teal-50 via-slate-50 to-teal-100/50">`
  - This ensures proper height distribution within the grid layout structure defined in `_layout.tsx`
