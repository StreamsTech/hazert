# React Query Implementation Rules

This document defines the specific implementation rules for React Query in this TanStack Start application, ensuring proper data fetching, caching, and state management patterns.

## Required React Query Structure

### 1. Always Use React Query for Data Fetching
```tsx
// ✅ Correct: Use useQuery for data fetching
const {
  data: usersResponse,
  isLoading,
  error,
} = useQuery({
  queryKey: ["admin-users"],
  queryFn: getUsers,
});

// ❌ Incorrect: Manual data fetching with useState
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchUsers().then(setUsers);
}, []);
```

### 2. Query Key Patterns
```tsx
// ✅ Correct: Descriptive, hierarchical query keys
const { data } = useQuery({
  queryKey: ["buildings", userId],
  queryFn: () => getUserBuildings(userId),
});

const { data } = useQuery({
  queryKey: ["building", buildingId],
  queryFn: () => getBuildingById(buildingId),
});

const { data } = useQuery({
  queryKey: ["building", buildingId, "flats"],
  queryFn: () => getBuildingFlats(buildingId),
});

// ❌ Incorrect: Generic or non-descriptive keys
const { data } = useQuery({
  queryKey: ["data"],
  queryFn: getUsers,
});
```

### 3. Mutation Patterns
```tsx
// ✅ Correct: Use useMutation with proper cache invalidation
const createUserMutation = useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    setIsCreateUserOpen(false);
  },
  onError: (error) => {
    console.error("Failed to create user:", error);
  },
});

// ❌ Incorrect: Manual state management
const handleCreateUser = async (data) => {
  setIsLoading(true);
  try {
    await createUser(data);
    loadUsers(); // Manual refetch
  } catch (error) {
    setError(error);
  }
  setIsLoading(false);
};
```

## Implementation Rules

### ✅ Required Patterns

1. **Query Keys** - Use descriptive, hierarchical query keys for better cache management
2. **Error Handling** - Handle loading states and errors properly with React Query
3. **Cache Invalidation** - Use `queryClient.invalidateQueries` after mutations
4. **Loading States** - Use React Query's built-in loading states instead of manual state
5. **Optimistic Updates** - Implement optimistic updates for better UX where appropriate
6. **Query Client** - Always use `useQueryClient` for cache manipulation
7. **Consistent Patterns** - Follow the same patterns across all components

### ❌ Anti-patterns

1. **Manual Loading States** - Don't use `useState` for loading when React Query provides it
2. **Manual Error Handling** - Don't duplicate error state management
3. **Generic Query Keys** - Don't use non-descriptive query keys
4. **Missing Cache Invalidation** - Don't forget to invalidate related queries after mutations
5. **Mixed State Management** - Don't mix React Query with manual data fetching
6. **Unnecessary Refetching** - Don't manually refetch data when cache invalidation is sufficient

## Data Fetching Patterns

