import { GameClient } from "./game";

const gameClient = new GameClient();
let connected = false;

// Backend API URL (for AI agent system)
// Uses environment variable or defaults to localhost
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

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

        console.log('Starting auto-stepping...');
        // No step_delay parameter - use backend .env default (STEP_DELAY)
        const autoStepResponse = await fetch(`${BACKEND_URL}/start-auto-stepping`, {
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

async function init() {
    await gameClient.init();

    const menu = document.getElementById('menu')!;
    const playButton = document.getElementById('play-button')!;
    const spectateButton = document.getElementById('spectate-button')!;
    const usernameInput = document.getElementById('username-input')! as HTMLInputElement;
    const respawnButton = document.getElementById('respawn-button')!;

    // Zone selection handling
    const zone1Button = document.getElementById('zone1-button')!;
    const zone2Button = document.getElementById('zone2-button')!;
    let selectedZone: "zone1" | "zone2" = "zone1";

    zone1Button.addEventListener('click', () => {
        selectedZone = "zone1";
        zone1Button.classList.add('selected');
        zone2Button.classList.remove('selected');
    });

    zone2Button.addEventListener('click', () => {
        selectedZone = "zone2";
        zone2Button.classList.add('selected');
        zone1Button.classList.remove('selected');
    });

    playButton.addEventListener('click', async () => {
        if (connected) return;

        const username = usernameInput.value.trim() || 'Player';
        playButton.textContent = 'Connecting...';
        playButton.disabled = true;
        spectateButton.disabled = true;

        try {
            await gameClient.connect(username, false, selectedZone); // Pass selected zone

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
