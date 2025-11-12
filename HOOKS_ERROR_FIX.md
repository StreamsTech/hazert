# React Hooks Error Fix

## ❌ The Error

```
Error: Rendered more hooks than during the previous render.
```

**When it occurred:** When token invalidates and user is redirected to login

## 🔍 Root Cause

**React Rule Violation:** Hooks must be called in the **exact same order** on every render.

### The Problem Code (BEFORE):

```typescript
function LoginPage() {
  const { isAuthenticated, isLoading, signIn } = useBetterAuth() // Hook #1

  useEffect(() => { ... }, [])  // Hook #2

  // ❌ EARLY RETURN - stops execution here
  if (isLoading || isAuthenticated) {
    return <LoadingScreen />
  }

  // These hooks are ONLY called when NOT loading/authenticated
  const [formData, setFormData] = useState({...})  // Hook #3 (conditional!)
  const [errors, setErrors] = useState({})         // Hook #4 (conditional!)
  const [touched, setTouched] = useState({})       // Hook #5 (conditional!)
  // ... more hooks
}
```

**Why it breaks:**

| Render | isLoading | Hooks Called | Number of Hooks |
|--------|-----------|--------------|-----------------|
| 1st    | true      | useBetterAuth, useEffect | 2 hooks ✅ |
| 2nd    | false     | useBetterAuth, useEffect, useState x5 | 7 hooks ✅ |
| 3rd    | true      | useBetterAuth, useEffect | 2 hooks ❌ |

**On 3rd render:** React expects 7 hooks but only finds 2 → **ERROR!**

## ✅ The Fix

**Move ALL hooks BEFORE any early returns:**

```typescript
function LoginPage() {
  // ✅ ALL hooks at the top
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, signIn } = useBetterAuth()

  const [formData, setFormData] = useState({...})
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({...})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => { ... }, [isAuthenticated, isLoading, navigate])

  // ✅ Early return AFTER all hooks
  if (isLoading || isAuthenticated) {
    return <LoadingScreen message="Redirecting to dashboard" />
  }

  // Rest of component...
}
```

**Now all renders call the same hooks in the same order!**

## 📁 Files Fixed

1. ✅ `src/routes/login.tsx`
   - Moved all useState hooks before early return

2. ✅ `src/routes/signup.tsx`
   - Moved all useState hooks before early return

3. ✅ `src/routes/index.tsx`
   - Already correct (no hooks after early return)

## 🎯 React Hooks Rules

### Rule #1: Only Call Hooks at the Top Level
❌ **Don't** call hooks inside:
- Loops
- Conditions
- Nested functions

✅ **Do** call hooks at the top of your component

### Rule #2: Only Call Hooks from React Functions
- React function components
- Custom hooks

### Example of CORRECT Hook Usage:

```typescript
function MyComponent() {
  // ✅ ALL hooks first
  const [state1, setState1] = useState(0)
  const [state2, setState2] = useState('')
  const [state3, setState3] = useState(false)

  useEffect(() => { ... }, [])
  useEffect(() => { ... }, [state1])

  // ✅ THEN conditionals/early returns
  if (someCondition) {
    return <Loading />
  }

  // ✅ THEN event handlers/functions
  const handleClick = () => { ... }

  // ✅ THEN render
  return <div>...</div>
}
```

### Example of WRONG Hook Usage:

```typescript
function MyComponent() {
  const [state1, setState1] = useState(0)

  // ❌ Early return before all hooks
  if (someCondition) {
    return <Loading />
  }

  // ❌ This hook is conditional!
  const [state2, setState2] = useState('')

  // ❌ Hook in condition
  if (otherCondition) {
    const [state3, setState3] = useState(false)
  }

  // ❌ Hook in loop
  for (let i = 0; i < 10; i++) {
    useEffect(() => { ... }, [])
  }
}
```

## 🧪 How to Test the Fix

1. **Start the app:**
   ```bash
   pnpm dev
   ```

2. **Test token invalidation:**
   - Login to the app
   - Open DevTools → Application → Local Storage
   - Delete `access_token`
   - Navigate to any page
   - **Expected:** No hooks error, smooth redirect to login

3. **Test authenticated redirect:**
   - Login successfully
   - Manually visit `/login` or `/signup`
   - **Expected:** LoadingScreen shows, no errors, redirects to dashboard

## 📊 Before vs After

### Before (Broken):
```
Render 1: isLoading=true  → 2 hooks called ✅
Render 2: isLoading=false → 7 hooks called ✅
Render 3: isLoading=true  → 2 hooks called ❌ ERROR!
```

### After (Fixed):
```
Render 1: isLoading=true  → 7 hooks called ✅
Render 2: isLoading=false → 7 hooks called ✅
Render 3: isLoading=true  → 7 hooks called ✅
```

**All renders always call the same 7 hooks in the same order!**

## 💡 Key Takeaway

**Always call ALL hooks at the top of your component, BEFORE any early returns or conditional logic!**

This ensures React can track hooks correctly across all renders.

## ✅ Status

- Fixed: `src/routes/login.tsx`
- Fixed: `src/routes/signup.tsx`
- Verified: `src/routes/index.tsx` (was already correct)
- TypeScript: ✅ No errors
- Build: ✅ Successful

**The hooks error is now resolved!** 🎉
