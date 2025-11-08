import * as PIXI from 'pixi.js';
import { Vec, type Vector } from "../../common/src/utils/vector";
import { Camera } from "./camera";
import { InputManager } from "./input";
import { HUD } from "./hud";
import { AssetManager } from "./assetManager";
import { PacketType, type UpdatePacket, type PlayerData, type BulletData, type ObstacleData, type LootData, type SpectatorJoinPacket } from "../../common/src/packets";
import { Guns } from "../../common/src/definitions/guns";
import { getClientConfig, getWebSocketURL } from "../../common/src/config";

interface RenderObject {
    container: PIXI.Container;
    position: Vector;
    rotation: number;
    nameText?: PIXI.Text;
}

export class GameClient {
    private app: PIXI.Application;
    private camera: Camera;
    private input!: InputManager;
    private hud: HUD;
    private assetManager: AssetManager;
    private socket: WebSocket | null = null;

    private playerId: number | null = null;
    private isSpectator: boolean = false;
    private playerSprites: Map<number, RenderObject> = new Map();
    private bulletGraphics: Map<number, PIXI.Graphics> = new Map();
    private bulletData: Map<number, BulletData> = new Map();
    private obstacleSprites: Map<number, RenderObject> = new Map();
    private lootSprites: Map<number, RenderObject> = new Map();

    private lastPlayerData: PlayerData | null = null;
    private lastUpdateTime = 0;
    private grassBackground!: PIXI.Graphics;

    constructor() {
        this.app = new PIXI.Application();
        this.camera = new Camera(window.innerWidth, window.innerHeight);
        this.hud = new HUD();
        this.assetManager = AssetManager.getInstance();
    }

    async init(): Promise<void> {
        await this.app.init({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x719442,
            antialias: true
        });

        const gameContainer = document.getElementById('game-container')!;
        gameContainer.innerHTML = '';
        gameContainer.appendChild(this.app.canvas);

        // Add grass texture background
        this.createGrassBackground();

        // Load assets
        await this.assetManager.loadAssets();

        // Initialize input manager after canvas is created
        this.input = new InputManager(this.app.canvas as HTMLCanvasElement);

        // Setup free cam toggle callback
        this.input.setCamera(this.camera);
        this.input.setFreeCamToggleCallback(() => {
            this.camera.toggleFreeCam();
            const isEnabled = this.camera.isFreeCamEnabled();
            console.log(`[Client] Free cam mode: ${isEnabled ? 'ENABLED' : 'DISABLED'}`);

            // Update HUD indicator
            if (isEnabled) {
                this.hud.showFreeCamIndicator();
            } else {
                this.hud.hideFreeCamIndicator();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.app.renderer.resize(window.innerWidth, window.innerHeight);
            this.camera.resize(window.innerWidth, window.innerHeight);
        });

        // Start render loop
        this.app.ticker.add(() => this.render());
    }

    async connect(username: string, asSpectator: boolean = false): Promise<void> {
        this.isSpectator = asSpectator;

        return new Promise((resolve, reject) => {
            // Get WebSocket URL from config (auto-detects localhost vs production)
            const clientConfig = getClientConfig();
            const wsURL = getWebSocketURL(clientConfig);

            console.log(`[Client] Connecting to ${wsURL} as ${asSpectator ? 'spectator' : 'player'}`);
            this.socket = new WebSocket(wsURL);

            this.socket.onopen = () => {
                console.log('[Client] Connected to server');

                if (asSpectator) {
                    const spectatorPacket: SpectatorJoinPacket = {
                        type: PacketType.SpectatorJoin,
                        spectatorName: username
                    };
                    this.socket!.send(JSON.stringify(spectatorPacket));
                } else {
                    this.socket!.send(JSON.stringify({
                        type: PacketType.Join,
                        playerName: username
                    }));
                }

                resolve();
            };

            this.socket.onmessage = (event) => {
                try {
                    const packet: UpdatePacket = JSON.parse(event.data);
                    this.handleUpdate(packet);
                } catch (error) {
                    console.error('[Client] Error parsing packet:', error);
                }
            };

            this.socket.onerror = (error) => {
                console.error('[Client] WebSocket error:', error);
                console.error(`[Client] Failed to connect to ${wsURL}`);
                console.error('[Client] Make sure the server is running and accessible');
                reject(error);
            };

            this.socket.onclose = () => {
                console.log('[Client] Disconnected from server');
                // Show reconnection UI if player was in game
                if (this.playerId !== null) {
                    this.hud.showDeathScreen();
                }
            };

            // Send input packets
            setInterval(() => {
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    const inputPacket = this.input.getInputPacket(this.camera);
                    this.socket.send(JSON.stringify(inputPacket));
                }
            }, 1000 / 60); // 60 FPS
        });
    }

