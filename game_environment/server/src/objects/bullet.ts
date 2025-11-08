import { Vec, type Vector } from "../../../common/src/utils/vector";
import { RectangleHitbox } from "../../../common/src/utils/hitbox";
import type { GunDefinition } from "../../../common/src/definitions/guns";
import type { Game } from "../game";
import { Obstacle } from "./obstacle";
import type { BulletData } from "../../../common/src/packets";
import type { GameObject } from "./gameObject";

// Forward declaration to avoid circular dependency
interface Damageable extends GameObject {
    damage(amount: number, source?: any): void;
}

export class Bullet {
    id: number;
    position: Vector;
    direction: Vector;
    rotation: number;
    speed: number;
    damage: number;
    maxRange: number;
    shooter: GameObject;
    shooterColor: number;

    traveledDistance = 0;
    dead = false;

    constructor(id: number, start: Vector, direction: Vector, gun: GunDefinition, shooter: GameObject) {
        this.id = id;
        this.position = Vec.clone(start);
        this.direction = Vec.normalize(direction);
        this.rotation = Vec.direction(this.direction);
        this.speed = gun.speed;

        // Apply damage multiplier from shooter's level
        const multiplier = ('getStatMultiplier' in shooter) ? (shooter as any).getStatMultiplier() : 1;
        this.damage = gun.damage * multiplier;

        this.maxRange = gun.range;
        this.shooter = shooter;

        // Store shooter's color for bullet trail
        this.shooterColor = ('color' in shooter) ? (shooter as any).color : 0xFFFFFF;
    }

    update(dt: number, game: Game): void {
        const velocity = Vec.scale(this.direction, this.speed * dt);
        const newPosition = Vec.add(this.position, velocity);
        const distance = Vec.len(velocity);

        // Create bounding box for spatial query
        const lineRect = RectangleHitbox.fromLine(this.position, newPosition);
        const nearbyObjects = game.grid.intersectsHitbox(lineRect);

        let closestHit: {
            object: GameObject;
            point: Vector;
            distance: number;
        } | null = null;

        for (const obj of nearbyObjects) {
            // Skip shooter
            if (obj === this.shooter) continue;

            // Check line-hitbox intersection
            const intersection = obj.hitbox.intersectsLine(this.position, newPosition);
            if (intersection) {
                const hitDistance = Vec.len(Vec.sub(intersection.point, this.position));
                if (!closestHit || hitDistance < closestHit.distance) {
                    closestHit = {
                        object: obj,
                        point: intersection.point,
                        distance: hitDistance
                    };
                }
            }
        }

        if (closestHit) {
            // Hit something
            this.position = closestHit.point;

            // Check if it's an Obstacle (has a definition property)
            if (closestHit.object instanceof Obstacle) {
                const wasAlive = !closestHit.object.destroyed;
                closestHit.object.damage(this.damage);

                // If obstacle was just destroyed, spawn XP orbs
                if (wasAlive && closestHit.object.destroyed) {
                    const xpAmount = closestHit.object.definition.idString === "rock" ? 100 :
                                   closestHit.object.definition.idString === "tree" ? 50 :
                                   closestHit.object.definition.idString === "crate" ? 30 : 0;
                    if (xpAmount > 0) {
                        const orbCount = Math.ceil(xpAmount / 10); // 10 XP per orb
                        game.spawnXPOrbs(closestHit.object.position, orbCount, 10);
                    }
                }
            } else {
                // It's a Player or AIAgent
                const damageable = closestHit.object as Damageable;
                damageable.damage(this.damage, this.shooter);
            }

            this.dead = true;
        } else {
            // No collision, move bullet
            this.position = newPosition;
            this.traveledDistance += distance;

            // Check max range
            if (this.traveledDistance >= this.maxRange) {
                this.dead = true;
            }
        }
    }

    serialize(): BulletData {
        return {
            id: this.id,
            x: this.position.x,
            y: this.position.y,
            rotation: this.rotation,
            color: this.shooterColor
        };
    }
}
