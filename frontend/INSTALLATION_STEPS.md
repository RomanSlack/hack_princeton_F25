# Installation Steps for Scratch Builder

## Issue
The module imports are failing because the required dependencies haven't been installed yet.

## Required Dependencies

Run this command in the `/frontend` directory:

```bash
npm install zustand @dnd-kit/core @dnd-kit/modifiers @dnd-kit/sortable @dnd-kit/utilities nanoid
```

## What These Do

- **zustand** - Lightweight state management (replaces Redux)
- **@dnd-kit/core** - Core drag-and-drop functionality
- **@dnd-kit/modifiers** - Drag behavior modifiers (snap to cursor, etc.)
- **@dnd-kit/sortable** - Sortable list utilities
- **@dnd-kit/utilities** - Helper functions and CSS transforms
- **nanoid** - Tiny unique ID generator

## After Installation

1. Restart your Next.js dev server:
   ```bash
   npm run dev
   ```

2. Navigate to `/builder` in your browser

3. You should see:
   - Left sidebar with block palette
   - Infinite canvas workspace
   - Toolbar with zoom/save controls

## Troubleshooting

If you still get errors after installing:

1. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Verify tsconfig.json has paths:**
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```
   ✅ Already configured!

3. **Check file permissions:**
   ```bash
   ls -la src/components/palette/
   ls -la src/components/workspace/
   ```
   All files should be readable.

4. **TypeScript errors:**
   If you see TypeScript errors, try:
   ```bash
   npx tsc --noEmit
   ```
   This will show any type errors without building.

## Expected File Structure

After installation, your project should look like:

```
frontend/
├── src/
│   ├── app/
│   │   ├── builder/
│   │   │   └── page.tsx         ← New Scratch builder page
│   │   ├── lessons/
│   │   │   └── page.jsx
│   │   ├── layout.tsx
│   │   └── page.jsx
│   ├── components/
│   │   ├── palette/
│   │   │   ├── BlockChip.tsx
│   │   │   ├── BlockPalette.tsx
│   │   │   └── CategoryTabs.tsx
│   │   ├── workspace/
│   │   │   ├── BlockNode.tsx
│   │   │   ├── ContextMenu.tsx
│   │   │   ├── WorkspaceCanvas.tsx
│   │   │   └── WorkspaceToolbar.tsx
│   │   └── Navigation.jsx        ← Updated with Scratch Builder link
│   └── lib/
│       ├── blocks/
│       │   ├── definitions.ts
│       │   └── types.ts
│       ├── dnd/
│       │   └── dnd.ts
│       ├── geometry/
│       │   └── snap.ts
│       ├── persistence/
│       │   └── io.ts
│       └── store/
│           └── useWorkspaceStore.ts
├── package.json
├── tsconfig.json                 ← Updated with @/* paths
├── SCRATCH_BUILDER_README.md     ← Documentation
└── INSTALLATION_STEPS.md         ← This file
```

## Testing the Builder

Once everything is working:

1. **Drag a block from palette** - Should create it on canvas
2. **Drag blocks near each other** - Should auto-snap/connect
3. **Right-click a block** - Should show context menu
4. **Ctrl+Scroll** - Should zoom in/out
5. **Edit fields** - Click number/text fields to edit
6. **Keyboard shortcuts:**
   - Delete/Backspace - Delete selected block
   - Cmd/Ctrl+D - Duplicate
   - Arrow keys - Nudge position
   - Shift+Arrow - Nudge by grid (8px)

## Quick Start Commands

```bash
# 1. Install dependencies
cd frontend
npm install zustand @dnd-kit/core @dnd-kit/modifiers @dnd-kit/sortable @dnd-kit/utilities nanoid

# 2. Start dev server
npm run dev

# 3. Open browser
# Navigate to http://localhost:3000/builder
```

That's it! The Scratch-style builder should now be fully functional.
