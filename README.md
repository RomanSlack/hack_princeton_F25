<<<<<<< HEAD
# GPT Agent Builder

A minimal React application built with Vite and Tailwind CSS that allows you to visually design agent logic by dragging and connecting blocks on a canvas.

## Features

- **Drag and Drop Blocks**: Create agent logic by dragging blocks around the canvas
- **Auto-Connect**: Drag blocks near each other (within 80px) to automatically create connections
- **Editable Blocks**: Double-click any block to edit its label and description
- **Visual Connections**: SVG arrows dynamically update when blocks move
- **Export JSON**: Export your agent logic as JSON for further processing
- **Clean UI**: Built with Tailwind CSS for a modern, responsive interface

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build
```

The app will be available at `http://localhost:5173/`

## How to Use

### Adding Blocks

Click the colored buttons in the toolbar to add new blocks:
- **Start**: Starting point (green)
- **Attack**: Attack action (red)
- **Defend**: Defense action (blue)
- **Speak**: Communication action (purple)

### Moving Blocks

- Click and drag any block to move it around the canvas
- Blocks are constrained to the canvas boundaries

### Creating Connections

There are two ways to connect blocks:

1. **Connection Mode (Recommended)**:
   - Click the "Connect Mode" button in the toolbar (it will turn orange)
   - Click on a source block (it will highlight with an orange ring)
   - Move your mouse to see a live preview of the connection line
   - Click on a target block to create the connection
   - Click the button again to exit connection mode

2. **Auto-Connect**:
   - Drag a block near another block (within 80px)
   - When you release, a connection arrow will automatically be created

### Editing Blocks

- Double-click any block to open the edit popup
- Modify the label and description
- Click "Save" to apply changes or "Delete" to remove the block
- Use keyboard shortcuts:
  - `Esc` to close the popup
  - `Ctrl+Enter` to save changes

### Deleting Connections

Click on any connection arrow to delete it (a confirmation dialog will appear).

### Exporting

Click the "Export JSON" button to download your agent logic as a JSON file with the following structure:

```json
{
  "nodes": [
    {
      "id": 1,
      "label": "Start",
      "description": "Starting point",
      "position": { "x": 100, "y": 100 }
    }
  ],
  "connections": [
    { "from": 1, "to": 2 }
  ]
}
```

### Clearing the Canvas

Click "Clear Canvas" to remove all blocks and connections (with confirmation).

## Project Structure

```
/
├── src/
│   ├── components/
│   │   ├── Block.jsx          # Draggable block component
│   │   ├── Connections.jsx    # SVG arrow rendering
│   │   └── Popup.jsx          # Edit dialog component
│   ├── App.jsx                # Main application with state management
│   ├── main.jsx               # Application entry point
│   └── index.css              # Global styles + Tailwind directives
├── index.html                 # HTML template
├── tailwind.config.js         # Tailwind configuration
├── postcss.config.js          # PostCSS configuration
└── package.json               # Dependencies and scripts
```

## State Structure

The application maintains the following state:

```javascript
{
  nodes: [
    {
      id: number,           // Unique identifier
      label: string,        // Block label
      description: string,  // Block description
      x: number,           // X position on canvas
      y: number            // Y position on canvas
    }
  ],
  connections: [
    {
      from: number,  // Source node ID
      to: number     // Target node ID
    }
  ]
}
```

## Extending the Application

This application is designed to be easily extensible. Here are some ideas:

### Adding New Block Types

Edit [App.jsx](src/App.jsx) to add new block types:

```javascript
<button onClick={() => addNode('CustomAction')}>
  + Custom Action
</button>
```

### Customizing Block Colors

Edit [Block.jsx](src/components/Block.jsx) in the `getBlockColor` function:

```javascript
const colors = {
  Start: 'bg-green-100 border-green-400 text-green-800',
  CustomAction: 'bg-yellow-100 border-yellow-400 text-yellow-800',
  // Add more...
};
```

### AI Logic Integration

You can extend the exported JSON to include AI-specific properties:

```javascript
const data = {
  nodes: nodes.map(node => ({
    ...node,
    aiConfig: {
      model: 'gpt-4',
      temperature: 0.7,
      systemPrompt: node.description
    }
  })),
  connections
};
```

### Adding Execution Flow

Implement a traversal function to execute the agent logic:

```javascript
function executeAgent(nodes, connections) {
  // Start from nodes with label "Start"
  const startNodes = nodes.filter(n => n.label === 'Start');

  // Traverse connections and execute each node
  // Your AI logic here...
}
```

## Technologies Used

- **React 19**: UI framework
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **SVG**: Vector graphics for connections

## License

MIT

## Contributing

Feel free to submit issues and pull requests!
=======
# hack_princeton_F25 
>>>>>>> 2e1a46ba4f8a8aeb7539c184b134ac4c2ae2f143
