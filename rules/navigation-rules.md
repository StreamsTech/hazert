# Navigation Implementation Rules

This document defines the specific implementation rules for navigation in this TanStack Start application, ensuring type safety and proper route handling.

## Required Navigation Patterns

### 1. TanStack Router Link Pattern for Dynamic Routes

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

### 2. Programmatic Navigation
```tsx
import { useNavigate } from "@tanstack/react-router";

const navigate = useNavigate();

// ✅ Correct: Use params object for dynamic routes
navigate({ 
  to: "/flat/$flatId", 
  params: { flatId } 
});

// ✅ Correct: Simple navigation
navigate({ to: "/dashboard" });

// ❌ Avoid: Template literals in programmatic navigation
navigate({ to: `/flat/${flatId}` });
```

### 3. Redirect Patterns
```tsx
import { redirect } from "@tanstack/react-router";

// ✅ In route beforeLoad
beforeLoad: async ({ location }) => {
  const session = await getSession();
  if (!session) {
    throw redirect({
      to: "/sign-in",
      search: {
        redirect: location.href,
      },
    });
  }
}

// ✅ With parameters
throw redirect({
  to: "/building/$buildingId",
  params: { buildingId: "123" }
});
```

## Implementation Rules

### ✅ Required Patterns

1. **Use params object** - For all parameterized routes, use the `params` object instead of template literals
2. **Type safety** - TanStack Router provides compile-time route validation
3. **Search parameters** - Use the `search` object for query parameters
4. **Consistent imports** - Import `Link`, `useNavigate`, and `redirect` from `@tanstack/react-router`
5. **Route matching** - Use the proper route path format with parameter placeholders (`$param`)

### ❌ Anti-patterns

1. **Template literals in to prop** - Don't use `to={`/route/${param}`}` for parameterized routes
2. **Manual URL construction** - Don't manually build URLs with string concatenation
3. **Direct window.location** - Avoid using `window.location.href` for internal navigation
4. **Inconsistent parameter naming** - Keep parameter names consistent between routes and navigation

## Route Definition Patterns

### 1. Route with Parameters
```tsx
// ✅ Correct route definition
export const Route = createFileRoute("/building/$buildingId/flat/$flatId")({
  component: FlatDetailPage,
});

// ✅ Accessing parameters
function FlatDetailPage() {
  const { buildingId, flatId } = Route.useParams();
  // Use parameters
}
```

### 2. Route with Validation
```tsx
// ✅ Route with parameter validation
export const Route = createFileRoute("/building/$buildingId")({
  params: {
    parse: (params) => ({
      buildingId: z.string().parse(params.buildingId),
    }),
    stringify: ({ buildingId }) => ({ buildingId }),
  },
  component: BuildingPage,
});
```

### 3. Protected Routes
```tsx
// ✅ Route with authentication check
export const Route = createFileRoute("/admin-dashboard")({
  beforeLoad: async ({ location }) => {
    const session = await authClient.getSession();
    if (!session.data?.session || session.data.user.role !== "admin") {
      throw redirect({
        to: "/sign-in",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: AdminDashboard,
});
```

## Navigation Component Examples

### 1. Navigation Menu
```tsx
function NavigationMenu() {
  return (
    <nav>
      <Link to="/" className="nav-link">
        Home
      </Link>
      <Link to="/dashboard" className="nav-link">
        Dashboard
      </Link>
      <Link 
        to="/building/$buildingId" 
        params={{ buildingId: selectedBuildingId }}
        className="nav-link"
      >
        Building Details
      </Link>
    </nav>
  );
}
```

### 2. Breadcrumb Navigation
```tsx
function Breadcrumb({ buildingId, flatId }: { buildingId: string; flatId?: string }) {
  return (
    <div className="breadcrumb">
      <Link to="/buildings">Buildings</Link>
      <span>/</span>
      <Link to="/building/$buildingId" params={{ buildingId }}>
        Building
      </Link>
      {flatId && (
        <>
          <span>/</span>
          <Link to="/flat/$flatId" params={{ flatId }}>
            Flat
          </Link>
        </>
      )}
    </div>
  );
}
```

### 3. Back Navigation
```tsx
function BackButton({ to, params }: { to: string; params?: Record<string, string> }) {
  return (
    <Link to={to} params={params} className="back-button">
      <ArrowLeft className="w-4 h-4" />
      Back
    </Link>
  );
}

// Usage
<BackButton 
  to="/building/$buildingId" 
  params={{ buildingId }} 
/>
```

## Search Parameters

### 1. Using Search Parameters
```tsx
// ✅ Define search schema
const searchSchema = z.object({
  page: z.number().default(1),
  search: z.string().optional(),
});

export const Route = createFileRoute("/buildings")({
  validateSearch: searchSchema,
  component: BuildingsPage,
});

// ✅ Access search parameters
function BuildingsPage() {
  const { page, search } = Route.useSearch();
  const navigate = useNavigate();
  
  const updateSearch = (newSearch: string) => {
    navigate({
      to: "/buildings",
      search: { page: 1, search: newSearch }
    });
  };
}
```

### 2. Search with Navigation
```tsx
// ✅ Update search parameters
<Link 
  to="/buildings"
  search={{ page: nextPage, search: currentSearch }}
>
  Next Page
</Link>
```

## Form Navigation Patterns

### 1. Form Success Navigation
```tsx
const handleSubmit = async (data: FormData) => {
  try {
    const result = await createBuilding(data);
    navigate({
      to: "/building/$buildingId",
      params: { buildingId: result.id }
    });
  } catch (error) {
    // Handle error
  }
};
```

### 2. Cancel Navigation
```tsx
<Link to="/building/$buildingId" params={{ buildingId }}>
  <Button variant="outline" type="button">
    Cancel
  </Button>
</Link>
```

## Error Handling

### 1. Route Not Found
```tsx
// Handle 404s gracefully
export const Route = createFileRoute("/building/$buildingId")({
  loader: async ({ params }) => {
    const building = await getBuilding(params.buildingId);
    if (!building) {
      throw new Error("Building not found");
    }
    return building;
  },
  errorComponent: ({ error }) => (
    <div className="error-page">
      <h1>Building Not Found</h1>
      <Link to="/buildings">Back to Buildings</Link>
    </div>
  ),
});
```

### 2. Navigation Errors
```tsx
const handleNavigation = async () => {
  try {
    navigate({
      to: "/protected-route",
      params: { id: resourceId }
    });
  } catch (error) {
    // Handle navigation errors (e.g., auth redirect)
    console.error("Navigation failed:", error);
  }
};
```

The params object approach ensures proper type safety and route matching with TanStack Router's type-safe routing system, preventing runtime errors and providing better developer experience.