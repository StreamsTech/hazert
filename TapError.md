# Click Propagation and State Reset Issues - Analysis & Solutions

## = Problem Overview

When clicking on UI controls (Layer Switcher, Pen Mode Toggle, Layer Controller checkboxes), three critical issues occur:

1. **Map click handler fires** ’ Shows "No station data found" error
2. **Pen button click triggers map click** ’ Tries to query station data
3. **Checkboxes don't stay checked/unchecked** ’ State resets to initial values

## <¯ Root Cause Analysis

### Issue 1: Click Events Still Propagating Despite `stopPropagation()`

**Why React's `stopPropagation()` Doesn't Work:**
- Leaflet uses its **own event system** separate from React's synthetic events
- `e.stopPropagation()` in React only stops propagation in React's event tree
- Leaflet's `useMapEvents` hook listens at the **native DOM level**
- UI controls are positioned **inside** `<MapContainer>` DOM element
- Native browser click events reach the map container regardless of React event handling

**Event Flow:**
```
User clicks checkbox
  “
React onClick fires ’ stopPropagation() (only stops React events)
  “
Native DOM click event still bubbles up
  “
Reaches MapContainer DOM element
  “
Leaflet's useMapEvents captures it
  “
MapClickHandler executes ’ setClickParams()
  “
useStationClick hook fires ’ API call ’ Error
```

### Issue 2: Checkbox State Resetting

**Critical Flow:**
```
1. Click checkbox ’ handleLayerToggle() ’ setLayerVisibility()
2. Simultaneously, click reaches map ’ MapClickHandler sets clickParams
3. useStationClick hook executes
4. API returns no features ’ throws "No station data found"
5. Error causes component re-render (error state changes)
6. State gets reset during re-render
```

**Possible Causes of State Reset:**
- Error boundary might unmount/remount component
- `useState` initialization running again on re-render
- React key change causing new component instance
- TanStack Query error state triggering full component refresh

### Issue 3: Pen Button Also Triggers Map Click

Same root cause as Issue 1 - Leaflet's event system captures native DOM clicks regardless of React's `stopPropagation()`.

---

## =¡ Solution Options

### Solution A: Leaflet Control System (Best Long-term)
**Approach:** Use Leaflet's native Control API for UI elements

**Pros:**
- UI controls exist outside map's event handling
- Proper Leaflet way to handle controls
- No event propagation issues

**Cons:**
- Requires refactoring all controls to use Leaflet Control API
- More complex React integration
- Higher effort

**Estimated Effort:** High (4-6 hours)

---

### Solution B: Check Click Target in MapClickHandler (Quick Fix)
**Approach:** Validate click target before processing in MapClickHandler

**Implementation:**
```javascript
MapClickHandler: {
  click: (e) => {
    // Check if click originated from UI control
    const target = e.originalEvent.target
    const clickedOnControl = target.closest('.layer-controller-prevent-click') ||
                            target.closest('.layer-switcher-prevent-click') ||
                            target.closest('.pen-toggle-prevent-click')

    if (clickedOnControl) return // Ignore UI control clicks

    // ... rest of handler
  }
}
```

**Pros:**
- Quick to implement
- No major refactoring needed
- Solves propagation issue

**Cons:**
- Relies on class names (brittle)
- Doesn't solve underlying architecture issue

**Estimated Effort:** Low (30 minutes)

---

### Solution C: Leaflet's DomEvent.disableClickPropagation (Medium Fix)
**Approach:** Use Leaflet's native method to disable click propagation on control elements

**Implementation:**
```javascript
useEffect(() => {
  const layerController = document.querySelector('.layer-controller')
  const layerSwitcher = document.querySelector('.layer-switcher')
  const penToggle = document.querySelector('.pen-toggle')

  if (layerController) L.DomEvent.disableClickPropagation(layerController)
  if (layerSwitcher) L.DomEvent.disableClickPropagation(layerSwitcher)
  if (penToggle) L.DomEvent.disableClickPropagation(penToggle)
}, [])
```

**Pros:**
- Uses Leaflet's native API (proper way)
- Works with existing structure
- Prevents all event propagation (not just React)

**Cons:**
- Requires accessing DOM elements directly
- useEffect timing issues (elements might not exist yet)
- Need to add class names to all controls

**Estimated Effort:** Medium (1-2 hours)

---

### Solution D: Fix State Reset Issue
**Approach:** Prevent clickParams from being set when clicking UI controls + better error handling

