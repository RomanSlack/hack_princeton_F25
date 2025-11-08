import { GameClient } from "./game";

const gameClient = new GameClient();
let connected = false;

// Backend API URL
const BACKEND_URL = 'http://localhost:8001';

// Store agent programs for visualization
let agentPrograms: Record<string, any> = {};

// Track current nodes for highlighting
let currentNodes: Record<string, string | null> = {};
let pollingInterval: number | null = null;
let currentlyViewingAgent: string | null = null;

// Call backend to register agents and start auto-stepping
async function startBackendAgents() {
    try {
        console.log('Registering agents in game...');
        const registerResponse = await fetch(`${BACKEND_URL}/register-agents-in-game`, {
            method: 'POST',
        });

        if (!registerResponse.ok) {
            const error = await registerResponse.json();
            console.warn('Failed to register agents:', error);
            return;
        }

        const registerData = await registerResponse.json();
        console.log('Agents registered:', registerData);

        // Store agent programs for visualization
        if (registerData.agent_programs) {
            agentPrograms = registerData.agent_programs;
            createAgentButtons();
        }

        console.log('Starting auto-stepping...');
        const autoStepResponse = await fetch(`${BACKEND_URL}/start-auto-stepping?step_delay=30.0`, {
            method: 'POST',
        });

        if (!autoStepResponse.ok) {
            const error = await autoStepResponse.json();
            console.warn('Failed to start auto-stepping:', error);
            return;
        }

        const autoStepData = await autoStepResponse.json();
        console.log('Auto-stepping started:', autoStepData);
    } catch (error) {
        console.warn('Backend agent system not available:', error);
    }
}

// Start polling for agent states
function startStatePolling() {
    if (pollingInterval) return; // Already polling

    pollingInterval = setInterval(async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/agents-state`);
            if (response.ok) {
                const data = await response.json();
                updateCurrentNodes(data.agents);
            }
        } catch (error) {
            console.warn('Failed to fetch agent states:', error);
        }
    }, 1000); // Poll every second

    console.log('Started polling for agent states');
}

// Stop polling
function stopStatePolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
        console.log('Stopped polling for agent states');
    }
}

// Update node highlighting based on current states
function updateCurrentNodes(agents: Record<string, any>) {
    Object.entries(agents).forEach(([agentId, state]) => {
        // Only update if we're currently viewing this agent's flowchart
        if (currentlyViewingAgent !== agentId) return;

        const oldNode = currentNodes[agentId];
        const newNode = state.current_node;

        if (oldNode !== newNode) {
            // Remove highlight from old node
            if (oldNode) {
                const oldBlock = document.querySelector(`[data-block-id="${oldNode}"]`);
                if (oldBlock) {
                    oldBlock.classList.remove('active-node');
                }
            }

            // Add highlight to new node
            if (newNode) {
                const newBlock = document.querySelector(`[data-block-id="${newNode}"]`);
                if (newBlock) {
                    newBlock.classList.add('active-node');
                }
            }

            currentNodes[agentId] = newNode;
        }
    });
}

// Create buttons for each agent
function createAgentButtons() {
    let agentPanel = document.getElementById('agent-panel');

    if (!agentPanel) {
        // Create the agent panel
        agentPanel = document.createElement('div');
        agentPanel.id = 'agent-panel';
        agentPanel.style.cssText = `
            position: fixed;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 8px;
        `;
        document.body.appendChild(agentPanel);
    }

    // Clear existing buttons
    agentPanel.innerHTML = '';

    // Create a button for each agent
    Object.entries(agentPrograms).forEach(([agentId, program]) => {
        const button = document.createElement('button');
        button.textContent = agentId;
        button.style.cssText = `
            padding: 10px 15px;
            background: #4a90e2;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: background 0.2s;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.background = '#357abd';
        });

        button.addEventListener('mouseleave', () => {
            button.style.background = '#4a90e2';
        });

        button.addEventListener('click', () => {
            showAgentFlowchart(agentId, program);
        });

        agentPanel.appendChild(button);
    });
}

