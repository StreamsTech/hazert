# Flatsuite Project Blueprint


## TanStack Query Usage
- **QueryClient setup**: Created and provided via a dedicated integration.
```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function getContext() {
  const queryClient = new QueryClient();
  return { queryClient };
}

export function Provider({ children, queryClient }: { children: React.ReactNode; queryClient: QueryClient }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```
- **Router integration**: QueryClient is provided through the Router `Wrap` and passed in router context; SSR-query integration is enabled.
```tsx
import { createRouter as createTanstackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import * as TanstackQuery from "./integrations/tanstack-query/root-provider";
import { routeTree } from "./routeTree.gen";

export const createRouter = () => {
  const rqContext = TanstackQuery.getContext();
  const router = createTanstackRouter({
    routeTree,
    context: { ...rqContext },
    defaultPreload: "intent",
    Wrap: (props: { children: React.ReactNode }) => (
      <TanstackQuery.Provider {...rqContext}>{props.children}</TanstackQuery.Provider>
    ),
  });

  setupRouterSsrQueryIntegration({ router, queryClient: rqContext.queryClient });
  return router;
};
```
- **Devtools**: React Query devtools panel integrated into the custom TanStack devtools panel.
```tsx
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
export default { name: "Tanstack Query", render: <ReactQueryDevtoolsPanel /> };
```
- **Real in-project example **: Fetch lists with `useQuery`, execute actions with `useMutation`, and refresh cache with `invalidateQueries`.
```tsx
// src/features/admin/components/admin-dashboard.tsx (excerpt)
const queryClient = useQueryClient();

const { data: usersResponse, isLoading, error } = useQuery({
  queryKey: ["admin-users"],
  queryFn: getUsers,
});

const { data: flatRequests } = useQuery({
  queryKey: ["flat-requests"],
  queryFn: getAllFlatRequests,
});

const updateRoleMutation = useMutation({
  mutationFn: updateUserRole,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  },
});

const approveFlatRequestMutation = useMutation({
  mutationFn: approveFlatRequest,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["flat-requests"] });
  },
});
```
- **Example usage pattern**: Queries are typically colocated in hooks or route loaders. In this codebase, many data loads use Router loaders; mutations and flows can use custom hooks. Example custom hook leveraging auth session (built on Better Auth) with TanStack Query under the hood:
```tsx
// features/auth/hooks/use-auth.ts (excerpt)
const { data: session, isPending, refetch } = useSession();
```
- You can create domain hooks with `useQuery` and `useMutation` using `rqContext.queryClient` available via router context or `useQueryClient()`.

## TanStack Router Usage
- **Router creation**: `src/router.tsx` with `createRouter`, integrates Query + SSR.
- **Root route with context**: `src/routes/__root.tsx` declares context type and provides app shell, head, scripts, devtools.
```tsx
// src/routes/__root.tsx (excerpt)
import { createRootRouteWithContext } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
interface MyRouterContext { queryClient: QueryClient }
export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({ /* meta + links */ }),
  component: RootComponent,
  shellComponent: RootDocument,
});
```
- **Layouts**: `src/routes/_layout.tsx` defines a layout route wrapping children with `Navbar`/`Footer` and an `<Outlet />` region.
```tsx
export const Route = createFileRoute("/_layout")({ component: LayoutComponent });
```
- **Loaders and guards**: Protected routes use `beforeLoad` for auth and `loader` for data fetching.
```tsx
// building details
export const Route = createFileRoute("/_layout/building/$buildingId/")({
  beforeLoad: async () => { const session = await getServerSession(); if (!session) throw redirect({ to: "/sign-in" }); },
  loader: async ({ params }) => getBuildingWithFlats({ data: { buildingId: params.buildingId } }),
  component: BuildingDetailsPage,
});
```


- **Navigation patterns**: Always use params object for dynamic segments.
```tsx
<Link to="/flat/$flatId" params={{ flatId }} />
<Link to="/building/$buildingId/add-flat" params={{ buildingId }} />
```

## State Management
This project uses multiple patterns depending on scope:

