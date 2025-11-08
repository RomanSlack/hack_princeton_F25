import type { ServerWebSocket } from "bun";
import { Grid } from "./utils/grid";
import { Player } from "./objects/player";
import { AIAgent } from "./objects/aiAgent";
import { Spectator } from "./objects/spectator";
import { Obstacle } from "./objects/obstacle";
import { Loot } from "./objects/loot";
import { Bullet } from "./objects/bullet";
import { MAP_DATA } from "./data/map";
import { GameConstants } from "../../common/src/constants";
import { Vec, type Vector } from "../../common/src/utils/vector";
import { CircleHitbox } from "../../common/src/utils/hitbox";
import type { GunDefinition } from "../../common/src/definitions/guns";
import { Geometry } from "../../common/src/utils/math";
import type { InputPacket, UpdatePacket } from "../../common/src/packets";
import { PacketType } from "../../common/src/packets";
import { AgentBridge } from "./agentBridge";

export class Game {
    players: Map<number, Player> = new Map();
    aiAgents: Map<string, AIAgent> = new Map(); // Map by agentId (string)
    spectators: Map<number, Spectator> = new Map();
    obstacles: Obstacle[] = [];
    loot: Loot[] = [];
    bullets: Bullet[] = [];
    grid: Grid;
    agentBridge: AgentBridge;

    private nextPlayerId = 1;
    private nextAIAgentId = 1;
    private nextSpectatorId = 1;
    private nextObstacleId = 1;
    private nextLootId = 1;
    private nextBulletId = 1;

    private tickRate = GameConstants.TPS;
    private tickInterval = 1000 / this.tickRate;
    private lastTickTime = 0;
    private running = false;
    private currentTick = 0;

    private usedSpawnPoints = new Set<number>();
    private usedColors = new Set<number>();

    // Pre-defined vibrant colors for players
    private playerColors: number[] = [
        0xFF4444, // Red
        0x44FF44, // Green
        0x4444FF, // Blue
        0xFFFF44, // Yellow
        0xFF44FF, // Magenta
        0x44FFFF, // Cyan
        0xFF8844, // Orange
        0xFF4488, // Pink
        0x88FF44, // Lime
        0x4488FF, // Sky Blue
        0x8844FF, // Purple
        0xFF8888, // Light Red
        0x88FF88, // Light Green
        0x8888FF, // Light Blue
        0xFFAA44, // Amber
        0xAA44FF, // Violet
        0x44FFAA, // Mint
        0xFFAA88, // Peach
        0xAAFF88, // Pale Green
        0x88AAFF, // Periwinkle
    ];

    constructor() {
        this.grid = new Grid(GameConstants.MAP_WIDTH, GameConstants.MAP_HEIGHT);
        this.agentBridge = new AgentBridge(this);
        this.loadMap();
    }

    private loadMap(): void {
        // Load obstacles
        for (const obstacleData of MAP_DATA.obstacles) {
            const obstacle = new Obstacle(
                this.nextObstacleId++,
                obstacleData.type,
                Vec(obstacleData.x, obstacleData.y),
                obstacleData.rotation,
                obstacleData.scale ?? 1
            );
            this.obstacles.push(obstacle);
            this.grid.addObject(obstacle);
        }

        // Load loot
        for (const lootData of MAP_DATA.loot) {
            const loot = new Loot(
                this.nextLootId++,
                lootData.type,
                Vec(lootData.x, lootData.y),
                lootData.count
            );
            this.loot.push(loot);
        }

        console.log(`[Game] Loaded ${this.obstacles.length} obstacles and ${this.loot.length} loot items`);
    }

    start(): void {
        this.running = true;
        this.lastTickTime = Date.now();
        this.tick();
        console.log("[Game] Started");
    }

    stop(): void {
        this.running = false;
        console.log("[Game] Stopped");
    }

    private tick(): void {
        if (!this.running) return;

        const now = Date.now();
        const dt = now - this.lastTickTime;
        this.lastTickTime = now;

        // 1. Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update(dt, this);
            if (bullet.dead) {
                this.bullets.splice(i, 1);
            }
        }