// Show agent flowchart visualization
function showAgentFlowchart(agentId: string, program: any) {
    // Remove existing flowchart if any
    let existingFlowchart = document.getElementById('flowchart-viewer');
    if (existingFlowchart) {
        existingFlowchart.remove();
        currentlyViewingAgent = null;
        return; // Toggle off
    }

    // Set currently viewing agent
    currentlyViewingAgent = agentId;

    // Start polling if not already started
    if (!pollingInterval) {
        startStatePolling();
    }

    // Create flowchart viewer
    const viewer = document.createElement('div');
    viewer.id = 'flowchart-viewer';
    viewer.style.cssText = `
        position: fixed;
        left: 10px;
        top: 10px;
        bottom: 10px;
        width: 400px;
        background: rgba(0, 0, 0, 0.9);
        border-radius: 10px;
        padding: 20px;
        z-index: 999;
        overflow-y: auto;
        color: white;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    `;

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: #e74c3c;
        color: white;
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        cursor: pointer;
        font-size: 18px;
        font-weight: bold;
    `;
    closeBtn.addEventListener('click', () => {
        viewer.remove();
        currentlyViewingAgent = null;
    });
    viewer.appendChild(closeBtn);

    // Add title
    const title = document.createElement('h2');
    title.textContent = `Agent: ${agentId}`;
    title.style.cssText = 'margin: 0 0 20px 0; font-size: 20px;';
    viewer.appendChild(title);

    // Render flowchart
    renderFlowchart(viewer, program.blocks);

    document.body.appendChild(viewer);
}

// Render flowchart blocks
function renderFlowchart(container: HTMLElement, blocks: any[]) {
    const flowchartContainer = document.createElement('div');
    flowchartContainer.style.cssText = 'position: relative; width: 100%; min-height: 400px;';

    // Create block map for easy lookup
    const blockMap = new Map(blocks.map(b => [b.id, b]));

    // Position blocks in a flow layout
    const positions = layoutBlocks(blocks);

    // Create SVG for connections
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1;';
    flowchartContainer.appendChild(svg);

    // Create arrow marker
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead-flow');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '10');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3, 0 6');
    polygon.setAttribute('fill', '#888');
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);

    // Render blocks and connections
    blocks.forEach(block => {
        const pos = positions.get(block.id)!;
        const blockEl = createFlowchartBlock(block, pos);
        flowchartContainer.appendChild(blockEl);

        // Draw connections
        if (block.type === 'action' || block.type === 'tool') {
            if (block.next) {
                const targetPos = positions.get(block.next);
                if (targetPos) {
                    drawConnection(svg, pos, targetPos);
                }
            }
        } else if (block.type === 'agent') {
            if (block.tool_connections) {
                block.tool_connections.forEach((conn: any) => {
                    const targetPos = positions.get(conn.tool_id);
                    if (targetPos) {
                        drawConnection(svg, pos, targetPos);
                    }
                });
            }
        }
    });

    container.appendChild(flowchartContainer);
}

// Layout blocks in a visual flow
function layoutBlocks(blocks: any[]): Map<string, { x: number, y: number, width: number, height: number }> {
    const positions = new Map();
    let currentY = 0;

    // Group by type for initial layout
    const actionBlocks = blocks.filter(b => b.type === 'action');
    const agentBlocks = blocks.filter(b => b.type === 'agent');
    const toolBlocks = blocks.filter(b => b.type === 'tool');

    const blockWidth = 140;
    const blockHeight = 80;
    const verticalGap = 100;
    const horizontalGap = 180;

    // Layout action blocks at the top
    actionBlocks.forEach((block, i) => {
        positions.set(block.id, {
            x: i * horizontalGap + 10,
            y: currentY,
            width: blockWidth,
            height: blockHeight
        });
    });

    currentY += blockHeight + verticalGap;

    // Layout agent blocks in the middle
    agentBlocks.forEach((block, i) => {
        positions.set(block.id, {
            x: i * horizontalGap + 10,
            y: currentY,
            width: blockWidth,
            height: 100
        });
    });

    currentY += 100 + verticalGap;

    // Layout tool blocks at the bottom
    toolBlocks.forEach((block, i) => {
        positions.set(block.id, {
            x: i * horizontalGap + 10,
            y: currentY,
            width: blockWidth,
            height: blockHeight
        });
    });

    return positions;
}

// Create flowchart block element
function createFlowchartBlock(block: any, pos: { x: number, y: number, width: number, height: number }): HTMLElement {
    const blockEl = document.createElement('div');

    // Add data attribute for easy selection during highlighting
    blockEl.setAttribute('data-block-id', block.id);

    let color = '#888';
    if (block.type === 'action') color = '#10b981';
    else if (block.type === 'agent') color = '#f59e0b';
    else if (block.type === 'tool') color = '#3b82f6';

    blockEl.style.cssText = `
        position: absolute;
        left: ${pos.x}px;
        top: ${pos.y}px;
        width: ${pos.width}px;
        min-height: ${pos.height}px;
        background: ${color};
        color: white;
        padding: 10px;
        border-radius: 8px;
        font-size: 11px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        z-index: 10;
        transition: all 0.3s ease;
    `;

    if (block.type === 'action') {
        blockEl.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px; font-size: 12px;">${block.action_type}</div>
            <div style="opacity: 0.8; font-size: 10px;">Entry Point</div>
        `;
    } else if (block.type === 'agent') {
        const toolNames = block.tool_connections ? block.tool_connections.map((t: any) => t.tool_name).join(', ') : '';
        blockEl.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px; font-size: 12px;">Agent Block</div>
            <div style="opacity: 0.8; font-size: 10px; margin-bottom: 3px;">${block.model.split('/')[1] || block.model}</div>
            <div style="opacity: 0.9; font-size: 10px; font-style: italic; margin-top: 5px;">
                "${block.system_prompt.substring(0, 40)}${block.system_prompt.length > 40 ? '...' : ''}"
            </div>
            ${toolNames ? `<div style="opacity: 0.8; font-size: 10px; margin-top: 5px;">→ ${toolNames}</div>` : ''}
        `;
    } else if (block.type === 'tool') {
        const paramKeys = Object.keys(block.parameters);
        blockEl.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px; font-size: 12px; text-transform: uppercase;">${block.tool_type}</div>
            ${paramKeys.length > 0 ? `<div style="opacity: 0.8; font-size: 10px;">Params: ${paramKeys.join(', ')}</div>` : ''}
            <div style="opacity: 0.8; font-size: 10px; margin-top: 3px;">Action Tool</div>
        `;
    }

    return blockEl;
}

