import type { Vector } from "./utils/vector";

export enum PacketType {
    Join = 0,
    Input = 1,
    Update = 2,
    Disconnect = 3,
    SpectatorJoin = 4
}

export interface JoinPacket {
    type: PacketType.Join;
    playerName: string;
}

export interface SpectatorJoinPacket {
    type: PacketType.SpectatorJoin;
    spectatorName: string;
}

export interface InputPacket {
    type: PacketType.Input;
    seq: number;
    movement: {
        up: boolean;
        down: boolean;
        left: boolean;
        right: boolean;
    };
    mouse: Vector;
    attacking: boolean;
    actions: {
        switchWeapon: boolean;
        pickup: boolean;
        reload: boolean;
    };
}

export interface PlayerData {
    id: number;
    x: number;
    y: number;
    rotation: number;
    health: number;
    activeWeapon: number;
    username: string;
    dead: boolean;
    color: number;
}

export interface BulletData {
    id: number;
    x: number;
    y: number;
    rotation: number;
}

export interface ObstacleData {
    id: number;
    type: string;
    x: number;
    y: number;
    rotation: number;
    scale: number;
    destroyed: boolean;
}

export interface LootData {
    id: number;
    type: string;
    x: number;
    y: number;
    picked: boolean;
}

export interface UpdatePacket {
    type: PacketType.Update;
    tick: number;
    players: PlayerData[];
    bullets: BulletData[];
    obstacles: ObstacleData[];
    loot: LootData[];
    playerData?: {
        health: number;
        ammo: { [type: string]: number };
        weapons: [string | null, string | null];
    };
    spectatorData?: {
        spectatorId: number;
        isSpectator: true;
    };
}

export interface DisconnectPacket {
    type: PacketType.Disconnect;
    playerId: number;
}

export type Packet = JoinPacket | InputPacket | UpdatePacket | DisconnectPacket | SpectatorJoinPacket;
