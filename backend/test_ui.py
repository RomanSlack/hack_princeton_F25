"""
Simple Flask UI for testing AI Agent API
Run: python test_ui.py
Then open: http://localhost:5000
"""

from flask import Flask, render_template_string, request, jsonify
import requests
import json

app = Flask(__name__)

GAME_SERVER = "http://localhost:8000"

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>AI Agent Control Panel</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 30px;
        }

        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 2.5em;
        }

        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 1.1em;
        }

        .status-bar {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
            gap: 15px;
        }

        .status-item {
            text-align: center;
        }

        .status-label {
            font-size: 0.9em;
            color: #666;
            margin-bottom: 5px;
        }

        .status-value {
            font-size: 1.5em;
            font-weight: bold;
            color: #667eea;
        }

        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }

        @media (max-width: 1000px) {
            .grid {
                grid-template-columns: 1fr;
            }
        }

        .panel {
            background: #f9f9f9;
            padding: 25px;
            border-radius: 15px;
            border: 2px solid #e0e0e0;
        }

        .panel h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 1.5em;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 600;
        }

        input, select, textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 1em;
            transition: border-color 0.3s;
        }

        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #667eea;
        }

        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 14px 30px;
            border-radius: 8px;
            font-size: 1.1em;
            cursor: pointer;
            width: 100%;
            font-weight: 600;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }

        button:active {
            transform: translateY(0);
        }

        .btn-danger {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .btn-success {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .response {
            background: #1e1e1e;
            color: #fff;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            overflow-x: auto;
            max-height: 400px;
            overflow-y: auto;
        }

        .response pre {
            margin: 0;
            white-space: pre-wrap;
            word-wrap: break-word;
        }

        .agents-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .agent-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 2px solid #e0e0e0;
        }

        .agent-info {
            flex: 1;
        }

        .agent-id {
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }

        .agent-stats {
            font-size: 0.9em;
            color: #666;
        }

        .quick-actions {
            display: flex;
            gap: 10px;
        }

        .quick-actions button {
            width: auto;
            padding: 8px 16px;
            font-size: 0.9em;
        }

        .success {
            color: #4caf50;
        }

        .error {
            color: #f44336;
        }

        .loading {
            opacity: 0.6;
            pointer-events: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎮 AI Agent Control Panel</h1>
        <p class="subtitle">Control AI agents in the battle royale game</p>

        <div class="status-bar">
            <div class="status-item">
                <div class="status-label">Server Status</div>
                <div class="status-value" id="serverStatus">...</div>
            </div>
            <div class="status-item">
                <div class="status-label">Players</div>
                <div class="status-value" id="playerCount">0</div>
            </div>
            <div class="status-item">
                <div class="status-label">AI Agents</div>
                <div class="status-value" id="agentCount">0</div>
            </div>
            <div class="status-item">
                <div class="status-label">Uptime</div>
                <div class="status-value" id="uptime">0s</div>
            </div>
        </div>

        <div class="grid">
            <!-- Register Agent -->
            <div class="panel">
                <h2>➕ Register New Agent</h2>
                <div class="form-group">
                    <label>Agent ID</label>
                    <input type="text" id="newAgentId" placeholder="bot_001" value="bot_001">
                </div>
                <div class="form-group">
                    <label>Username (optional)</label>
                    <input type="text" id="newAgentUsername" placeholder="AI Bot 1">
                </div>
                <button onclick="registerAgent()">Register Agent</button>
                <div class="response" id="registerResponse" style="display: none;"></div>
            </div>

            <!-- Move Command -->
            <div class="panel">
                <h2>🎯 Move Agent</h2>
                <div class="form-group">
                    <label>Agent ID</label>
                    <input type="text" id="moveAgentId" placeholder="bot_001" value="bot_001">
                </div>
                <div class="form-group">
                    <label>X (relative)</label>
                    <input type="number" id="moveX" placeholder="20" value="20">
                </div>
                <div class="form-group">
                    <label>Y (relative)</label>
                    <input type="number" id="moveY" placeholder="10" value="10">
                </div>
                <button onclick="moveAgent()">Move Agent</button>
                <div class="response" id="moveResponse" style="display: none;"></div>
            </div>

            <!-- Attack Command -->
            <div class="panel">
                <h2>⚔️ Attack Target</h2>
                <div class="form-group">
                    <label>Agent ID</label>
                    <input type="text" id="attackAgentId" placeholder="bot_001" value="bot_001">
                </div>
                <div class="form-group">
                    <label>Target ID</label>
                    <input type="text" id="targetId" placeholder="bot_002 or player_1" value="bot_002">
                </div>
                <button onclick="attackTarget()">Attack</button>
                <div class="response" id="attackResponse" style="display: none;"></div>
            </div>

            <!-- Collect Command -->
            <div class="panel">
                <h2>📦 Collect Items</h2>
                <div class="form-group">
                    <label>Agent ID</label>
                    <input type="text" id="collectAgentId" placeholder="bot_001" value="bot_001">
                </div>
                <button onclick="collectItems()">Collect Nearby Items</button>
                <div class="response" id="collectResponse" style="display: none;"></div>
            </div>

            <!-- Get State -->
            <div class="panel">
                <h2>📊 Get Agent State</h2>
                <div class="form-group">
                    <label>Agent ID</label>
                    <input type="text" id="stateAgentId" placeholder="bot_001" value="bot_001">
                </div>
                <button class="btn-success" onclick="getAgentState()">Get State</button>
                <div class="response" id="stateResponse" style="display: none;"></div>
            </div>

            <!-- Remove Agent -->
            <div class="panel">
                <h2>🗑️ Remove Agent</h2>
                <div class="form-group">
                    <label>Agent ID</label>
                    <input type="text" id="removeAgentId" placeholder="bot_001" value="bot_001">
                </div>
                <button class="btn-danger" onclick="removeAgent()">Remove Agent</button>
                <div class="response" id="removeResponse" style="display: none;"></div>
            </div>
        </div>

        <!-- Active Agents -->
        <div class="panel">
            <h2>🤖 Active Agents</h2>
            <div id="agentsList" class="agents-list">
                <p style="text-align: center; color: #999;">No agents registered yet</p>
            </div>
        </div>
    </div>

    <script>
        const API_BASE = '/api';

        // Update status periodically
        function updateStatus() {
            fetch(`${API_BASE}/status`)
                .then(r => r.json())
                .then(data => {
                    document.getElementById('serverStatus').textContent = data.online ? '🟢 Online' : '🔴 Offline';
                    document.getElementById('playerCount').textContent = data.players;
                    document.getElementById('agentCount').textContent = data.aiAgents;
                    document.getElementById('uptime').textContent = Math.floor(data.uptime) + 's';
                })
                .catch(err => {
                    document.getElementById('serverStatus').textContent = '🔴 Offline';
                });
        }

        function showResponse(elementId, data, isError = false) {
            const el = document.getElementById(elementId);
            el.style.display = 'block';
            el.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
            if (isError) {
                el.style.borderLeft = '4px solid #f44336';
            } else {
                el.style.borderLeft = '4px solid #4caf50';
            }
        }

        async function registerAgent() {
            const agentId = document.getElementById('newAgentId').value;
            const username = document.getElementById('newAgentUsername').value;

            try {
                const response = await fetch(`${API_BASE}/agent/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ agent_id: agentId, username: username || undefined })
                });
                const data = await response.json();
                showResponse('registerResponse', data, !response.ok);
                updateStatus();
            } catch (err) {
                showResponse('registerResponse', { error: err.message }, true);
            }
        }

        async function moveAgent() {
            const agentId = document.getElementById('moveAgentId').value;
            const x = parseFloat(document.getElementById('moveX').value);
            const y = parseFloat(document.getElementById('moveY').value);

            try {
                const response = await fetch(`${API_BASE}/agent/command`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        agent_id: agentId,
                        action: {
                            tool_type: 'move',
                            parameters: { x, y }
                        }
                    })
                });
                const data = await response.json();
                showResponse('moveResponse', data, !response.ok);
            } catch (err) {
                showResponse('moveResponse', { error: err.message }, true);
            }
        }

        async function attackTarget() {
            const agentId = document.getElementById('attackAgentId').value;
            const targetId = document.getElementById('targetId').value;

            try {
                const response = await fetch(`${API_BASE}/agent/command`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        agent_id: agentId,
                        action: {
                            tool_type: 'attack',
                            parameters: { target_player_id: targetId }
                        }
                    })
                });
                const data = await response.json();
                showResponse('attackResponse', data, !response.ok);
            } catch (err) {
                showResponse('attackResponse', { error: err.message }, true);
            }
        }

        async function collectItems() {
            const agentId = document.getElementById('collectAgentId').value;

            try {
                const response = await fetch(`${API_BASE}/agent/command`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        agent_id: agentId,
                        action: {
                            tool_type: 'collect',
                            parameters: {}
                        }
                    })
                });
                const data = await response.json();
                showResponse('collectResponse', data, !response.ok);
            } catch (err) {
                showResponse('collectResponse', { error: err.message }, true);
            }
        }

        async function getAgentState() {
            const agentId = document.getElementById('stateAgentId').value;

            try {
                const response = await fetch(`${API_BASE}/agent/state/${agentId}`);
                const data = await response.json();
                showResponse('stateResponse', data, !response.ok);
            } catch (err) {
                showResponse('stateResponse', { error: err.message }, true);
            }
        }

        async function removeAgent() {
            const agentId = document.getElementById('removeAgentId').value;

            try {
                const response = await fetch(`${API_BASE}/agent/${agentId}`, {
                    method: 'DELETE'
                });
                const data = await response.json();
                showResponse('removeResponse', data, !response.ok);
                updateStatus();
            } catch (err) {
                showResponse('removeResponse', { error: err.message }, true);
            }
        }

        // Update status every 2 seconds
        updateStatus();
        setInterval(updateStatus, 2000);
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

# Proxy endpoints to game server
@app.route('/api/status')
def get_status():
    try:
        response = requests.get(f"{GAME_SERVER}/api/status")
        return response.json(), response.status_code
    except Exception as e:
        return {"error": str(e), "online": False}, 500

@app.route('/api/agent/register', methods=['POST'])
def register_agent():
    try:
        response = requests.post(
            f"{GAME_SERVER}/api/agent/register",
            json=request.json
        )
        return response.json(), response.status_code
    except Exception as e:
        return {"error": str(e)}, 500

@app.route('/api/agent/command', methods=['POST'])
def agent_command():
    try:
        response = requests.post(
            f"{GAME_SERVER}/api/agent/command",
            json=request.json
        )
        return response.json(), response.status_code
    except Exception as e:
        return {"error": str(e)}, 500

@app.route('/api/agent/state/<agent_id>')
def get_agent_state(agent_id):
    try:
        response = requests.get(f"{GAME_SERVER}/api/agent/state/{agent_id}")
        return response.json(), response.status_code
    except Exception as e:
        return {"error": str(e)}, 500

@app.route('/api/agent/<agent_id>', methods=['DELETE'])
def delete_agent(agent_id):
    try:
        response = requests.delete(f"{GAME_SERVER}/api/agent/{agent_id}")
        return response.json(), response.status_code
    except Exception as e:
        return {"error": str(e)}, 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🎮 AI Agent Control Panel Starting")
    print("="*60)
    print(f"Game Server: {GAME_SERVER}")
    print(f"Control Panel: http://localhost:5001")
    print("="*60 + "\n")
    app.run(debug=True, port=5001)