    private handleUpdate(packet: UpdatePacket): void {
        this.lastUpdateTime = Date.now();

        // Check if we're a spectator
        if (packet.spectatorData) {
            this.isSpectator = true;
        }

        // Find our player (only if not a spectator)
        if (!this.isSpectator && this.playerId === null && packet.players.length > 0) {
            this.playerId = packet.players[packet.players.length - 1].id;
        }

        // Update players
        const currentPlayerIds = new Set(packet.players.map(p => p.id));
        for (const [id, obj] of this.playerSprites.entries()) {
            if (!currentPlayerIds.has(id)) {
                this.app.stage.removeChild(obj.container);
                obj.container.destroy();
                if (obj.nameText) {
                    this.app.stage.removeChild(obj.nameText);
                    obj.nameText.destroy();
                }
                this.playerSprites.delete(id);
            }
        }

        for (const playerData of packet.players) {
            if (playerData.id === this.playerId) {
                this.lastPlayerData = playerData;
            }

            let renderObj = this.playerSprites.get(playerData.id);
            if (!renderObj) {
                renderObj = this.createPlayerSprite(playerData);
                this.playerSprites.set(playerData.id, renderObj);
            }
            renderObj.position = Vec(playerData.x, playerData.y);
            renderObj.rotation = playerData.rotation;

            // Update player dead state
            if (playerData.dead) {
                renderObj.container.alpha = 0.3;
            }
        }

        // Update camera
        if (this.isSpectator) {
            // Spectators: follow first alive player or stay at map center
            const firstAlivePlayer = packet.players.find(p => !p.dead);
            if (firstAlivePlayer) {
                this.camera.update(Vec(firstAlivePlayer.x, firstAlivePlayer.y));
            } else {
                this.camera.update(Vec(256, 256)); // Center of map
            }
        } else if (this.playerId !== null && this.lastPlayerData) {
            // Players: follow themselves
            this.camera.update(Vec(this.lastPlayerData.x, this.lastPlayerData.y));
        }

        // Update bullets
        const currentBulletIds = new Set(packet.bullets.map(b => b.id));
        for (const [id, graphic] of this.bulletGraphics.entries()) {
            if (!currentBulletIds.has(id)) {
                this.app.stage.removeChild(graphic);
                graphic.destroy();
                this.bulletGraphics.delete(id);
                this.bulletData.delete(id);
            }
        }

        for (const bulletData of packet.bullets) {
            if (!this.bulletGraphics.has(bulletData.id)) {
                const graphic = new PIXI.Graphics();
                this.app.stage.addChild(graphic);
                this.bulletGraphics.set(bulletData.id, graphic);
            }
            this.bulletData.set(bulletData.id, bulletData);
        }

        // Update obstacles (only once, they're static)
        if (this.obstacleSprites.size === 0) {
            for (const obstacleData of packet.obstacles) {
                if (!obstacleData.destroyed) {
                    const renderObj = this.createObstacleSprite(obstacleData);
                    this.obstacleSprites.set(obstacleData.id, renderObj);
                }
            }
        }

        // Update loot
        const currentLootIds = new Set(packet.loot.map(l => l.id));
        for (const [id, obj] of this.lootSprites.entries()) {
            if (!currentLootIds.has(id)) {
                this.app.stage.removeChild(obj.container);
                obj.container.destroy();
                this.lootSprites.delete(id);
            }
        }

        for (const lootData of packet.loot) {
            if (!lootData.picked && !this.lootSprites.has(lootData.id)) {
                const renderObj = this.createLootSprite(lootData);
                this.lootSprites.set(lootData.id, renderObj);
            }
        }

        // Update HUD (only for players, not spectators)
        if (!this.isSpectator && packet.playerData) {
            this.hud.updateHealth(packet.playerData.health);

            const activeWeapon = packet.playerData.weapons[this.lastPlayerData?.activeWeapon ?? 0];
            if (activeWeapon) {
                const gunDef = Guns[activeWeapon];
                this.hud.updateWeapon(gunDef?.name ?? activeWeapon);

                const ammoType = gunDef?.ammoType;
                const reserveAmmo = ammoType ? (packet.playerData.ammo[ammoType] ?? 0) : 0;
                this.hud.updateAmmo(gunDef?.capacity ?? 0, reserveAmmo);
            } else {
                this.hud.updateWeapon(null);
                this.hud.updateAmmo(0, 0);
            }

            if (packet.playerData.health <= 0) {
                this.hud.showDeathScreen();
            }
        } else if (this.isSpectator) {
            // Hide HUD for spectators, show spectator indicator
            this.hud.showSpectatorMode();
            document.getElementById('hud')!.style.display = 'none';
        }
    }