### 1. Basic Query
```tsx
function UsersList() {
  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {users?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### 2. Query with Parameters
```tsx
function BuildingDetails({ buildingId }: { buildingId: string }) {
  const {
    data: building,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["building", buildingId],
    queryFn: () => getBuildingById(buildingId),
    enabled: !!buildingId, // Only run when buildingId is available
  });

  // Component implementation
}
```

### 3. Dependent Queries
```tsx
function UserBuildingsAndFlats({ userId }: { userId: string }) {
  const { data: buildings } = useQuery({
    queryKey: ["buildings", userId],
    queryFn: () => getUserBuildings(userId),
  });

  const selectedBuildingId = buildings?.[0]?.id;

  const { data: flats } = useQuery({
    queryKey: ["building", selectedBuildingId, "flats"],
    queryFn: () => getBuildingFlats(selectedBuildingId),
    enabled: !!selectedBuildingId,
  });

  return (
    <div>
      {/* Component implementation */}
    </div>
  );
}
```

## Mutation Patterns

### 1. Basic Mutation
```tsx
function CreateBuildingForm() {
  const queryClient = useQueryClient();

  const createBuildingMutation = useMutation({
    mutationFn: createBuilding,
    onSuccess: (newBuilding) => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      navigate({ to: "/building/$buildingId", params: { buildingId: newBuilding.id } });
    },
    onError: (error) => {
      console.error("Failed to create building:", error);
    },
  });

  const handleSubmit = (data: BuildingFormData) => {
    createBuildingMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button 
        type="submit" 
        disabled={createBuildingMutation.isPending}
      >
        {createBuildingMutation.isPending ? "Creating..." : "Create Building"}
      </button>
    </form>
  );
}
```

### 2. Optimistic Updates
```tsx
const updateBuildingMutation = useMutation({
  mutationFn: updateBuilding,
  onMutate: async (updatedBuilding) => {
    await queryClient.cancelQueries({ queryKey: ["building", buildingId] });
    
    const previousBuilding = queryClient.getQueryData(["building", buildingId]);
    
    queryClient.setQueryData(["building", buildingId], updatedBuilding);
    
    return { previousBuilding };
  },
  onError: (err, updatedBuilding, context) => {
    if (context?.previousBuilding) {
      queryClient.setQueryData(["building", buildingId], context.previousBuilding);
    }
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["building", buildingId] });
  },
});
```

### 3. Multiple Cache Updates
```tsx
const deleteFlatMutation = useMutation({
  mutationFn: deleteFlat,
  onSuccess: (deletedFlat) => {
    // Invalidate multiple related queries
    queryClient.invalidateQueries({ queryKey: ["building", buildingId, "flats"] });
    queryClient.invalidateQueries({ queryKey: ["building", buildingId] });
    queryClient.invalidateQueries({ queryKey: ["user-flats"] });
    
    // Remove specific flat from cache
    queryClient.removeQueries({ queryKey: ["flat", deletedFlat.id] });
  },
});
```

## Loading and Error States

### 1. Proper Loading States
```tsx
function BuildingsPage() {
  const { data: buildings, isLoading, error } = useQuery({
    queryKey: ["buildings"],
    queryFn: getBuildings,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="text-center">Loading buildings...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="text-center text-red-500">
            Error loading buildings: {error.message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-8">
        {/* Buildings content */}
      </div>
    </div>
  );
}
```

### 2. Button Loading States
```tsx
function ActionButtons({ userId }: { userId: string }) {
  const updateRoleMutation = useMutation({
    mutationFn: updateUserRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => updateRoleMutation.mutate({ userId, role: "admin" })}
        disabled={updateRoleMutation.isPending}
      >
        {updateRoleMutation.isPending ? "Updating..." : "Make Admin"}
      </Button>
    </div>
  );
}
```

## Advanced Patterns

### 1. Infinite Queries
```tsx
function InfiniteUsersList() {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["users"],
    queryFn: ({ pageParam = 0 }) => getUsers({ page: pageParam }),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length : undefined;
    },
  });

  return (
    <div>
      {data?.pages.map((group, i) => (
        <div key={i}>
          {group.users.map((user) => (
            <div key={user.id}>{user.name}</div>
          ))}
        </div>
      ))}
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? "Loading more..." : "Load More"}
      </button>
    </div>
  );
}
```

### 2. Query Prefetching
```tsx
function BuildingsList() {
  const queryClient = useQueryClient();
  const { data: buildings } = useQuery({
    queryKey: ["buildings"],
    queryFn: getBuildings,
  });

  const handleBuildingHover = (buildingId: string) => {
    queryClient.prefetchQuery({
      queryKey: ["building", buildingId],
      queryFn: () => getBuildingById(buildingId),
    });
  };

  return (
    <div>
      {buildings?.map((building) => (
        <div
          key={building.id}
          onMouseEnter={() => handleBuildingHover(building.id)}
        >
          {building.name}
        </div>
      ))}
    </div>
  );
}
```

## Query Client Setup

### 1. Provider Setup (usually in root)
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* App components */}
    </QueryClientProvider>
  );
}
```

### 2. Custom Hook Patterns
```tsx
// Custom hooks for common queries
export function useBuildings(userId: string) {
  return useQuery({
    queryKey: ["buildings", userId],
    queryFn: () => getUserBuildings(userId),
    enabled: !!userId,
  });
}

export function useBuilding(buildingId: string) {
  return useQuery({
    queryKey: ["building", buildingId],
    queryFn: () => getBuildingById(buildingId),
    enabled: !!buildingId,
  });
}

// Custom mutation hooks
export function useCreateBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBuilding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
    },
  });
}
```

This ensures consistent, efficient, and maintainable data fetching across the application using React Query's powerful caching and state management capabilities.