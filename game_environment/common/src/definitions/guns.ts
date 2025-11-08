export interface GunDefinition {
    idString: string;
    name: string;
    ammoType: string;
    capacity: number;
    reloadTime: number;
    fireDelay: number;
    damage: number;
    range: number;
    speed: number;
    bulletCount: number;
    spread?: number;
    isMelee?: boolean;
}

export const Guns: Record<string, GunDefinition> = {
    fists: {
        idString: "fists",
        name: "Fists",
        ammoType: "none",
        capacity: 1,
        reloadTime: 0,
        fireDelay: 300,
        damage: 25,
        range: 6,
        speed: 0,
        bulletCount: 1,
        isMelee: true
    },
    pistol: {
        idString: "pistol",
        name: "Pistol",
        ammoType: "universal",
        capacity: 15,
        reloadTime: 1500,
        fireDelay: 150,
        damage: 8,
        range: 120,
        speed: 0.25,
        bulletCount: 1
    },
    rifle: {
        idString: "rifle",
        name: "Rifle",
        ammoType: "universal",
        capacity: 30,
        reloadTime: 2200,
        fireDelay: 100,
        damage: 10,
        range: 160,
        speed: 0.3,
        bulletCount: 1
    },
    shotgun: {
        idString: "shotgun",
        name: "Shotgun",
        ammoType: "universal",
        capacity: 8,
        reloadTime: 800,
        fireDelay: 900,
        damage: 7,
        range: 80,
        speed: 0.2,
        bulletCount: 8,
        spread: 0.3
    }
};