    private render(): void {
        // Update free cam movement if enabled
        if (this.camera.isFreeCamEnabled()) {
            const freeCamDirection = this.input.getFreeCamDirection();
            this.camera.moveFreeCam(freeCamDirection);
        }

        // Render grass background (transform to screen space)
        if (this.grassBackground) {
            const topLeft = this.camera.worldToScreen(Vec(0, 0));
            this.grassBackground.position.set(topLeft.x, topLeft.y);
            this.grassBackground.scale.set(this.camera.zoom);
        }

        // Render obstacles (bottom layer)
        for (const [id, obj] of this.obstacleSprites.entries()) {
            const screenPos = this.camera.worldToScreen(obj.position);
            obj.container.position.set(screenPos.x, screenPos.y);
            obj.container.rotation = obj.rotation;
            obj.container.scale.set(this.camera.zoom);
        }

        // Render loot
        for (const [id, obj] of this.lootSprites.entries()) {
            const screenPos = this.camera.worldToScreen(obj.position);
            obj.container.position.set(screenPos.x, screenPos.y);
            obj.container.scale.set(this.camera.zoom);
        }

        // Render players
        for (const [id, obj] of this.playerSprites.entries()) {
            const screenPos = this.camera.worldToScreen(obj.position);
            obj.container.position.set(screenPos.x, screenPos.y);
            obj.container.rotation = obj.rotation;
            obj.container.scale.set(this.camera.zoom);

            // Position name text above player (in world coordinates, then convert to screen)
            if (obj.nameText) {
                const nameWorldPos = Vec.add(obj.position, Vec(0, -3.5));
                const nameScreenPos = this.camera.worldToScreen(nameWorldPos);
                obj.nameText.position.set(nameScreenPos.x, nameScreenPos.y);
                obj.nameText.scale.set(this.camera.zoom);
            }

            // Highlight our player
            if (id === this.playerId) {
                obj.container.alpha = 1;
            } else {
                obj.container.alpha = 0.8;
            }
        }

        // Render bullets with improved tracers
        for (const [id, graphic] of this.bulletGraphics.entries()) {
            const bullet = this.bulletData.get(id);
            if (!bullet) continue;

            const screenStart = this.camera.worldToScreen(Vec(bullet.x, bullet.y));
            const bulletEnd = Vec.add(Vec(bullet.x, bullet.y), Vec.fromPolar(bullet.rotation, 8));
            const screenEnd = this.camera.worldToScreen(bulletEnd);

            graphic.clear();

            // Draw bullet trail with glow effect
            // Outer glow
            graphic.moveTo(screenStart.x, screenStart.y);
            graphic.lineTo(screenEnd.x, screenEnd.y);
            graphic.stroke({ color: 0xffaa00, width: 4 * this.camera.zoom, alpha: 0.3 });

            // Middle trail
            graphic.moveTo(screenStart.x, screenStart.y);
            graphic.lineTo(screenEnd.x, screenEnd.y);
            graphic.stroke({ color: 0xffdd44, width: 2.5 * this.camera.zoom, alpha: 0.7 });

            // Inner core
            graphic.moveTo(screenStart.x, screenStart.y);
            graphic.lineTo(screenEnd.x, screenEnd.y);
            graphic.stroke({ color: 0xffff88, width: 1.5 * this.camera.zoom });
        }
    }

