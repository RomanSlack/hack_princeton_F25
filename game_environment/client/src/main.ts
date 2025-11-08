import { GameClient } from "./game";

const gameClient = new GameClient();
let connected = false;

// Backend API URL
const BACKEND_URL = 'http://localhost:8001';

// Store agent programs for visualization
let agentPrograms: Record<string, any> = {};

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
        return; // Toggle off
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
    closeBtn.addEventListener('click', () => viewer.remove());
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
    flowchartContainer.style.cssText = 'display: flex; flex-direction: column; gap: 15px;';

    // Group blocks by type
    const actionBlocks = blocks.filter(b => b.type === 'action');
    const agentBlocks = blocks.filter(b => b.type === 'agent');
    const toolBlocks = blocks.filter(b => b.type === 'tool');

    // Render entry points
    if (actionBlocks.length > 0) {
        const section = createSection('Entry Points', '#10b981');
        actionBlocks.forEach(block => {
            const blockEl = createBlockElement(block, '#10b981');
            section.appendChild(blockEl);
        });
        flowchartContainer.appendChild(section);
    }

    // Render agent blocks
    if (agentBlocks.length > 0) {
        const section = createSection('Agent Decisions', '#f59e0b');
        agentBlocks.forEach(block => {
            const blockEl = createBlockElement(block, '#f59e0b');
            section.appendChild(blockEl);
        });
        flowchartContainer.appendChild(section);
    }

    // Render tool blocks
    if (toolBlocks.length > 0) {
        const section = createSection('Actions', '#3b82f6');
        toolBlocks.forEach(block => {
            const blockEl = createBlockElement(block, '#3b82f6');
            section.appendChild(blockEl);
        });
        flowchartContainer.appendChild(section);
    }

    container.appendChild(flowchartContainer);
}

// Create section header
function createSection(title: string, color: string): HTMLElement {
    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom: 10px;';

    const header = document.createElement('h3');
    header.textContent = title;
    header.style.cssText = `
        font-size: 14px;
        font-weight: bold;
        color: ${color};
        margin: 0 0 10px 0;
        border-bottom: 2px solid ${color};
        padding-bottom: 5px;
    `;
    section.appendChild(header);

    return section;
}

// Create block element
function createBlockElement(block: any, color: string): HTMLElement {
    const blockEl = document.createElement('div');
    blockEl.style.cssText = `
        background: ${color};
        padding: 12px;
        border-radius: 5px;
        margin-bottom: 8px;
        font-size: 13px;
    `;

    // Block ID and type
    const header = document.createElement('div');
    header.style.cssText = 'font-weight: bold; margin-bottom: 5px;';

    if (block.type === 'action') {
        header.textContent = `${block.action_type}`;
        if (block.next) {
            const next = document.createElement('div');
            next.style.cssText = 'font-size: 11px; opacity: 0.8; margin-top: 3px;';
            next.textContent = `→ ${block.next}`;
            blockEl.appendChild(next);
        }
    } else if (block.type === 'agent') {
        header.textContent = `Agent: ${block.id}`;
        const model = document.createElement('div');
        model.style.cssText = 'font-size: 11px; opacity: 0.8;';
        model.textContent = `Model: ${block.model}`;
        blockEl.appendChild(model);

        const systemPrompt = document.createElement('div');
        systemPrompt.style.cssText = 'font-size: 11px; margin-top: 5px; font-style: italic;';
        systemPrompt.textContent = `"${block.system_prompt.substring(0, 60)}${block.system_prompt.length > 60 ? '...' : ''}"`;
        blockEl.appendChild(systemPrompt);

        if (block.tool_connections && block.tool_connections.length > 0) {
            const tools = document.createElement('div');
            tools.style.cssText = 'font-size: 11px; margin-top: 5px;';
            tools.textContent = `Tools: ${block.tool_connections.map((t: any) => t.tool_name).join(', ')}`;
            blockEl.appendChild(tools);
        }
    } else if (block.type === 'tool') {
        header.textContent = `${block.tool_type}`;
        const params = document.createElement('div');
        params.style.cssText = 'font-size: 11px; opacity: 0.8;';
        const paramKeys = Object.keys(block.parameters);
        if (paramKeys.length > 0) {
            params.textContent = `Params: ${paramKeys.join(', ')}`;
            blockEl.appendChild(params);
        }

        if (block.next) {
            const next = document.createElement('div');
            next.style.cssText = 'font-size: 11px; opacity: 0.8; margin-top: 3px;';
            next.textContent = `→ ${block.next}`;
            blockEl.appendChild(next);
        }
    }

    blockEl.insertBefore(header, blockEl.firstChild);
    return blockEl;
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
