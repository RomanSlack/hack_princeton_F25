# Scratch-Style Block Builder

A complete Scratch-style visual programming interface built with Next.js, TypeScript, React, and @dnd-kit.

## Features

### Core Functionality
- **Left Palette**: Collapsible sidebar with categorized blocks
  - 8 categories: Motion, Looks, Events, Control, Sensing, Operators, Variables, MyBlocks
  - Search/filter blocks by name
  - Color-coded blocks by category
  - Drag blocks from palette to workspace

- **Workspace Canvas**:
  - Infinite canvas with grid background
  - Pan (drag on empty canvas)
  - Zoom (Ctrl/Cmd + Mouse Wheel) - 0.5x to 1.5x
  - Grid snapping (8px grid)
  - Block stacking and nesting
  - Auto-save to localStorage

### Block Types
- **Hat blocks** (Entry points): "when green flag clicked"
- **Stack blocks** (Commands): "move X steps", "say Hello"
- **C-blocks** (Loops/Control): "repeat N times", "if condition"
- **Reporter blocks** (Values): "answer", mathematical operators

### Interactions

#### Mouse/Touch
- **Drag from palette**: Creates new block instance on canvas
- **Drag existing block**: Moves block (and its chain)
- **Right-click block**: Context menu (Duplicate, Delete)
- **Auto-connect**: Blocks snap together when dragged nearby
- **Pan canvas**: Click and drag on empty space
- **Zoom**: Ctrl/Cmd + scroll wheel

#### Keyboard
- **Delete/Backspace**: Delete selected block
- **Cmd/Ctrl + D**: Duplicate selected block
- **Arrow keys**: Nudge block by 1px
- **Shift + Arrow keys**: Nudge block by 8px (grid snap)
- **Esc**: Close context menu

### Data Persistence
- **Auto-save**: Automatically saves to localStorage on every change
- **Manual save/load**: Toolbar buttons
- **Export/Import JSON**: Copy/paste workspace state

## File Structure

```
frontend/src/
├── lib/
│   ├── blocks/
│   │   ├── types.ts              # TypeScript type definitions
│   │   └── definitions.ts        # Block definitions (colors, fields, shapes)
│   ├── store/
│   │   └── useWorkspaceStore.ts  # Zustand state management
│   ├── dnd/
│   │   └── dnd.ts                # Drag-and-drop utilities
│   ├── geometry/
│   │   └── snap.ts               # Snapping logic
│   └── persistence/
│       └── io.ts                 # LocalStorage save/load
│
├── components/
│   ├── palette/
│   │   ├── CategoryTabs.tsx      # Category filter tabs
│   │   ├── BlockChip.tsx         # Draggable palette block
│   │   └── BlockPalette.tsx      # Left sidebar palette
│   └── workspace/
│       ├── BlockNode.tsx         # Workspace block instance
│       ├── WorkspaceCanvas.tsx   # Main canvas with DnD
│       ├── WorkspaceToolbar.tsx  # Top toolbar
│       └── ContextMenu.tsx       # Right-click menu
│
└── app/
    └── builder/
        └── page.tsx              # Main builder page
```

## Technologies

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Zustand** - State management
- **@dnd-kit** - Drag and drop
  - `@dnd-kit/core`
  - `@dnd-kit/modifiers`
  - `@dnd-kit/utilities`
  - `@dnd-kit/sortable`
- **nanoid** - Unique ID generation
- **Tailwind CSS** - Styling

## Installation

```bash
cd frontend
npm install zustand @dnd-kit/core @dnd-kit/modifiers @dnd-kit/sortable @dnd-kit/utilities nanoid
```

## Usage

1. Navigate to `/builder` in your app
2. Drag blocks from the left palette onto the canvas
3. Blocks will auto-snap together when moved close to each other
4. Double-click fields to edit values
5. Right-click blocks for context menu
6. Use keyboard shortcuts for faster editing

## Block Connections

### Stacking
Stack blocks connect vertically (top to bottom):
- Hat blocks → Stack blocks → Stack blocks
- Automatic snapping within 40px threshold

### Nesting
C-blocks (loops/if statements) have child slots:
- Drag blocks into the indented area
- Creates nested execution flow

## State Management

The workspace state is managed by Zustand and includes:
- `blocks`: Record of all block instances
- `zoom`: Current zoom level (0.5 - 1.5)
- `offset`: Pan offset {x, y}
- `selection`: Set of selected block IDs

### Actions
- `addInstanceFromType(type, x, y)` - Create new block
- `moveBlock(id, dx, dy)` - Move block
- `connectStack(topId, bottomId)` - Connect blocks vertically
- `setChild(parentId, childId)` - Nest block in C-block
- `deleteBlock(id)` - Delete block and its chain
- `duplicateStack(id)` - Duplicate entire chain
- `setField(id, key, value)` - Update block field value
- `exportJSON()` / `importJSON(data)` - Serialize/deserialize

## Adding New Blocks

Edit `/lib/blocks/definitions.ts`:

```typescript
{
  type: "motion_jump",           // Unique identifier
  label: "jump [height] units",  // Display label with [field] tokens
  category: "Motion",            // Category
  color: "#4C97FF",             // Hex color
  shape: "stack",               // hat | stack | c-block | reporter | boolean
  fields: [                      // Optional fields
    {
      key: "height",
      type: "number",
      default: 10,
      min: 0,
      max: 100,
      step: 1
    }
  ]
}
```

## JSON Export Format

```json
{
  "zoom": 1,
  "offset": { "x": 0, "y": 0 },
  "blocks": {
    "block-id-1": {
      "id": "block-id-1",
      "type": "events_when_flag_clicked",
      "x": 100,
      "y": 100,
      "values": {},
      "nextId": "block-id-2",
      "prevId": null,
      "childId": null
    }
  }
}
```

## Future Enhancements

- Visual snapping guides (magnet highlights)
- Auto-layout chains
- Mini-map navigation
- Multi-select with marquee
- Variables panel
- Custom block creator ("My Blocks")
- Undo/redo
- Backend integration for execution
- Block search by functionality
- Block templates/snippets