**Implementation Steps:**
1. Add class names to all UI control containers
2. Check click target before setting clickParams
3. Add proper error boundaries
4. Consider using `useRef` for layerVisibility if state continues to reset

**Pros:**
- Addresses root cause of state reset
- More robust error handling

**Cons:**
- Might need deeper investigation into why state resets

**Estimated Effort:** Medium (1-2 hours)

---

## =€ Recommended Solution: Immediate Fix (Solution B + D)

### Why This Approach:
1. **Low effort** - Can be implemented quickly
2. **Solves both issues** - Prevents map clicks AND state reset
3. **Minimal refactoring** - Works with existing code structure
4. **Can be upgraded later** - Doesn't prevent future implementation of Solution C

### Implementation Steps:

#### Step 1: Add Identifying Class Names to UI Controls
**Files:** `src/routes/index.tsx`
- LayerController: Add class `layer-controller-prevent-click`
- LayerSwitcher: Add class `layer-switcher-prevent-click`
- PenModeToggle: Add class `pen-toggle-prevent-click`

**Effort:** 5 minutes

#### Step 2: Update MapClickHandler to Check Click Target
**Files:** `src/routes/index.tsx`
- Add target validation at start of click handler
- Return early if click originated from UI control
- Log for debugging

**Effort:** 10 minutes

#### Step 3: Prevent setClickParams When Clicking Controls
**Files:** `src/routes/index.tsx`
- Ensure clickParams is NOT set when target check fails
- Add defensive checks

**Effort:** 5 minutes

#### Step 4: Add Better Error Handling to useStationClick
**Files:** `src/hooks/useMapLayers.ts`
- Modify error handling to not cause full re-render
- Consider silent failure for "No station found" errors
- Only show errors for actual API failures

**Effort:** 10 minutes

#### Step 5: Test All Scenarios
- Click Layer Controller checkboxes ’ Should toggle without error
- Click Layer Switcher ’ Should change layer without error
- Click Pen Mode button ’ Should toggle without error
- Click actual map ’ Should query station data correctly
- Click on station point ’ Should open bottom sheet

**Effort:** 10 minutes

---

## =Ë TODO List for Immediate Fix (Solution B + D)

### Total Estimated Effort: 40 minutes

- [ ] **Task 1**: Add class names to UI controls (5 min)
  - [ ] Add `layer-controller-prevent-click` to LayerController root div
  - [ ] Add `layer-switcher-prevent-click` to LayerSwitcher root div
  - [ ] Add `pen-toggle-prevent-click` to PenModeToggle root div

- [ ] **Task 2**: Update MapClickHandler click validation (10 min)
  - [ ] Add click target check at the start of MapClickHandler
  - [ ] Check if target has any of the prevent-click classes
  - [ ] Return early if click is on UI control
  - [ ] Add console.log for debugging

- [ ] **Task 3**: Verify clickParams protection (5 min)
  - [ ] Ensure setClickParams only called for valid map clicks
  - [ ] Add defensive null checks

- [ ] **Task 4**: Improve error handling in useStationClick (10 min)
  - [ ] Modify "No station found" error to be silent or less disruptive
  - [ ] Prevent error state from causing full component re-render
  - [ ] Consider using error boundary for API errors only

- [ ] **Task 5**: Testing (10 min)
  - [ ] Test checkbox toggling (should work without errors)
  - [ ] Test layer switcher (should work without errors)
  - [ ] Test pen mode toggle (should work without errors)
  - [ ] Test map click on empty area (should show error gracefully)
  - [ ] Test map click on station point (should open bottom sheet)

---

## =. Future Improvements (Optional)

### After Immediate Fix Works:

1. **Implement Solution C (Leaflet DomEvent)** - 1-2 hours
   - More robust than class name checking
   - Uses Leaflet's native API
   - Better architectural solution

2. **Refactor to Leaflet Controls (Solution A)** - 4-6 hours
   - Proper Leaflet way to handle UI controls
   - No event propagation issues at all
   - Cleaner separation of concerns

3. **Add Error Boundary Component**
   - Catch errors without unmounting entire component
   - Better user experience for API failures
   - Prevent state loss on errors

---

## =Ý Notes

- The current `stopPropagation()` calls can remain (they don't hurt)
- Solution B is a **tactical fix** to unblock development
- Solution C or A should be implemented for **production quality**
- The state reset issue is likely caused by the error ’ re-render cycle
- Once we prevent the unwanted API calls, the state should remain stable