    private createPlayerSprite(playerData: PlayerData): RenderObject {
        const container = new PIXI.Container();

        // Shadow (ellipse below player)
        const shadow = new PIXI.Graphics();
        shadow.ellipse(0, 0.5, 2.5, 1.2);
        shadow.fill({ color: 0x000000, alpha: 0.4 });

        // Body (circle with gradient effect)
        const body = new PIXI.Graphics();
        body.circle(0, 0, 2.25);
        body.fill({ color: playerData.dead ? 0x666666 : playerData.color });
        // Darken the stroke color (multiply RGB values by ~0.7)
        const strokeColor = playerData.dead ? 0x444444 : this.darkenColor(playerData.color, 0.7);
        body.stroke({ color: strokeColor, width: 0.25 });

        // Highlight on body for 3D effect
        const highlight = new PIXI.Graphics();
        highlight.circle(-0.6, -0.6, 0.8);
        highlight.fill({ color: 0xffffff, alpha: 0.3 });

        // Direction indicator (line pointing forward)
        const direction = new PIXI.Graphics();
        direction.moveTo(0, 0);
        direction.lineTo(3, 0);
        direction.stroke({ color: 0xffffff, width: 0.4 });

        // Weapon sprite with better styling
        const weaponSprite = new PIXI.Graphics();
        weaponSprite.rect(1, -0.25, 2.2, 0.5);
        weaponSprite.fill({ color: 0x1a1a1a });
        weaponSprite.rect(1, -0.15, 2.2, 0.3);
        weaponSprite.fill({ color: 0x333333 });

        // Username with better styling
        const nameText = new PIXI.Text({
            text: playerData.username,
            style: {
                fontSize: 6,
                fill: 0xffffff,
                stroke: { color: 0x000000, width: 0.15 },
                fontWeight: 'bold'
            }
        });
        nameText.resolution = 4; // Higher resolution for crisp text at small sizes
        nameText.anchor.set(0.5, 1); // Anchor at bottom center

        container.addChild(shadow);
        container.addChild(body);
        container.addChild(highlight);
        container.addChild(direction);
        container.addChild(weaponSprite);

        // Add nameText separately to stage so it doesn't rotate with player
        this.app.stage.addChild(container);
        this.app.stage.addChild(nameText);

        return {
            container,
            position: Vec(playerData.x, playerData.y),
            rotation: playerData.rotation,
            nameText
        };
    }

