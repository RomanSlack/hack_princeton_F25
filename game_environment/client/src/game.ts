import * as PIXI from 'pixi.js';
import { Vec, type Vector } from "../../common/src/utils/vector";
import { Camera } from "./camera";
import { InputManager } from "./input";
import { HUD } from "./hud";
import { AssetManager } from "./assetManager";
import { LightingSystem } from "./lighting";
import { PacketType, type UpdatePacket, type PlayerData, type BulletData, type ObstacleData, type LootData, type SpectatorJoinPacket } from "../../common/src/packets";
import { Guns } from "../../common/src/definitions/guns";
import { getClientConfig, getWebSocketURL } from "../../common/src/config";

interface RenderObject {
    container: PIXI.Container;
    position: Vector;
    rotation: number;
    nameText?: PIXI.Text;
    xpText?: PIXI.Text;
    leavesContainer?: PIXI.Container; // Separate container for tree leaves (rendered above players)
    weaponSprite?: PIXI.Graphics;
    punchAnimation?: { startTime: number; duration: number };
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
    private bulletSprites: Map<number, PIXI.Sprite> = new Map();
    private bulletCircles: Map<number, PIXI.Graphics> = new Map(); // White circles at bullet tip
    private bulletData: Map<number, BulletData> = new Map();
    private bulletSpawnTimes: Map<number, number> = new Map(); // Track when bullets spawn for trail animation
    private obstacleSprites: Map<number, RenderObject> = new Map();
    private lootSprites: Map<number, RenderObject> = new Map();

    private lastPlayerData: PlayerData | null = null;
    private lastUpdateTime = 0;
    private grassBackground!: PIXI.Graphics;
    private lightingSystem!: LightingSystem;

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
        this.grassBackground.zIndex = 0;

        // Load assets
        await this.assetManager.loadAssets();

        // Initialize lighting system (sun-based shadows) - DISABLED FOR DEBUG
        // this.lightingSystem = new LightingSystem(this.app.stage);
        // this.lightingSystem.setShadowIntensity(0.3);
        // this.lightingSystem.setSunDirection(Vec(0.6, 0.8)); // Sun from top-right
        // this.lightingSystem.getContainer().zIndex = 50; // Between players and UI
        // this.lightingSystem.getContainer().eventMode = 'none'; // Don't block mouse events

        // Enable z-index sorting for proper layer ordering
        this.app.stage.sortableChildren = true;

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