- **TanStack Store**: Global derived state example.
```tsx
// src/lib/demo-store.ts
import { Derived, Store } from "@tanstack/store";
export const store = new Store({ firstName: "Jane", lastName: "Smith" });
export const fullName = new Derived({ fn: () => `${store.state.firstName} ${store.state.lastName}`, deps: [store] });
fullName.mount();
```
- **Zustand**: Feature-level state for admin flows.
```tsx
// src/features/admin/store/admin-store.ts
import { create } from "zustand";
export const useAdminStore = create((set) => ({
  newUserEmail: "", newUserName: "", newUserPassword: "", newUserRole: "user", isCreateUserOpen: false,
  searchTerm: "", roleFilter: "all", adminNotes: "",
  setNewUserEmail: (email) => set({ newUserEmail: email }),
  setRoleFilter: (filter) => set({ roleFilter: filter }),
  resetCreateUserForm: () => set({ newUserEmail: "", newUserName: "", newUserPassword: "", newUserRole: "user", isCreateUserOpen: false }),
}));
```
- **React Context**: Theming and forms.
```tsx
// src/components/theme-provider.tsx (excerpt)
const ThemeProviderContext = createContext<ThemeProviderState>(initialState);
export function ThemeProvider({ children, defaultTheme = "system", storageKey = "flatsuite-ui-theme" }: Props) {
  const [theme, setTheme] = useState<Theme>(/* localStorage + default */);
  useEffect(() => { /* apply class to <html> */ }, [theme]);
  return <ThemeProviderContext.Provider value={{ theme, setTheme }}>{children}</ThemeProviderContext.Provider>;
}
```
- **Domain hooks**: Encapsulate server interactions and navigation logic.
```tsx
// src/features/buildings/hooks/use-flat.ts (excerpt)
const handleUpdateFlat = async (flatId: string, data: FlatFormData) => {
  const isAdmin = session?.user?.role === "admin";
  if (isAdmin) await updateFlat({ data: { flatId, ...data } });
  else await requestUpdateFlat({ data: { flatId, ...data } });
  navigate({ to: "/flat/$flatId", params: { flatId } });
};
```