    private createObstacleSprite(obstacleData: ObstacleData): RenderObject {
        const container = new PIXI.Container();

        if (obstacleData.type === 'tree') {
            // Shadow for tree
            const shadow = new PIXI.Graphics();
            shadow.ellipse(0.5, 1, 4 * obstacleData.scale, 2 * obstacleData.scale);
            shadow.fill({ color: 0x000000, alpha: 0.35 });
            container.addChild(shadow);

            // Tree with trunk and leaves
            const trunkTex = this.assetManager.getTexture('tree_trunk');
            const leavesTex = this.assetManager.getTexture('tree_leaves');

            if (trunkTex) {
                const trunk = new PIXI.Sprite(trunkTex);
                trunk.anchor.set(0.5, 0.5);
                trunk.scale.set(0.08 * obstacleData.scale);
                container.addChild(trunk);
            }

            if (leavesTex) {
                const leaves = new PIXI.Sprite(leavesTex);
                leaves.anchor.set(0.5, 0.5);
                leaves.scale.set(0.08 * obstacleData.scale);
                container.addChild(leaves);
            }

            // Fallback if no textures
            if (!trunkTex && !leavesTex) {
                // Trunk
                const trunk = new PIXI.Graphics();
                trunk.rect(-0.5 * obstacleData.scale, -1 * obstacleData.scale, 1 * obstacleData.scale, 3 * obstacleData.scale);
                trunk.fill({ color: 0x4a3728 });
                trunk.stroke({ color: 0x2d2116, width: 0.2 });

                // Leaves
                const leaves = new PIXI.Graphics();
                leaves.circle(0, -1, 3.5 * obstacleData.scale);
                leaves.fill({ color: 0x2d6b22 });
                leaves.circle(0, -1, 3.5 * obstacleData.scale);
                leaves.stroke({ color: 0x1f5018, width: 0.3 });

                container.addChild(trunk);
                container.addChild(leaves);
            }
        } else if (obstacleData.type === 'rock') {
            // Shadow for rock
            const shadow = new PIXI.Graphics();
            shadow.ellipse(0.5, 0.5, 4.5 * obstacleData.scale, 2.5 * obstacleData.scale);
            shadow.fill({ color: 0x000000, alpha: 0.35 });
            container.addChild(shadow);

            const rockTex = this.assetManager.getTexture('rock');
            if (rockTex) {
                const rock = new PIXI.Sprite(rockTex);
                rock.anchor.set(0.5, 0.5);
                rock.scale.set(0.08 * obstacleData.scale);
                container.addChild(rock);
            } else {
                const fallback = new PIXI.Graphics();
                fallback.circle(0, 0, 4 * obstacleData.scale);
                fallback.fill({ color: 0x6b6b6b });
                // Highlight
                const highlight = new PIXI.Graphics();
                highlight.circle(-1, -1, 1.5 * obstacleData.scale);
                highlight.fill({ color: 0x8a8a8a, alpha: 0.6 });
                container.addChild(fallback);
                container.addChild(highlight);
                fallback.stroke({ color: 0x4a4a4a, width: 0.4 });
            }
        } else if (obstacleData.type === 'crate') {
            // Shadow for crate
            const shadow = new PIXI.Graphics();
            const size = 3.5 * obstacleData.scale;
            shadow.rect(-size + 0.5, -size + 0.5, size * 2, size * 2);
            shadow.fill({ color: 0x000000, alpha: 0.35 });
            container.addChild(shadow);

            const crateTex = this.assetManager.getTexture('crate');
            if (crateTex) {
                const crate = new PIXI.Sprite(crateTex);
                crate.anchor.set(0.5, 0.5);
                crate.scale.set(0.06 * obstacleData.scale);
                container.addChild(crate);
            } else {
                // Crate with wood texture
                const fallback = new PIXI.Graphics();
                fallback.rect(-size, -size, size * 2, size * 2);
                fallback.fill({ color: 0x9b6d3c });
                fallback.stroke({ color: 0x6b4a2a, width: 0.4 });

                // Wood planks detail
                for (let i = 0; i < 3; i++) {
                    const plankY = -size + (i * size * 2 / 3);
                    fallback.moveTo(-size, plankY);
                    fallback.lineTo(size, plankY);
                    fallback.stroke({ color: 0x5a3a1a, width: 0.15 });
                }

                container.addChild(fallback);
            }
        } else if (obstacleData.type === 'wall_horizontal') {
            // Horizontal wall: 512 wide × 8 tall
            const halfWidth = 256 * obstacleData.scale;   // Half of 512
            const halfHeight = 4 * obstacleData.scale;     // Half of 8
            const wall = new PIXI.Graphics();
            wall.rect(-halfWidth, -halfHeight, halfWidth * 2, halfHeight * 2);
            wall.fill({ color: 0x505050 });
            wall.stroke({ color: 0x303030, width: 0.3 });
            container.addChild(wall);
        } else if (obstacleData.type === 'wall_vertical') {
            // Vertical wall: 8 wide × 512 tall
            const halfWidth = 4 * obstacleData.scale;      // Half of 8
            const halfHeight = 256 * obstacleData.scale;   // Half of 512
            const wall = new PIXI.Graphics();
            wall.rect(-halfWidth, -halfHeight, halfWidth * 2, halfHeight * 2);
            wall.fill({ color: 0x505050 });
            wall.stroke({ color: 0x303030, width: 0.3 });
            container.addChild(wall);
        }

        this.app.stage.addChild(container);

        return {
            container,
            position: Vec(obstacleData.x, obstacleData.y),
            rotation: obstacleData.rotation
        };
    }