    async connect(username: string, asSpectator: boolean = false, preferredZone?: "zone1" | "zone2"): Promise<void> {
        this.isSpectator = asSpectator;

        // Enable zoom for spectators
        if (asSpectator) {
            this.camera.enableZoom();
            console.log('[Client] Spectator zoom enabled (scroll to zoom)');
        }

        return new Promise((resolve, reject) => {
            // Get WebSocket URL from config (auto-detects localhost vs production)
            const clientConfig = getClientConfig();
            const wsURL = getWebSocketURL(clientConfig);

            console.log(`[Client] Connecting to ${wsURL} as ${asSpectator ? 'spectator' : 'player'}${preferredZone ? ` (Zone: ${preferredZone})` : ''}`);
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
                        playerName: username,
                        preferredZone: preferredZone
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
                if (obj.xpText) {
                    this.app.stage.removeChild(obj.xpText);
                    obj.xpText.destroy();
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

            // Update XP text
            if (renderObj.xpText) {
                renderObj.xpText.text = `${playerData.xp || 0} XP`;
            }

            // Trigger punch animation if attacking with fists
            if (playerData.attacking && playerData.activeWeapon === 0 && renderObj.weaponSprite) {
                // activeWeapon 0 is fists (first weapon slot)
                if (!renderObj.punchAnimation) {
                    renderObj.punchAnimation = { startTime: Date.now(), duration: 200 };
                }
            }

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
        for (const [id, sprite] of this.bulletSprites.entries()) {
            if (!currentBulletIds.has(id)) {
                this.app.stage.removeChild(sprite);
                sprite.destroy();
                this.bulletSprites.delete(id);

                // Also remove bullet circle
                const circle = this.bulletCircles.get(id);
                if (circle) {
                    this.app.stage.removeChild(circle);
                    circle.destroy();
                    this.bulletCircles.delete(id);
                }

                this.bulletData.delete(id);
                this.bulletSpawnTimes.delete(id);
            }
        }

        for (const bulletData of packet.bullets) {
            if (!this.bulletSprites.has(bulletData.id)) {
                // Create new bullet sprite with trail texture
                const trailTexture = this.assetManager.getTexture('bullet_trail');
                const sprite = new PIXI.Sprite(trailTexture || PIXI.Texture.EMPTY);

                // Configure sprite
                sprite.anchor.set(1, 0.5); // Anchor at RIGHT-center (trail extends behind bullet)
                sprite.rotation = bulletData.rotation;
                sprite.zIndex = 25; // Above players

                // Use shooter's color for bullet trail, fallback to yellow-orange
                sprite.tint = bulletData.color ?? 0xffdd44;

                this.app.stage.addChild(sprite);
                this.bulletSprites.set(bulletData.id, sprite);
                this.bulletSpawnTimes.set(bulletData.id, Date.now());

                // Create white circle at bullet tip (keep white for visibility)
                const circle = new PIXI.Graphics();
                circle.circle(0, 0, 1); // Small circle, 1 unit radius
                circle.fill({ color: 0xffffff, alpha: 0.9 });
                circle.zIndex = 26; // Above trail

                this.app.stage.addChild(circle);
                this.bulletCircles.set(bulletData.id, circle);
            }
            this.bulletData.set(bulletData.id, bulletData);
        }

        // Update obstacles - create on first run, destroy when needed
        if (this.obstacleSprites.size === 0) {
            for (const obstacleData of packet.obstacles) {
                if (!obstacleData.destroyed) {
                    const renderObj = this.createObstacleSprite(obstacleData);
                    this.obstacleSprites.set(obstacleData.id, renderObj);
                }
            }
        } else {
            // Check for destroyed obstacles and remove them, or update gate states
            for (const obstacleData of packet.obstacles) {
                if (obstacleData.destroyed) {
                    const renderObj = this.obstacleSprites.get(obstacleData.id);
                    if (renderObj) {
                        this.app.stage.removeChild(renderObj.container);
                        renderObj.container.destroy();
                        // Also destroy leaves container if it exists
                        if (renderObj.leavesContainer) {
                            this.app.stage.removeChild(renderObj.leavesContainer);
                            renderObj.leavesContainer.destroy();
                        }
                        this.obstacleSprites.delete(obstacleData.id);
                    }
                } else if (obstacleData.type === 'gate') {
                    // Update gate if its open state changed
                    const renderObj = this.obstacleSprites.get(obstacleData.id);
                    if (renderObj && renderObj['lastOpenState'] !== obstacleData.open) {
                        // Recreate the gate sprite with new state
                        this.app.stage.removeChild(renderObj.container);
                        renderObj.container.destroy();
                        const newRenderObj = this.createObstacleSprite(obstacleData);
                        newRenderObj['lastOpenState'] = obstacleData.open;
                        this.obstacleSprites.set(obstacleData.id, newRenderObj);
                    } else if (renderObj && renderObj['lastOpenState'] === undefined) {
                        // Initialize the state tracking
                        renderObj['lastOpenState'] = obstacleData.open;
                    }
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
            this.hud.updateXP(packet.playerData.xp, packet.playerData.level);

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
            const xpDisplay = document.getElementById('xp-display');
            if (xpDisplay) xpDisplay.style.display = 'none';

            // Show and update leaderboard for spectators
            this.hud.showLeaderboard();
            this.hud.updateLeaderboard(packet.players);
        }

        // Update lighting system with obstacle data - DISABLED FOR DEBUG
        // if (this.lightingSystem) {
        //     this.lightingSystem.updateObstacles(packet.obstacles);
        // }
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

        // Render obstacles (bottom layer - trunks only)
        for (const [_id, obj] of this.obstacleSprites.entries()) {
            const screenPos = this.camera.worldToScreen(obj.position);
            obj.container.position.set(screenPos.x, screenPos.y);
            obj.container.rotation = obj.rotation;
            obj.container.scale.set(this.camera.zoom);

            // Also update leaves container if it exists (rendered separately at higher z-index)
            if (obj.leavesContainer) {
                obj.leavesContainer.position.set(screenPos.x, screenPos.y);
                obj.leavesContainer.rotation = obj.rotation;
                obj.leavesContainer.scale.set(this.camera.zoom);
            }
        }

        // Render loot
        for (const [_id, obj] of this.lootSprites.entries()) {
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
                const nameWorldPos = Vec.add(obj.position, Vec(0, -7.8));
                const nameScreenPos = this.camera.worldToScreen(nameWorldPos);
                obj.nameText.position.set(nameScreenPos.x, nameScreenPos.y);
                obj.nameText.scale.set(this.camera.zoom);
            }

            // Position XP text below name text (overlapping slightly)
            if (obj.xpText) {
                const xpWorldPos = Vec.add(obj.position, Vec(0, -3.3));
                const xpScreenPos = this.camera.worldToScreen(xpWorldPos);
                obj.xpText.position.set(xpScreenPos.x, xpScreenPos.y);
                obj.xpText.scale.set(this.camera.zoom);
            }

            // Animate punch if active
            if (obj.punchAnimation && obj.weaponSprite) {
                const elapsed = Date.now() - obj.punchAnimation.startTime;
                const progress = Math.min(elapsed / obj.punchAnimation.duration, 1);

                if (progress < 1) {
                    // Punch forward and back
                    const punchOffset = Math.sin(progress * Math.PI) * 2; // 0 -> 2 -> 0
                    obj.weaponSprite.position.x = punchOffset;

                    // Also scale slightly for emphasis
                    const scale = 1 + Math.sin(progress * Math.PI) * 0.3;
                    obj.weaponSprite.scale.set(scale, scale);
                } else {
                    // Reset animation
                    obj.weaponSprite.position.x = 0;
                    obj.weaponSprite.scale.set(1, 1);
                    obj.punchAnimation = undefined;
                }
            }

            // Highlight our player
            if (id === this.playerId) {
                obj.container.alpha = 1;
            } else {
                obj.container.alpha = 0.8;
            }
        }

        // Render bullets with sprite-based trails
        for (const [id, sprite] of this.bulletSprites.entries()) {
            const bullet = this.bulletData.get(id);
            if (!bullet) continue;

            const spawnTime = this.bulletSpawnTimes.get(id) || Date.now();
            const age = Date.now() - spawnTime;

            // Position sprite at bullet location
            const screenPos = this.camera.worldToScreen(Vec(bullet.x, bullet.y));
            sprite.position.set(screenPos.x, screenPos.y);
            sprite.rotation = bullet.rotation;

            // Dynamic trail length: grows over first 150ms for smooth appearance
            const maxTrailLength = 18; // Maximum trail length in world units (smaller)
            const growthDuration = 150; // ms to reach full length
            const trailLengthFactor = Math.min(age / growthDuration, 1);
            const trailLength = maxTrailLength * trailLengthFactor;

            // Scale the sprite with tapering effect
            // Width of sprite in world coordinates, then convert to screen
            // Start from nearly 0 and grow out
            const baseWidth = Math.max(trailLength * this.camera.zoom / 132.292, 0.01); // 132.292 is the SVG width, minimum 0.01 to avoid 0
            const baseHeight = 0.5 * this.camera.zoom; // Smaller height (was 0.8)

            // Taper: gradually reduce height as trail gets longer (like bullet momentum)
            const taperFactor = 0.7 + (0.3 * (1 - trailLengthFactor)); // Starts thick, gets thinner

            sprite.scale.set(
                baseWidth,
                baseHeight * taperFactor
            );

            // Fade in very quickly just to avoid pop-in
            sprite.alpha = Math.min(age / 20, 1);

            // Update white circle position at bullet tip (same as bullet position now)
            const circle = this.bulletCircles.get(id);
            if (circle) {
                // Circle is at the bullet position (front), trail extends behind
                circle.position.set(screenPos.x, screenPos.y);
                circle.scale.set(this.camera.zoom);
                circle.alpha = 1; // Always fully visible
            }
        }

        // Update lighting system (renders sun-based shadows) - DISABLED FOR DEBUG
        // if (this.lightingSystem && this.obstacleSprites.size > 0) {
        //     this.lightingSystem.update(this.camera);
        // }
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

        // XP text (smaller, below username)
        const xpText = new PIXI.Text({
            text: `${playerData.xp || 0} XP`,
            style: {
                fontSize: 4.5,
                fill: 0xFFD700,
                stroke: { color: 0x000000, width: 0.12 },
                fontWeight: 'bold'
            }
        });
        xpText.resolution = 4;
        xpText.anchor.set(0.5, 1); // Anchor at bottom center

        container.addChild(shadow);
        container.addChild(body);
        container.addChild(highlight);
        container.addChild(direction);
        container.addChild(weaponSprite);

        // Add nameText and xpText separately to stage so they don't rotate with player
        container.zIndex = 20; // Game objects layer
        nameText.zIndex = 200; // UI layer (above lighting)
        xpText.zIndex = 200; // UI layer (above lighting)
        this.app.stage.addChild(container);
        this.app.stage.addChild(nameText);
        this.app.stage.addChild(xpText);

        return {
            container,
            position: Vec(playerData.x, playerData.y),
            rotation: playerData.rotation,
            nameText,
            xpText,
            weaponSprite
        };
    }

    private createObstacleSprite(obstacleData: ObstacleData): RenderObject {
        const container = new PIXI.Container();
        let leavesContainer: PIXI.Container | undefined = undefined;

        if (obstacleData.type === 'tree') {
            // Shadow for tree (on trunk container)
            const shadow = new PIXI.Graphics();
            shadow.ellipse(0.5, 1, 4 * obstacleData.scale, 2 * obstacleData.scale);
            shadow.fill({ color: 0x000000, alpha: 0.35 });
            container.addChild(shadow);

            // Create separate container for leaves (will render above players)
            leavesContainer = new PIXI.Container();

            // Tree with trunk and leaves
            const trunkTex = this.assetManager.getTexture('tree_trunk');
            const leavesTex = this.assetManager.getTexture('tree_leaves');

            if (trunkTex) {
                const trunk = new PIXI.Sprite(trunkTex);
                trunk.anchor.set(0.5, 0.5);
                trunk.scale.set(0.08 * obstacleData.scale);
                container.addChild(trunk); // Trunk stays in main container
            }

            if (leavesTex) {
                const leaves = new PIXI.Sprite(leavesTex);
                leaves.anchor.set(0.5, 0.5);
                leaves.scale.set(0.08 * obstacleData.scale);
                leaves.alpha = 0.85; // Make leaves slightly transparent
                leavesContainer.addChild(leaves); // Leaves go in separate container
            }

            // Fallback if no textures
            if (!trunkTex && !leavesTex) {
                // Trunk
                const trunk = new PIXI.Graphics();
                trunk.rect(-0.5 * obstacleData.scale, -1 * obstacleData.scale, obstacleData.scale, 3 * obstacleData.scale);
                trunk.fill({ color: 0x4a3728 });
                trunk.stroke({ color: 0x2d2116, width: 0.2 });

                // Leaves
                const leaves = new PIXI.Graphics();
                leaves.circle(0, -1, 3.5 * obstacleData.scale);
                leaves.fill({ color: 0x2d6b22, alpha: 0.85 }); // Slightly transparent
                leaves.circle(0, -1, 3.5 * obstacleData.scale);
                leaves.stroke({ color: 0x1f5018, width: 0.3 });

                container.addChild(trunk); // Trunk in main container
                leavesContainer.addChild(leaves); // Leaves in separate container
            }

            // Add leaves container to stage at higher z-index (above players)
            leavesContainer.zIndex = 30; // Above players (20) but below bullets (25)
            this.app.stage.addChild(leavesContainer);
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
        } else if (obstacleData.type === 'gate') {
            // Gate: 8 wide × 32 tall (vertical gate like a door)
            const halfWidth = 4 * obstacleData.scale;      // Half of 8
            const halfHeight = 16 * obstacleData.scale;    // Half of 32

            const gate = new PIXI.Graphics();

            if (obstacleData.open) {
                // Open gate - draw as two side panels (swung open)
                // Left panel
                gate.rect(-halfWidth - 3, -halfHeight, 2, halfHeight * 2);
                gate.fill({ color: 0x8B4513 }); // Brown wood
                gate.stroke({ color: 0x654321, width: 0.2 });

                // Right panel
                gate.rect(halfWidth + 1, -halfHeight, 2, halfHeight * 2);
                gate.fill({ color: 0x8B4513 });
                gate.stroke({ color: 0x654321, width: 0.2 });

                // Open indicator (subtle green tint around gate area)
                const openIndicator = new PIXI.Graphics();
                openIndicator.rect(-halfWidth, -halfHeight, halfWidth * 2, halfHeight * 2);
                openIndicator.fill({ color: 0x00FF00, alpha: 0.1 });
                container.addChild(openIndicator);
            } else {
                // Closed gate - solid wooden door
                gate.rect(-halfWidth, -halfHeight, halfWidth * 2, halfHeight * 2);
                gate.fill({ color: 0x8B4513 }); // Brown wood
                gate.stroke({ color: 0x654321, width: 0.4 });

                // Add wooden planks detail (horizontal lines)
                for (let i = 1; i < 4; i++) {
                    const plankY = -halfHeight + (i * halfHeight * 2 / 4);
                    gate.moveTo(-halfWidth, plankY);
                    gate.lineTo(halfWidth, plankY);
                    gate.stroke({ color: 0x654321, width: 0.2 });
                }

                // Add metal bands (darker rectangles)
                const bandWidth = halfWidth * 1.5;
                const bandHeight = 0.8;
                gate.rect(-bandWidth, -halfHeight + 4, bandWidth * 2, bandHeight);
                gate.fill({ color: 0x404040, alpha: 0.8 });
                gate.rect(-bandWidth, halfHeight - 4, bandWidth * 2, bandHeight);
                gate.fill({ color: 0x404040, alpha: 0.8 });
            }

            container.addChild(gate);
        }

        container.zIndex = 10; // Obstacles layer (trunks)
        this.app.stage.addChild(container);

        return {
            container,
            position: Vec(obstacleData.x, obstacleData.y),
            rotation: obstacleData.rotation,
            leavesContainer // Include leaves container for trees (undefined for other obstacles)
        };
    }

    private createLootSprite(lootData: LootData): RenderObject {
        const container = new PIXI.Container();

        // Handle XP orb separately
        if (lootData.type === 'xp_orb') {
            const graphic = new PIXI.Graphics();
            graphic.circle(0, 0, 2);  // Small yellow circle
            graphic.fill({ color: 0xFFFF00, alpha: 0.9 });
            graphic.stroke({ color: 0xFFAA00, width: 0.3 });

            // Add glow effect
            const glow = new PIXI.Graphics();
            glow.circle(0, 0, 3);
            glow.fill({ color: 0xFFFF00, alpha: 0.3 });
            container.addChild(glow);
            container.addChild(graphic);

            container.zIndex = 15;
            this.app.stage.addChild(container);

            return {
                container,
                position: Vec(lootData.x, lootData.y),
                rotation: 0
            };
        }

        // Regular loot rendering
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

        container.zIndex = 15; // Loot layer (above obstacles, below players)
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

        const tileSize = 32;

        // Zone 1: Main Arena (512x512)
        const zone1Size = 512;
        for (let x = 0; x < zone1Size; x += tileSize) {
            for (let y = 0; y < zone1Size; y += tileSize) {
                // Alternate grass shades for subtle checkerboard
                const shade = (x/tileSize + y/tileSize) % 2 === 0 ? 0x7fa84f : 0x6d944a;
                this.grassBackground.rect(x, y, tileSize, tileSize);
                this.grassBackground.fill({ color: shade, alpha: 0.15 });
            }
        }

        // Zone 2: Forest Clearing (256x256) at offset (600, 0)
        const zone2OffsetX = 600;
        const zone2OffsetY = 0;
        const zone2Size = 256;
        for (let x = 0; x < zone2Size; x += tileSize) {
            for (let y = 0; y < zone2Size; y += tileSize) {
                // Same checkerboard pattern for Zone 2
                const shade = (x/tileSize + y/tileSize) % 2 === 0 ? 0x7fa84f : 0x6d944a;
                this.grassBackground.rect(zone2OffsetX + x, zone2OffsetY + y, tileSize, tileSize);
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
