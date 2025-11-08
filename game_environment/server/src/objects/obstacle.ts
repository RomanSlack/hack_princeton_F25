import { Obstacles, type ObstacleDefinition } from "../../../common/src/definitions/obstacles";
import { CircleHitbox, RectangleHitbox, type Hitbox } from "../../../common/src/utils/hitbox";
import { Vec, type Vector } from "../../../common/src/utils/vector";
import { GameObject } from "./gameObject";
import type { ObstacleData } from "../../../common/src/packets";

export class Obstacle extends GameObject {
    definition: ObstacleDefinition;
    hitbox: Hitbox;
    rotation: number;
    scale: number;
    health: number;
    maxHealth: number;
    destroyed: boolean = false;
    open: boolean = false; // For interactive obstacles like gates

    constructor(id: number, type: string, position: Vector, rotation: number = 0, scale: number = 1) {
        super(id, position);

        this.definition = Obstacles[type];
        if (!this.definition) {
            throw new Error(`Unknown obstacle type: ${type}`);
        }

        this.rotation = rotation;
        this.scale = scale;
        this.health = this.definition.health;
        this.maxHealth = this.definition.health;

        // Create hitbox
        if (this.definition.hitbox.type === 'circle') {
            this.hitbox = new CircleHitbox(
                this.definition.hitbox.radius! * scale,
                Vec.clone(position)
            );
        } else {
            const halfWidth = (this.definition.hitbox.width! * scale) / 2;
            const halfHeight = (this.definition.hitbox.height! * scale) / 2;
            this.hitbox = RectangleHitbox.fromRect(
                position.x,
                position.y,
                this.definition.hitbox.width! * scale,
                this.definition.hitbox.height! * scale
            );
        }
    }

    damage(amount: number): void {
        if (this.definition.indestructible || this.destroyed) return;

        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.destroyed = true;
            this.dead = true;
        }
    }

    serialize(): ObstacleData {
        return {
            id: this.id,
            type: this.definition.idString,
            x: this.position.x,
            y: this.position.y,
            rotation: this.rotation,
            scale: this.scale,
            destroyed: this.destroyed,
            open: this.open
        };
    }

    toggleOpen(): void {
        if (this.definition.idString === 'gate') {
            this.open = !this.open;
            console.log(`[Obstacle] Gate ${this.id} is now ${this.open ? 'OPEN' : 'CLOSED'}`);
        }
    }

    isPassable(): boolean {
        // Gates are passable when open
        if (this.definition.idString === 'gate' && this.open) {
            return true;
        }
        return this.destroyed;
    }
}
