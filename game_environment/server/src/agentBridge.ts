import type { AIAgent } from "./objects/aiAgent";
import type { Game } from "./game";
import type { InputPacket } from "../../common/src/packets";
import { PacketType } from "../../common/src/packets";
import { Vec, type Vector } from "../../common/src/utils/vector";
import { Geometry } from "../../common/src/utils/math";
import type { Player } from "./objects/player";

// Backend API types
export interface BackendAction {
    tool_type: string;
    parameters: {
        x?: number;
        y?: number;
        target_player_id?: string;
        plan?: string;
        query?: string;
        weapon_slot?: number;
    };
}

export interface BackendGameState {
    position: { x: number; y: number };
    health: number;
    max_health: number;
    inventory: string[];
    ammo: { [key: string]: number };
    weapon_state: {
        active_weapon: string;
        active_weapon_ammo: number;
        active_weapon_capacity: number;
        can_shoot: boolean;
        is_reloading: boolean;
    };
    xp: number;
    level: number;
    just_died: boolean; // Flag indicating agent just died and respawned
    nearby_agents: Array<{
        id: string;
        position: { x: number; y: number };
        distance: number;
        health: number;
        username: string;
        xp: number;
        level: number;
    }>;
    nearby_loot: Array<{
        type: string;
        position: { x: number; y: number };
        distance: number;
    }>;
    nearby_obstacles: Array<{
        type: string;
        position: { x: number; y: number };
        distance: number;
        health?: number;
    }>;
}

export class AgentBridge {
    private game: Game;
    private commandStates: Map<string, CommandState> = new Map();

    constructor(game: Game) {
        this.game = game;
    }

    /**
     * Convert backend action to InputPacket
     */
    actionToInput(agentId: string, action: BackendAction, agent: AIAgent): InputPacket {
        const state = this.getOrCreateCommandState(agentId);
        state.lastAction = action;
        state.sequenceNumber++;

        const input: InputPacket = {
            type: PacketType.Input,
            seq: state.sequenceNumber,
            movement: { up: false, down: false, left: false, right: false },
            mouse: Vec.clone(agent.position),
            attacking: false,
            actions: {
                switchWeapon: false,
                pickup: false,
                reload: false
            }
        };

        switch (action.tool_type) {
            case "move":
                this.applyMoveCommand(input, action, agent, state);
                break;
            case "attack":
                this.applyAttackCommand(input, action, agent, state);
                break;
            case "collect":
                this.applyCollectCommand(input, action, agent);
                break;
            case "switch_weapon":
                this.applySwitchWeaponCommand(input, action, agent);
                break;
            case "plan":
                // Plan doesn't directly affect input, just store it
                state.currentPlan = action.parameters.plan;
                break;
            case "search":
                // Search doesn't directly affect game input, results come from MCP
                console.log(`[AgentBridge] Agent ${agentId} searched for: ${action.parameters.query}`);
                break;
            default:
                console.warn(`[AgentBridge] Unknown action type: ${action.tool_type}`);
        }

        return input;
    }

    /**
     * Apply move command - directly teleports agent by relative offset
     */
    private applyMoveCommand(input: InputPacket, action: BackendAction, agent: AIAgent, state: CommandState): void {
        const { x = 0, y = 0 } = action.parameters;

        // Apply direct movement using the new moveByOffset method
        const offset = Vec(x, y);
        const success = agent.moveByOffset(offset, this.game);

        if (!success) {
            console.log(`[AgentBridge] Agent ${agent.agentId} movement blocked by collision`);
        }

        // Update mouse to face movement direction for better visuals
        const targetPosition = Vec.add(agent.position, offset);
        input.mouse = targetPosition;

        state.moveTarget = success ? targetPosition : null;
    }

    /**
     * Apply attack command - aims at target player and shoots
     */
    private applyAttackCommand(input: InputPacket, action: BackendAction, agent: AIAgent, state: CommandState): void {
        const targetId = action.parameters.target_player_id;
        if (!targetId) return;

        // Find target (check both players and AI agents)
        let targetPosition: Vector | null = null;

        // Check human players
        for (const player of this.game.players.values()) {
            if (player.id.toString() === targetId || `player_${player.id}` === targetId) {
                targetPosition = player.position;
                break;
            }
        }

        // Check AI agents if not found in players
        if (!targetPosition) {
            for (const otherAgent of this.game.aiAgents.values()) {
                if (otherAgent.agentId === targetId || otherAgent.id.toString() === targetId) {
                    targetPosition = otherAgent.position;
                    break;
                }
            }
        }

        if (targetPosition) {
            // Aim at target and attack
            input.mouse = targetPosition;
            input.attacking = true;
            console.log(`[AgentBridge] Agent ${agent.username} attacking ${targetId}`);
        } else {
            console.warn(`[AgentBridge] Target not found: ${targetId}`);
            input.attacking = false;
        }
    }

    /**
     * Apply collect command - triggers pickup action
     */
    private applyCollectCommand(input: InputPacket, action: BackendAction, agent: AIAgent): void {
        input.actions.pickup = true;
    }

    /**
     * Apply switch weapon command - switches between weapon slots
     */
    private applySwitchWeaponCommand(input: InputPacket, action: BackendAction, agent: AIAgent): void {
        input.actions.switchWeapon = true;
        console.log(`[AgentBridge] Agent ${agent.username} switching weapon (current slot: ${agent.activeWeaponIndex})`);
    }

