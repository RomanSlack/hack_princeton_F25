import { Vec, type Vector } from "../../../common/src/utils/vector";
import { CircleHitbox } from "../../../common/src/utils/hitbox";
import { GameObject } from "./gameObject";
import { Gun } from "../gun";
import { Guns } from "../../../common/src/definitions/guns";
import { GameConstants } from "../../../common/src/constants";
import type { InputPacket, PlayerData } from "../../../common/src/packets";
import type { Game } from "../game";
import { Angle } from "../../../common/src/utils/math";

export class AIAgent extends GameObject {
    username: string;
    hitbox: CircleHitbox;
    rotation: number = 0;
    health: number;
    maxHealth: number;
    speed: number;
    color: number;
    xp: number = 0; // XP tracking
    kills: number = 0; // Kill counter (persists through death)

    weapons: [Gun | null, Gun | null] = [null, null];
    activeWeaponIndex: 0 | 1 = 0;
    ammo: Map<string, number> = new Map([
        ["universal", 0]
    ]);

    // AI-specific properties
    agentId: string; // External agent ID from backend
    lastInputSeq: number = 0;
    currentInput: InputPacket | null = null;
    justDied: boolean = false; // Flag for backend notification

    moving: boolean = false;
    attacking: boolean = false;

    // Smooth movement properties
    moveTarget: Vector | null = null; // Target position for smooth movement
    moveStartTime: number = 0; // When movement started
    moveStartPos: Vector | null = null; // Position when movement started
    moveDuration: number = 0; // How long the movement should take

    constructor(id: number, agentId: string, username: string, position: Vector, color: number) {
        super(id, position);

        this.agentId = agentId;
        this.username = username;
        const healthMultiplier = this.getStatMultiplier();
        this.health = GameConstants.PLAYER_MAX_HEALTH * healthMultiplier;
        this.maxHealth = GameConstants.PLAYER_MAX_HEALTH * healthMultiplier;
        this.speed = GameConstants.PLAYER_SPEED;
        this.color = color;

        this.hitbox = new CircleHitbox(GameConstants.PLAYER_RADIUS, Vec.clone(position));
    }

    // Set command from backend API
    setCommand(input: InputPacket): void {
        this.currentInput = input;
    }

    processInput(input: InputPacket, game: Game): void {
        if (this.dead) return;

        this.lastInputSeq = input.seq;

        // Update rotation to face mouse (needed for attacking)
        this.rotation = Angle.betweenPoints(this.position, input.mouse);

        // Handle attacking FIRST (before movement, so shots land before target moves)
        this.attacking = input.attacking;
        if (this.attacking) {
            this.tryShoot(game);
        }

        // Calculate movement direction
        let moveX = 0;
        let moveY = 0;

        if (input.movement.up) moveY -= 1;
        if (input.movement.down) moveY += 1;
        if (input.movement.left) moveX -= 1;
        if (input.movement.right) moveX += 1;

        this.moving = moveX !== 0 || moveY !== 0;

        if (this.moving) {
            // Normalize diagonal movement
            const movement = Vec.normalize(Vec(moveX, moveY));
            // Speed is 0.09 units per millisecond, multiply by tick interval (~25ms)
            // Apply stat multiplier from level
            const effectiveSpeed = this.speed * this.getStatMultiplier();
            const velocity = Vec.scale(movement, effectiveSpeed * 25);
            const newPosition = Vec.add(this.position, velocity);

            // Check collision with obstacles
            const newHitbox = new CircleHitbox(GameConstants.PLAYER_RADIUS, newPosition);
            const nearbyObjects = game.grid.intersectsHitbox(newHitbox);

            let collision = false;
            for (const obj of nearbyObjects) {
                if (obj === this) continue;
                // Skip collision if it's a passable obstacle (open gate or destroyed)
                if ('isPassable' in obj && typeof obj.isPassable === 'function' && obj.isPassable()) {
                    continue;
                }
                if (newHitbox.collidesWith(obj.hitbox)) {
                    collision = true;
                    break;
                }
            }

            if (!collision) {
                this.position = newPosition;
                this.hitbox.position = newPosition;
                game.grid.updateObject(this);
            }
        }

        // Handle actions
        if (input.actions.switchWeapon) {
            this.activeWeaponIndex = this.activeWeaponIndex === 0 ? 1 : 0;
        }

        if (input.actions.reload) {
            const activeWeapon = this.weapons[this.activeWeaponIndex];
            if (activeWeapon) {
                activeWeapon.startReload(Date.now());
            }
        }

        if (input.actions.pickup) {
            game.checkPickups(this);
        }

        if (input.actions.interact) {
            game.checkInteractions(this);
        }
    }