// Draw connection between blocks
function drawConnection(svg: SVGElement, from: any, to: any) {
    const fromX = from.x + from.width / 2;
    const fromY = from.y + from.height;
    const toX = to.x + to.width / 2;
    const toY = to.y;

    const midY = (fromY + toY) / 2;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = `M ${fromX} ${fromY} L ${fromX} ${midY} L ${toX} ${midY} L ${toX} ${toY}`;
    path.setAttribute('d', d);
    path.setAttribute('stroke', '#888');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('marker-end', 'url(#arrowhead-flow)');

    svg.appendChild(path);
}

async function init() {
    await gameClient.init();

    const menu = document.getElementById('menu')!;
    const playButton = document.getElementById('play-button')!;
    const spectateButton = document.getElementById('spectate-button')!;
    const usernameInput = document.getElementById('username-input')! as HTMLInputElement;
    const respawnButton = document.getElementById('respawn-button')!;

    playButton.addEventListener('click', async () => {
        if (connected) return;

        const username = usernameInput.value.trim() || 'Player';
        playButton.textContent = 'Connecting...';
        playButton.disabled = true;
        spectateButton.disabled = true;

        try {
            await gameClient.connect(username, false); // Not a spectator

            // Start backend agent system
            await startBackendAgents();

            menu.classList.remove('visible');
            connected = true;
        } catch (error) {
            console.error('Failed to connect:', error);
            playButton.textContent = 'Connection Failed - Retry';
            playButton.disabled = false;
            spectateButton.disabled = false;
        }
    });

    spectateButton.addEventListener('click', async () => {
        if (connected) return;

        const username = usernameInput.value.trim() || 'Spectator';
        spectateButton.textContent = 'Connecting...';
        spectateButton.disabled = true;
        playButton.disabled = true;

        try {
            await gameClient.connect(username, true); // Join as spectator

            // Start backend agent system
            await startBackendAgents();

            menu.classList.remove('visible');
            connected = true;
        } catch (error) {
            console.error('Failed to connect:', error);
            spectateButton.textContent = 'Connection Failed - Retry';
            spectateButton.disabled = false;
            playButton.disabled = false;
        }
    });

    respawnButton.addEventListener('click', () => {
        window.location.reload();
    });

    // Allow Enter key to play
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            playButton.click();
        }
    });
}

init();