## Packages and How They’re Used
- **@tanstack/react-router**: File-based routing and navigation.
- **@tanstack/react-router-devtools**: Router devtools panel.
- **@tanstack/react-router-ssr-query**: Integrates React Query with Router for SSR.
- **@tanstack/react-start**: TanStack Start framework runtime.
- **@tanstack/router-plugin**: Build-time plugin for file-based routes.
- **@tanstack/react-query**: Data fetching, caching, and mutations.
- **@tanstack/react-query-devtools**: React Query devtools panel.
- **@tanstack/react-form**: Form state and validation helpers.
- **@tanstack/react-table**: Table utilities for data display.
- **@tanstack/store**: Minimal global store.
- **@tanstack/react-store**: React bindings for TanStack Store.
- **@tanstack/react-devtools**: Devtools host panel used to display multiple devtools.
- **@tanstack/match-sorter-utils**: Scoring/sorting helpers for search/filtering.
- **react, react-dom (19)**: Core React runtime and renderer.
- **zod**: Schema validation for forms and server inputs.
- **react-hook-form**: Form management.
- **@hookform/resolvers**: Zod resolver for RHF.
- **better-auth**: Authentication client SDK and session hooks.
- **drizzle-orm**: ORM for PostgreSQL.
- **drizzle-kit**: Drizzle migration and codegen CLI.
- **postgres**: PostgreSQL client used by Drizzle.
- **tailwindcss (v4)**: Utility-first CSS framework.
- **@tailwindcss/vite**: Tailwind v4 Vite plugin.
- **tailwind-merge**: Merge Tailwind class strings safely.
- **tw-animate-css**: Animation utilities for Tailwind.
- **shadcn/ui + Radix UI**: UI primitives and components used across `src/components/ui/*`.
  - Radix packages: `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-context-menu`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-hover-card`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-popover`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-scroll-area`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `@radix-ui/react-slider`, `@radix-ui/react-slot`, `@radix-ui/react-switch`, `@radix-ui/react-tabs`, `@radix-ui/react-toggle`, `@radix-ui/react-toggle-group`, `@radix-ui/react-tooltip`.
- **lucide-react**: Icon set used in UI.
- **cmdk**: Command palette component.
- **input-otp**: OTP input component.
- **vaul**: Drawer/sheet UI components.
- **embla-carousel-react**: Carousel UI.
- **recharts**: Charting library.
- **react-resizable-panels**: Resizable panel UI.
- **react-day-picker**: Date picker component.
- **framer-motion**: Animations and transitions.
- **fuse.js**: Client-side fuzzy search (used in building search UI).
- **date-fns**: Date utilities.
- **class-variance-authority**: Variant-based class composition for shadcn components.
- **clsx**: Conditional className utility.
- **vite-tsconfig-paths**: Resolves TS paths in Vite.
- **dotenv**: Loads env variables.
- **@t3-oss/env-core**: Runtime env schema validation.
- **@paralleldrive/cuid2**: Collision-resistant IDs for records.
- **@faker-js/faker**: Data generation for demos/tests.
- **next-themes**: Theme switching utilities (available; custom ThemeProvider is used).
- **sonner**: Toast notifications.

Dev dependencies:
- **@biomejs/biome**: Formatter and linter.
- **@tanstack/devtools-event-client**: Devtools event transport.
- **@testing-library/dom, @testing-library/react**: Testing utilities.
- **@types/react, @types/react-dom, @types/pg**: Type definitions.
- **@vitejs/plugin-react**: Vite React plugin.
- **jsdom**: DOM environment for tests.
- **tsx**: TS/ESM script runner.
- **typescript**: Type system and compiler.
- **vite**: Build tool and dev server.
- **vitest**: Test runner.
- **web-vitals**: Web performance metrics.

Install all runtime deps at once:
```bash
pnpm add @faker-js/faker @hookform/resolvers @paralleldrive/cuid2 @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-aspect-ratio @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible @radix-ui/react-context-menu @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-hover-card @radix-ui/react-label @radix-ui/react-menubar @radix-ui/react-navigation-menu @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-slot @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toggle @radix-ui/react-toggle-group @radix-ui/react-tooltip @t3-oss/env-core @tailwindcss/vite @tanstack/match-sorter-utils @tanstack/react-devtools @tanstack/react-form @tanstack/react-query @tanstack/react-query-devtools @tanstack/react-router @tanstack/react-router-devtools @tanstack/react-router-ssr-query @tanstack/react-start @tanstack/react-store @tanstack/react-table @tanstack/router-plugin @tanstack/store better-auth class-variance-authority clsx cmdk date-fns dotenv drizzle-kit drizzle-orm embla-carousel-react framer-motion fuse.js input-otp lucide-react next-themes postgres react react-day-picker react-dom react-hook-form react-resizable-panels recharts sonner tailwind-merge tailwindcss tw-animate-css vaul vite-tsconfig-paths zod zustand
```
Dev dependencies:
```bash
pnpm add -D @biomejs/biome @tanstack/devtools-event-client @testing-library/dom @testing-library/react @types/pg @types/react @types/react-dom @vitejs/plugin-react jsdom tsx typescript vite vitest web-vitals
```

## Coding Conventions (Project-Specific)
- **Routing**:
  - Use file-based routes in `src/routes/*` with `createFileRoute` and `createRootRouteWithContext`.
  - Use `beforeLoad` for auth guards and `loader` for prefetching server data.
  - Prefer `<Link to="/path/$param" params={{ param }} />` instead of string interpolation.
- **Query/Data**:
  - Central `QueryClient` via router context; SSR query integration enabled.
  - Consider colocating domain queries in hooks; prefer stable `queryKey`s.
- **State**:
  - Use lightweight TanStack Store for simple global state with `Derived`.
  - Use Zustand stores for feature-local UI and workflow state.
  - Use React Context for cross-cutting concerns like theme and form contexts.
- **Forms**:
  - Prefer `@tanstack/react-form` with `zod` validators; provide typed `AppField` wrappers.
- **UI**:
  - Use shadcn/ui and Radix primitives from `src/components/ui/*`.
  - TailwindCSS v4 utility classes; prefer semantic spacing and responsive classes.
- **Devtools**:
  - Unified devtools panel at root combines Router, Query, and Store panels in development.

## Minimal Examples
- **Route with guard + loader + navigation**
```tsx
export const Route = createFileRoute("/_layout/building/$buildingId/")({
  beforeLoad: async () => { const session = await getServerSession(); if (!session) throw redirect({ to: "/sign-in" }); },
  loader: async ({ params }) => getBuildingWithFlats({ data: { buildingId: params.buildingId } }),
  component: BuildingDetailsPage,
});
```
- **Zustand slice usage**
```tsx
const isOpen = useAdminStore((s) => s.isCreateUserOpen);
const setIsOpen = useAdminStore((s) => s.setIsCreateUserOpen);
```
- **Theme context**
```tsx
const { theme, setTheme } = useTheme();
setTheme("dark");
```

## shadcn/ui Components
To add a new component with the latest shadcn CLI:
```bash
pnpx shadcn@latest add button
```