    tryShoot(game: Game): void {
        const activeWeapon = this.weapons[this.activeWeaponIndex];
        if (!activeWeapon) {
            return;
        }

        const now = Date.now();
        if (!activeWeapon.canShoot(now)) {
            // Auto-reload if empty (but not for melee weapons)
            if (!activeWeapon.definition.isMelee && activeWeapon.ammo <= 0 && !activeWeapon.reloading) {
                activeWeapon.startReload(now);
            }
            return;
        }

        // Handle melee weapons (fists)
        if (activeWeapon.definition.isMelee) {
            activeWeapon.shoot(now);
            this.performMeleeAttack(game, activeWeapon.definition);
            return;
        }

        activeWeapon.shoot(now);

        // Create bullets
        const bulletCount = activeWeapon.definition.bulletCount;
        const spread = activeWeapon.definition.spread ?? 0;

        // Add random spray to all guns (inaccuracy simulation)
        const baseInaccuracy = 0.05; // ~3 degrees of random spray

        for (let i = 0; i < bulletCount; i++) {
            let angle = this.rotation;

            if (bulletCount > 1) {
                // Spread bullets (for shotguns)
                const spreadAngle = (i - (bulletCount - 1) / 2) * (spread / bulletCount);
                angle += spreadAngle;
            }

            // Add random inaccuracy to each bullet
            const randomSpray = (Math.random() - 0.5) * baseInaccuracy;
            angle += randomSpray;

            const direction = Vec.fromPolar(angle);
            const bulletStart = Vec.add(this.position, Vec.scale(direction, GameConstants.PLAYER_RADIUS + 1));

            game.createBullet(bulletStart, direction, activeWeapon.definition, this);
        }
    }

    performMeleeAttack(game: Game, weaponDef: any): void {
        const direction = Vec.fromPolar(this.rotation);
        const meleeRange = weaponDef.range;
        const meleeDamage = weaponDef.damage * this.getStatMultiplier();

        // Check for hits on players
        for (const target of game.players.values()) {
            if (target.dead) continue;

            const distance = Vec.distance(this.position, target.position);
            if (distance <= meleeRange) {
                const toTarget = Vec.normalize(Vec.sub(target.position, this.position));
                const dotProduct = Vec.dot(direction, toTarget);

                if (dotProduct > 0.5) {
                    target.damage(meleeDamage, this);
                }
            }
        }

        // Check for hits on other AI agents
        for (const target of game.aiAgents.values()) {
            if (target === this || target.dead) continue;

            const distance = Vec.distance(this.position, target.position);
            if (distance <= meleeRange) {
                const toTarget = Vec.normalize(Vec.sub(target.position, this.position));
                const dotProduct = Vec.dot(direction, toTarget);

                if (dotProduct > 0.5) {
                    target.damage(meleeDamage, this);
                }
            }
        }

        // Check for hits on obstacles
        for (const obstacle of game.obstacles) {
            if (obstacle.dead || obstacle.definition.indestructible) continue;

            const distance = Vec.distance(this.position, obstacle.position);
            if (distance <= meleeRange + 3) {
                const toObstacle = Vec.normalize(Vec.sub(obstacle.position, this.position));
                const dotProduct = Vec.dot(direction, toObstacle);

                if (dotProduct > 0.3) {
                    const wasAlive = !obstacle.destroyed;
                    obstacle.damage(meleeDamage);

                    // Spawn XP orbs if obstacle was destroyed
                    if (wasAlive && obstacle.destroyed) {
                        const xpAmount = obstacle.definition.idString === "rock" ? 100 :
                                       obstacle.definition.idString === "tree" ? 50 :
                                       obstacle.definition.idString === "crate" ? 30 : 0;
                        if (xpAmount > 0) {
                            const orbCount = Math.ceil(xpAmount / 10);
                            game.spawnXPOrbs(obstacle.position, orbCount, 10);
                        }
                    }
                }
            }
        }
    }