    /**
     * Get game state for agent in backend-compatible format
     */
    getGameStateForAgent(agent: AIAgent): BackendGameState {
        const nearbyRadius = 100; // Detection radius
        const nearbyRadiusSquared = nearbyRadius * nearbyRadius;

        // Get inventory
        const inventory: string[] = [];
        if (agent.weapons[0]) inventory.push(agent.weapons[0].definition.idString);
        if (agent.weapons[1]) inventory.push(agent.weapons[1].definition.idString);

        // Get weapon state for both slots for better agent decision making
        const activeWeapon = agent.weapons[agent.activeWeaponIndex];
        const weapon0 = agent.weapons[0];
        const weapon1 = agent.weapons[1];

        const weaponState = {
            active_weapon_slot: agent.activeWeaponIndex,
            active_weapon: activeWeapon ? activeWeapon.definition.idString : "none",
            active_weapon_ammo: activeWeapon ? activeWeapon.ammo : 0,
            active_weapon_capacity: activeWeapon ? activeWeapon.definition.capacity : 0,
            can_shoot: activeWeapon ? activeWeapon.canShoot(Date.now()) : false,
            is_reloading: activeWeapon ? activeWeapon.reloading : false,
            weapon_slot_0: weapon0 ? weapon0.definition.idString : "none",
            weapon_slot_0_ammo: weapon0 ? weapon0.ammo : 0,
            weapon_slot_1: weapon1 ? weapon1.definition.idString : "none",
            weapon_slot_1_ammo: weapon1 ? weapon1.ammo : 0
        };

        // Get nearby agents (both human players and AI agents)
        const nearbyAgents: BackendGameState["nearby_agents"] = [];

        // Add human players
        for (const player of this.game.players.values()) {
            if (player.id === agent.id) continue;
            const distSquared = Geometry.distanceSquared(agent.position, player.position);
            if (distSquared <= nearbyRadiusSquared) {
                nearbyAgents.push({
                    id: `player_${player.id}`,
                    position: { x: player.position.x, y: player.position.y },
                    distance: Math.sqrt(distSquared),
                    health: player.health,
                    username: player.username,
                    xp: player.xp,
                    level: player.getLevel()
                });
            }
        }

        // Add AI agents
        for (const otherAgent of this.game.aiAgents.values()) {
            if (otherAgent.id === agent.id) continue;
            const distSquared = Geometry.distanceSquared(agent.position, otherAgent.position);
            if (distSquared <= nearbyRadiusSquared) {
                nearbyAgents.push({
                    id: otherAgent.agentId,
                    position: { x: otherAgent.position.x, y: otherAgent.position.y },
                    distance: Math.sqrt(distSquared),
                    health: otherAgent.health,
                    username: otherAgent.username,
                    xp: otherAgent.xp,
                    level: otherAgent.getLevel()
                });
            }
        }

        // Get nearby loot
        const nearbyLoot: BackendGameState["nearby_loot"] = [];
        for (const loot of this.game.loot) {
            if (loot.picked || loot.dead) continue;
            const distSquared = Geometry.distanceSquared(agent.position, loot.position);
            if (distSquared <= nearbyRadiusSquared) {
                nearbyLoot.push({
                    type: loot.type,
                    position: { x: loot.position.x, y: loot.position.y },
                    distance: Math.sqrt(distSquared)
                });
            }
        }

        // Get nearby obstacles
        const nearbyObstacles: BackendGameState["nearby_obstacles"] = [];
        for (const obstacle of this.game.obstacles) {
            if (obstacle.dead) continue;
            const distSquared = Geometry.distanceSquared(agent.position, obstacle.position);
            if (distSquared <= nearbyRadiusSquared) {
                nearbyObstacles.push({
                    type: obstacle.type,
                    position: { x: obstacle.position.x, y: obstacle.position.y },
                    distance: Math.sqrt(distSquared),
                    health: obstacle.health
                });
            }
        }

        return {
            position: { x: agent.position.x, y: agent.position.y },
            health: agent.health,
            max_health: agent.maxHealth,
            inventory,
            ammo: Object.fromEntries(agent.ammo),
            weapon_state: weaponState,
            xp: agent.xp,
            level: agent.getLevel(),
            just_died: agent.justDied,
            nearby_agents: nearbyAgents.sort((a, b) => a.distance - b.distance),
            nearby_loot: nearbyLoot.sort((a, b) => a.distance - b.distance),
            nearby_obstacles: nearbyObstacles.sort((a, b) => a.distance - b.distance)
        };
    }

    /**
     * Get or create command state for agent
     */
    private getOrCreateCommandState(agentId: string): CommandState {
        let state = this.commandStates.get(agentId);
        if (!state) {
            state = {
                sequenceNumber: 0,
                lastAction: null,
                moveTarget: null,
                attackTarget: null,
                currentPlan: null
            };
            this.commandStates.set(agentId, state);
        }
        return state;
    }

    /**
     * Clean up command state when agent is removed
     */
    removeAgentState(agentId: string): void {
        this.commandStates.delete(agentId);
    }
}

interface CommandState {
    sequenceNumber: number;
    lastAction: BackendAction | null;
    moveTarget: Vector | null;
    attackTarget: string | null;
    currentPlan: string | null;
}
