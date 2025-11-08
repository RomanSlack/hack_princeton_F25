import type { GunDefinition } from "../../common/src/definitions/guns";

export class Gun {
    definition: GunDefinition;
    ammo: number;
    lastShotTime: number = 0;
    reloading: boolean = false;
    reloadStartTime: number = 0;

    constructor(definition: GunDefinition) {
        this.definition = definition;
        this.ammo = definition.capacity;
    }

    canShoot(now: number): boolean {
        // Melee weapons don't use ammo or reload
        if (this.definition.isMelee) {
            return (now - this.lastShotTime) >= this.definition.fireDelay;
        }

        return !this.reloading &&
               this.ammo > 0 &&
               (now - this.lastShotTime) >= this.definition.fireDelay;
    }

    shoot(now: number): void {
        if (!this.canShoot(now)) return;

        // Melee weapons don't consume ammo
        if (!this.definition.isMelee) {
            this.ammo--;
        }

        this.lastShotTime = now;
    }

    startReload(now: number): void {
        // Melee weapons can't reload
        if (this.definition.isMelee) return;

        if (this.reloading || this.ammo === this.definition.capacity) return;
        this.reloading = true;
        this.reloadStartTime = now;
    }

    update(now: number, totalAmmo: number): number {
        if (this.reloading && (now - this.reloadStartTime) >= this.definition.reloadTime) {
            const needed = this.definition.capacity - this.ammo;
            const toLoad = Math.min(needed, totalAmmo);
            this.ammo += toLoad;
            this.reloading = false;
            return toLoad;
        }
        return 0;
    }
}