    update(game: Game): void {
        if (this.dead) return;

        // Process current input if available
        if (this.currentInput) {
            this.processInput(this.currentInput, game);
        }

        const now = Date.now();

        // Update weapons
        for (const weapon of this.weapons) {
            if (weapon) {
                const ammoUsed = weapon.update(now, this.ammo.get(weapon.definition.ammoType) ?? 0);
                if (ammoUsed > 0) {
                    const currentAmmo = this.ammo.get(weapon.definition.ammoType) ?? 0;
                    this.ammo.set(weapon.definition.ammoType, currentAmmo - ammoUsed);
                }
            }
        }
    }

    addWeapon(gunType: string): boolean {
        const gunDef = Guns[gunType];
        if (!gunDef) return false;

        const gun = new Gun(gunDef);

        // Try to add to empty slot
        for (let i = 0; i < 2; i++) {
            if (!this.weapons[i]) {
                this.weapons[i] = gun;
                this.activeWeaponIndex = i as 0 | 1;
                return true;
            }
        }

        // Replace current weapon if no empty slots
        this.weapons[this.activeWeaponIndex] = gun;
        return true;
    }

    addAmmo(ammoType: string, count: number): void {
        const current = this.ammo.get(ammoType) ?? 0;
        this.ammo.set(ammoType, current + count);
    }

    damage(amount: number, source?: AIAgent | any): void {
        if (this.dead) return;

        this.health -= amount;

        // Lose XP when hit (10% of damage as XP loss, min 2 XP)
        const xpLoss = Math.max(2, Math.floor(amount * 0.1));
        this.xp = Math.max(0, this.xp - xpLoss);

        // Attacker gains XP (3 XP per hit - reduced for balance)
        if (source && 'xp' in source && source !== this) {
            source.xp += 3;
        }

        if (this.health <= 0) {
            this.health = 0;
            // On death, attacker gets kill bonus XP (25 XP - reduced for balance) and kill credit
            if (source && 'xp' in source && source !== this) {
                source.xp += 25;
                // Increment kill counter (persists through death)
                if ('kills' in source) {
                    source.kills += 1;
                    console.log(`[AIAgent] ${source.username} got a kill! Total kills: ${source.kills}`);
                }
            }
            this.die();
        }
    }

    die(): void {
        this.dead = true;
        this.health = 0;
        this.justDied = true; // Set flag for backend
    }

    respawn(position: Vector, game: any): void {
        this.dead = false;
        this.position = position;
        this.hitbox.position = position;

        // Reset stats
        const healthMultiplier = this.getStatMultiplier();
        this.health = GameConstants.PLAYER_MAX_HEALTH * healthMultiplier;
        this.maxHealth = GameConstants.PLAYER_MAX_HEALTH * healthMultiplier;
        this.xp = 0; // Reset XP to 0
        // NOTE: kills counter is NOT reset - it persists through death

        // Reset weapons and ammo - very limited starting ammo (66% less)
        this.weapons = [null, null];
        this.activeWeaponIndex = 0;
        this.addWeapon("fists");
        this.addWeapon("pistol");
        this.ammo.set("universal", 5); // 66% less than 15 = 5 rounds

        // Clear justDied flag after respawn
        this.justDied = false;

        // Update grid
        game.grid.updateObject(this);

        console.log(`[AIAgent ${this.username}] Respawned at (${position.x.toFixed(0)}, ${position.y.toFixed(0)}) with 0 XP`);
    }

    addXP(amount: number): void {
        this.xp += amount;
    }

    getLevel(): number {
        // 100 XP per level
        return Math.floor(this.xp / 100);
    }

    getStatMultiplier(): number {
        // 5% increase per level
        const level = this.getLevel();
        return 1 + (level * 0.05);
    }