        // 2. Update players
        for (const player of this.players.values()) {
            if (!player.dead) {
                player.update(this);
            }
        }

        // 3. Update AI agents
        for (const agent of this.aiAgents.values()) {
            if (!agent.dead) {
                agent.update(this);
            }
        }

        // 4. Serialize and broadcast
        this.broadcast();

        // 5. Schedule next tick
        this.currentTick++;
        const elapsed = Date.now() - now;
        const delay = Math.max(0, this.tickInterval - elapsed);
        setTimeout(() => this.tick(), delay);
    }

    private broadcast(): void {
        // Combine human players and AI agents into one players array
        const allPlayers = [
            ...Array.from(this.players.values()).map(p => p.serialize()),
            ...Array.from(this.aiAgents.values()).map(a => a.serialize())
        ];

        const packet: UpdatePacket = {
            type: PacketType.Update,
            tick: this.currentTick,
            players: allPlayers,
            bullets: this.bullets.map(b => b.serialize()),
            obstacles: this.obstacles.map(o => o.serialize()),
            loot: this.loot.filter(l => !l.picked).map(l => l.serialize())
        };

        const message = JSON.stringify(packet);

        // Broadcast to players
        for (const player of this.players.values()) {
            if (player.socket.readyState === 1) { // OPEN
                // Send personalized data
                const personalizedPacket = {
                    ...packet,
                    playerData: {
                        health: player.health,
                        ammo: Object.fromEntries(player.ammo),
                        weapons: [
                            player.weapons[0]?.definition.idString ?? null,
                            player.weapons[1]?.definition.idString ?? null
                        ] as [string | null, string | null]
                    }
                };
                player.socket.send(JSON.stringify(personalizedPacket));
            }
        }

        // Broadcast to spectators
        for (const spectator of this.spectators.values()) {
            if (spectator.socket.readyState === 1) { // OPEN
                const spectatorPacket = {
                    ...packet,
                    spectatorData: {
                        spectatorId: spectator.id,
                        isSpectator: true as const
                    }
                };
                spectator.socket.send(JSON.stringify(spectatorPacket));
            }
        }
    }

    addPlayer(socket: ServerWebSocket<{ playerId: number }>, username: string): Player {
        const spawnPoint = this.getRandomSpawnPoint();
        const color = this.getUniqueColor();
        const player = new Player(this.nextPlayerId++, socket, username, spawnPoint, color);

        // Give starter pistol
        player.addWeapon("pistol");
        player.addAmmo("9mm", 45);

        this.players.set(player.id, player);
        this.grid.addObject(player);

        console.log(`[Game] Player ${username} (${player.id}) joined at (${spawnPoint.x}, ${spawnPoint.y}) with color 0x${color.toString(16)}`);

        return player;
    }

    addSpectator(socket: ServerWebSocket<any>, username: string): Spectator {
        const spectator = new Spectator(this.nextSpectatorId++, username, socket);
        this.spectators.set(spectator.id, spectator);

        console.log(`[Game] Spectator ${username} (${spectator.id}) joined`);

        return spectator;
    }

    addAIAgent(agentId: string, username?: string): AIAgent {
        // Check if agent already exists
        if (this.aiAgents.has(agentId)) {
            throw new Error(`AI Agent with ID ${agentId} already exists`);
        }

        const spawnPoint = this.getRandomSpawnPoint();
        const displayName = username || `AI_${agentId}`;
        const color = this.getUniqueColor();
        const agent = new AIAgent(this.nextAIAgentId++, agentId, displayName, spawnPoint, color);

        // Give starter pistol
        agent.addWeapon("pistol");
        agent.addAmmo("9mm", 45);

        this.aiAgents.set(agentId, agent);
        this.grid.addObject(agent);

        console.log(`[Game] AI Agent ${displayName} (${agentId}) joined at (${spawnPoint.x}, ${spawnPoint.y}) with color 0x${color.toString(16)}`);

        return agent;
    }

    removePlayer(playerId: number): void {
        const player = this.players.get(playerId);
        if (player) {
            this.grid.removeObject(player);
            this.usedColors.delete(player.color); // Release the color
            this.players.delete(playerId);
            console.log(`[Game] Player ${player.username} (${playerId}) left`);
        }
    }

    removeSpectator(spectatorId: number): void {
        const spectator = this.spectators.get(spectatorId);
        if (spectator) {
            this.spectators.delete(spectatorId);
            console.log(`[Game] Spectator ${spectator.username} (${spectatorId}) left`);
        }
    }

    removeAIAgent(agentId: string): void {
        const agent = this.aiAgents.get(agentId);
        if (agent) {
            this.grid.removeObject(agent);
            this.usedColors.delete(agent.color); // Release the color
            this.aiAgents.delete(agentId);
            this.agentBridge.removeAgentState(agentId);
            console.log(`[Game] AI Agent ${agent.username} (${agentId}) left`);
        }
    }

    handleInput(playerId: number, input: InputPacket): void {
        const player = this.players.get(playerId);
        if (player) {
            player.processInput(input, this);
        }
    }

    createBullet(position: Vector, direction: Vector, gun: GunDefinition, shooter: Player | AIAgent): void {
        const bullet = new Bullet(this.nextBulletId++, position, direction, gun, shooter);
        this.bullets.push(bullet);
    }

    checkPickups(player: Player | AIAgent): void {
        const pickupRadiusSquared = GameConstants.PICKUP_RADIUS * GameConstants.PICKUP_RADIUS;

        for (const loot of this.loot) {
            if (loot.picked) continue;

            const distSquared = Geometry.distanceSquared(player.position, loot.position);
            if (distSquared <= pickupRadiusSquared) {
                if (loot.type.startsWith("ammo_")) {
                    const ammoType = loot.type.replace("ammo_", "");
                    player.addAmmo(ammoType, loot.count);
                    loot.picked = true;
                    loot.dead = true;
                    console.log(`[Game] ${player.username} picked up ${loot.count}x ${ammoType} ammo`);
                } else {
                    // It's a weapon
                    const success = player.addWeapon(loot.type);
                    if (success) {
                        loot.picked = true;
                        loot.dead = true;
                        console.log(`[Game] ${player.username} picked up ${loot.type}`);
                    }
                }
            }
        }
    }

    private getUniqueColor(): number {
        // If all colors are used, reset and allow duplicates
        if (this.usedColors.size >= this.playerColors.length) {
            this.usedColors.clear();
        }

        // Find an unused color
        for (const color of this.playerColors) {
            if (!this.usedColors.has(color)) {
                this.usedColors.add(color);
                return color;
            }
        }

        // Fallback: generate a random color
        const randomColor = Math.floor(Math.random() * 0xFFFFFF);
        this.usedColors.add(randomColor);
        return randomColor;
    }

    private getRandomSpawnPoint(): Vector {
        if (this.usedSpawnPoints.size >= MAP_DATA.playerSpawns.length) {
            this.usedSpawnPoints.clear();
        }

        let attempts = 0;
        while (attempts < 100) {
            const index = Math.floor(Math.random() * MAP_DATA.playerSpawns.length);
            if (!this.usedSpawnPoints.has(index)) {
                const spawn = MAP_DATA.playerSpawns[index];
                const spawnPos = Vec(spawn.x, spawn.y);

                // Check if spawn position collides with any obstacles
                const playerHitbox = new CircleHitbox(GameConstants.PLAYER_RADIUS, spawnPos);
                const nearbyObjects = this.grid.intersectsHitbox(playerHitbox);

                let collision = false;
                for (const obj of nearbyObjects) {
                    if (playerHitbox.collidesWith(obj.hitbox)) {
                        collision = true;
                        break;
                    }
                }

                if (!collision) {
                    this.usedSpawnPoints.add(index);
                    return spawnPos;
                }
            }
            attempts++;
        }

        // Fallback to center (should rarely happen)
        console.warn("[Game] Could not find valid spawn point, using center");
        return Vec(GameConstants.MAP_WIDTH / 2, GameConstants.MAP_HEIGHT / 2);
    }
}