    private createLootSprite(lootData: LootData): RenderObject {
        const container = new PIXI.Container();

        let textureName = '';
        if (lootData.type === 'pistol') textureName = 'loot_pistol';
        else if (lootData.type === 'rifle') textureName = 'loot_rifle';
        else if (lootData.type === 'shotgun') textureName = 'loot_shotgun';
        else if (lootData.type.startsWith('ammo_')) textureName = lootData.type;

        const texture = this.assetManager.getTexture(textureName);
        if (texture) {
            const sprite = new PIXI.Sprite(texture);
            sprite.anchor.set(0.5, 0.5);
            sprite.scale.set(0.08);  // 2x larger (was 0.04)
            container.addChild(sprite);
        } else {
            // Fallback - 2x larger
            const color = lootData.type.includes('ammo') ? 0xFFA500 : 0xFFD700;
            const graphic = new PIXI.Graphics();
            if (lootData.type.includes('ammo')) {
                graphic.rect(-2, -1, 4, 2);  // 2x size
            } else {
                graphic.rect(-3, -0.6, 6, 1.2);  // 2x size
            }
            graphic.fill({ color });
            graphic.stroke({ color: 0x000000, width: 0.15 });
            container.addChild(graphic);
        }

        this.app.stage.addChild(container);

        return {
            container,
            position: Vec(lootData.x, lootData.y),
            rotation: 0
        };
    }

    private createGrassBackground(): void {
        // Create a simple grass texture pattern in world space
        this.grassBackground = new PIXI.Graphics();

        // Draw grass texture (512x512 map size in world coords)
        const tileSize = 32;
        const mapSize = 512;

        for (let x = 0; x < mapSize; x += tileSize) {
            for (let y = 0; y < mapSize; y += tileSize) {
                // Alternate grass shades for subtle checkerboard
                const shade = (x/tileSize + y/tileSize) % 2 === 0 ? 0x7fa84f : 0x6d944a;
                this.grassBackground.rect(x, y, tileSize, tileSize);
                this.grassBackground.fill({ color: shade, alpha: 0.15 });
            }
        }

        // Add to bottom layer (will be positioned in render loop)
        this.app.stage.addChildAt(this.grassBackground, 0);
    }

    private darkenColor(color: number, factor: number): number {
        const r = ((color >> 16) & 0xFF) * factor;
        const g = ((color >> 8) & 0xFF) * factor;
        const b = (color & 0xFF) * factor;
        return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
    }
}