    /**
     * Directly move the agent by a relative offset (for AI backend commands)
     * Uses smooth interpolation instead of instant teleportation
     */
    moveByOffset(offset: Vector, game: Game): boolean {
        const targetPosition = Vec.add(this.position, offset);

        // Check collision with obstacles at target position
        const newHitbox = new CircleHitbox(GameConstants.PLAYER_RADIUS, targetPosition);
        const nearbyObjects = game.grid.intersectsHitbox(newHitbox);

        let collision = false;
        for (const obj of nearbyObjects) {
            if (obj === this) continue;
            // Skip collision if it's a passable obstacle (open gate or destroyed)
            if ('isPassable' in obj && typeof obj.isPassable === 'function' && obj.isPassable()) {
                continue;
            }
            if (newHitbox.collidesWith(obj.hitbox)) {
                collision = true;
                break;
            }
        }

        if (collision) {
            // Collision detected - push back in opposite direction
            const pushBackDistance = 5; // Units to push back
            const pushBackOffset = Vec.scale(Vec.normalize(offset), -pushBackDistance);
            const pushBackPosition = Vec.add(this.position, pushBackOffset);

            // Check if pushback position is safe
            const pushBackHitbox = new CircleHitbox(GameConstants.PLAYER_RADIUS, pushBackPosition);
            const pushBackObjects = game.grid.intersectsHitbox(pushBackHitbox);

            let pushBackCollision = false;
            for (const obj of pushBackObjects) {
                if (obj === this) continue;
                if ('isPassable' in obj && typeof obj.isPassable === 'function' && obj.isPassable()) {
                    continue;
                }
                if (pushBackHitbox.collidesWith(obj.hitbox)) {
                    pushBackCollision = true;
                    break;
                }
            }

            // Only push back if the new position is safe
            if (!pushBackCollision) {
                const distance = pushBackDistance;
                const moveSpeed = 0.1; // Faster pushback
                const duration = Math.max(distance / moveSpeed, 100);

                this.moveTarget = pushBackPosition;
                this.moveStartPos = Vec.clone(this.position);
                this.moveStartTime = Date.now();
                this.moveDuration = duration;

                console.log(`[AIAgent ${this.username}] Pushed back ${pushBackDistance} units due to collision`);
            }

            return false; // Movement to target failed
        }

        // Start smooth movement to target
        const distance = Vec.len(offset);
        const moveSpeed = 0.05; // units per millisecond (50 units/second - much slower for smooth glide)
        const duration = Math.max(distance / moveSpeed, 200); // Minimum 200ms for very smooth animation

        this.moveTarget = targetPosition;
        this.moveStartPos = Vec.clone(this.position);
        this.moveStartTime = Date.now();
        this.moveDuration = duration;

        return true; // Movement initiated successfully
    }

    /**
     * Update smooth movement interpolation
     * Called every game tick
     */
    updateSmoothMovement(game: Game): void {
        if (!this.moveTarget || !this.moveStartPos) return;

        const now = Date.now();
        const elapsed = now - this.moveStartTime;
        const progress = Math.min(elapsed / this.moveDuration, 1.0);

        if (progress >= 1.0) {
            // Movement complete - snap to final position
            this.position = Vec.clone(this.moveTarget);
            this.hitbox.position = this.position;
            this.moveTarget = null;
            this.moveStartPos = null;
            game.grid.updateObject(this);
        } else {
            // Interpolate position using ease-in-out cubic for ultra-smooth motion
            // Starts slow, speeds up, then slows down again
            const easeProgress = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            this.position = Vec.add(
                this.moveStartPos,
                Vec.scale(Vec.sub(this.moveTarget, this.moveStartPos), easeProgress)
            );
            this.hitbox.position = this.position;
            game.grid.updateObject(this);
        }
    }

    serialize(): PlayerData {
        return {
            id: this.id,
            x: this.position.x,
            y: this.position.y,
            rotation: this.rotation,
            health: this.health,
            activeWeapon: this.activeWeaponIndex,
            username: this.username,
            dead: this.dead,
            color: this.color,
            xp: this.xp,
            level: this.getLevel(),
            kills: this.kills,
            attacking: this.attacking
        };
    }
}
