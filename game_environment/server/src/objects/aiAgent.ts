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

    weapons: [Gun | null, Gun | null] = [null, null];
    activeWeaponIndex: 0 | 1 = 0;
    ammo: Map<string, number> = new Map([
        ["9mm", 0],
        ["556mm", 0],
        ["12g", 0]
    ]);

    // AI-specific properties
    agentId: string; // External agent ID from backend
    lastInputSeq: number = 0;
    currentInput: InputPacket | null = null;

    moving: boolean = false;
    attacking: boolean = false;

    constructor(id: number, agentId: string, username: string, position: Vector, color: number) {
        super(id, position);

        this.agentId = agentId;
        this.username = username;
        this.health = GameConstants.PLAYER_MAX_HEALTH;
        this.maxHealth = GameConstants.PLAYER_MAX_HEALTH;
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
            const velocity = Vec.scale(movement, this.speed * 25);
            const newPosition = Vec.add(this.position, velocity);

            // Check collision with obstacles
            const newHitbox = new CircleHitbox(GameConstants.PLAYER_RADIUS, newPosition);
            const nearbyObjects = game.grid.intersectsHitbox(newHitbox);

            let collision = false;
            for (const obj of nearbyObjects) {
                if (obj === this) continue;
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

        // Update rotation to face mouse
        this.rotation = Angle.betweenPoints(this.position, input.mouse);

        // Handle attacking
        this.attacking = input.attacking;
        if (this.attacking) {
            this.tryShoot(game);
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
    }

    tryShoot(game: Game): void {
        const activeWeapon = this.weapons[this.activeWeaponIndex];
        if (!activeWeapon) {
            return;
        }

        const now = Date.now();
        if (!activeWeapon.canShoot(now)) {
            // Auto-reload if empty
            if (activeWeapon.ammo <= 0 && !activeWeapon.reloading) {
                activeWeapon.startReload(now);
            }
            return;
        }

        activeWeapon.shoot(now);

        // Create bullets
        const bulletCount = activeWeapon.definition.bulletCount;
        const spread = activeWeapon.definition.spread ?? 0;

        for (let i = 0; i < bulletCount; i++) {
            let angle = this.rotation;

            if (bulletCount > 1) {
                // Spread bullets
                const spreadAngle = (i - (bulletCount - 1) / 2) * (spread / bulletCount);
                angle += spreadAngle;
            }

            const direction = Vec.fromPolar(angle);
            const bulletStart = Vec.add(this.position, Vec.scale(direction, GameConstants.PLAYER_RADIUS + 1));

            game.createBullet(bulletStart, direction, activeWeapon.definition, this);
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
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    die(): void {
        this.dead = true;
        this.health = 0;
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
            color: this.color
        };
    }
}
