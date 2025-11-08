import { π } from "../../../common/src/utils/math";

export const MAP_DATA = {
    width: 512,
    height: 512,

    obstacles: [
        // Dummy obstacle at start (workaround for first-obstacle hitbox bug)
        { type: "tree", x: -100, y: -200, rotation: 0 },

        // Border walls - form a clean box around the 512x512 map
        // Each wall type has the correct hitbox dimensions built-in, no rotation needed!

        // Top wall (horizontal) - 512 wide × 8 tall, positioned to match bottom wall symmetry
        { type: "wall_horizontal", x: 256, y: 4, rotation: 0, scale: 1 },
        // Bottom wall (horizontal) - 512 wide × 8 tall, at y=508
        { type: "wall_horizontal", x: 256, y: 508, rotation: 0, scale: 1 },
        // Left wall (vertical) - 8 wide × 512 tall, at x=4
        { type: "wall_vertical", x: 4, y: 256, rotation: 0, scale: 1 },
        // Right wall (vertical) - 8 wide × 512 tall, at x=508
        { type: "wall_vertical", x: 508, y: 256, rotation: 0, scale: 1 },

        // Tree border around the walls (creates forest edge effect)
        // Top border trees (outside the top wall at y=4)
        { type: "tree", x: 30, y: -20, rotation: 0, scale: 0.9 },
        { type: "tree", x: 70, y: -22, rotation: 0, scale: 1.1 },
        { type: "tree", x: 110, y: -24, rotation: 0, scale: 0.95 },
        { type: "tree", x: 150, y: -21, rotation: 0, scale: 1.05 },
        { type: "tree", x: 190, y: -23, rotation: 0, scale: 0.9 },
        { type: "tree", x: 230, y: -20, rotation: 0, scale: 1.0 },
        { type: "tree", x: 270, y: -22, rotation: 0, scale: 1.1 },
        { type: "tree", x: 310, y: -24, rotation: 0, scale: 0.95 },
        { type: "tree", x: 350, y: -21, rotation: 0, scale: 1.05 },
        { type: "tree", x: 390, y: -23, rotation: 0, scale: 0.9 },
        { type: "tree", x: 430, y: -20, rotation: 0, scale: 1.0 },
        { type: "tree", x: 470, y: -22, rotation: 0, scale: 1.1 },

        // Bottom border trees (outside the bottom wall at y=508)
        { type: "tree", x: 30, y: 532, rotation: 0, scale: 0.9 },
        { type: "tree", x: 70, y: 534, rotation: 0, scale: 1.1 },
        { type: "tree", x: 110, y: 536, rotation: 0, scale: 0.95 },
        { type: "tree", x: 150, y: 533, rotation: 0, scale: 1.05 },
        { type: "tree", x: 190, y: 535, rotation: 0, scale: 0.9 },
        { type: "tree", x: 230, y: 532, rotation: 0, scale: 1.0 },
        { type: "tree", x: 270, y: 534, rotation: 0, scale: 1.1 },
        { type: "tree", x: 310, y: 536, rotation: 0, scale: 0.95 },
        { type: "tree", x: 350, y: 533, rotation: 0, scale: 1.05 },
        { type: "tree", x: 390, y: 535, rotation: 0, scale: 0.9 },
        { type: "tree", x: 430, y: 532, rotation: 0, scale: 1.0 },
        { type: "tree", x: 470, y: 534, rotation: 0, scale: 1.1 },

        // Left border trees (outside the left wall at x=4)
        { type: "tree", x: -20, y: 30, rotation: 0, scale: 0.9 },
        { type: "tree", x: -22, y: 70, rotation: 0, scale: 1.1 },
        { type: "tree", x: -24, y: 110, rotation: 0, scale: 0.95 },
        { type: "tree", x: -21, y: 150, rotation: 0, scale: 1.05 },
        { type: "tree", x: -23, y: 190, rotation: 0, scale: 0.9 },
        { type: "tree", x: -20, y: 230, rotation: 0, scale: 1.0 },
        { type: "tree", x: -22, y: 270, rotation: 0, scale: 1.1 },
        { type: "tree", x: -24, y: 310, rotation: 0, scale: 0.95 },
        { type: "tree", x: -21, y: 350, rotation: 0, scale: 1.05 },
        { type: "tree", x: -23, y: 390, rotation: 0, scale: 0.9 },
        { type: "tree", x: -20, y: 430, rotation: 0, scale: 1.0 },
        { type: "tree", x: -22, y: 470, rotation: 0, scale: 1.1 },

        // Right border trees (outside the right wall at x=508)
        { type: "tree", x: 532, y: 30, rotation: 0, scale: 0.9 },
        { type: "tree", x: 534, y: 70, rotation: 0, scale: 1.1 },
        { type: "tree", x: 536, y: 110, rotation: 0, scale: 0.95 },
        { type: "tree", x: 533, y: 150, rotation: 0, scale: 1.05 },
        { type: "tree", x: 535, y: 190, rotation: 0, scale: 0.9 },
        { type: "tree", x: 532, y: 230, rotation: 0, scale: 1.0 },
        { type: "tree", x: 534, y: 270, rotation: 0, scale: 1.1 },
        { type: "tree", x: 536, y: 310, rotation: 0, scale: 0.95 },
        { type: "tree", x: 533, y: 350, rotation: 0, scale: 1.05 },
        { type: "tree", x: 535, y: 390, rotation: 0, scale: 0.9 },
        { type: "tree", x: 532, y: 430, rotation: 0, scale: 1.0 },
        { type: "tree", x: 534, y: 470, rotation: 0, scale: 1.1 },

        // Trees scattered around
        { type: "tree", x: 50, y: 50, rotation: 0 },
        { type: "tree", x: 120, y: 80, rotation: 0 },
        { type: "tree", x: 200, y: 150, rotation: 0 },
        { type: "tree", x: 300, y: 100, rotation: 0 },
        { type: "tree", x: 400, y: 180, rotation: 0 },
        { type: "tree", x: 450, y: 90, rotation: 0 },
        { type: "tree", x: 100, y: 250, rotation: 0 },
        { type: "tree", x: 250, y: 300, rotation: 0 },
        { type: "tree", x: 380, y: 320, rotation: 0 },
        { type: "tree", x: 150, y: 400, rotation: 0 },
        { type: "tree", x: 300, y: 450, rotation: 0 },
        { type: "tree", x: 420, y: 440, rotation: 0 },
        { type: "tree", x: 80, y: 180, rotation: 0 },
        { type: "tree", x: 180, y: 220, rotation: 0 },
        { type: "tree", x: 350, y: 250, rotation: 0 },
        { type: "tree", x: 460, y: 300, rotation: 0 },

        // Rocks
        { type: "rock", x: 150, y: 120, rotation: 0 },
        { type: "rock", x: 320, y: 200, rotation: 0 },
        { type: "rock", x: 220, y: 380, rotation: 0 },
        { type: "rock", x: 400, y: 260, rotation: 0 },
        { type: "rock", x: 100, y: 350, rotation: 0 },
        { type: "rock", x: 380, y: 400, rotation: 0 },

        // Crates
        { type: "crate", x: 256, y: 256, rotation: 0 },
        { type: "crate", x: 180, y: 300, rotation: π / 4 },
        { type: "crate", x: 350, y: 180, rotation: π / 6 },
        { type: "crate", x: 140, y: 160, rotation: π / 3 },
        { type: "crate", x: 400, y: 350, rotation: π / 2 },

        // Dummy obstacle (workaround for last-obstacle hitbox bug)
        // This ensures the last crate above gets proper collision
        { type: "tree", x: -100, y: -100, rotation: 0 }
    ],

    loot: [
        // Weapons
        { type: "pistol", x: 100, y: 100, count: 1 },
        { type: "rifle", x: 400, y: 400, count: 1 },
        { type: "shotgun", x: 256, y: 100, count: 1 },
        { type: "pistol", x: 150, y: 450, count: 1 },
        { type: "rifle", x: 450, y: 150, count: 1 },

        // Ammo
        { type: "ammo_9mm", x: 150, y: 150, count: 30 },
        { type: "ammo_9mm", x: 350, y: 350, count: 30 },
        { type: "ammo_9mm", x: 200, y: 400, count: 30 },
        { type: "ammo_556mm", x: 300, y: 200, count: 60 },
        { type: "ammo_556mm", x: 450, y: 350, count: 60 },
        { type: "ammo_556mm", x: 100, y: 300, count: 60 },
        { type: "ammo_12g", x: 350, y: 150, count: 16 },
        { type: "ammo_12g", x: 200, y: 450, count: 16 },
        { type: "ammo_12g", x: 450, y: 250, count: 16 }
    ],

    playerSpawns: [
        { x: 256, y: 256 },
        { x: 100, y: 100 },
        { x: 400, y: 400 },
        { x: 100, y: 400 },
        { x: 400, y: 100 },
        { x: 150, y: 256 },
        { x: 362, y: 256 },
        { x: 256, y: 150 },
        { x: 256, y: 362 },
        { x: 180, y: 180 },
        { x: 332, y: 332 },
        { x: 180, y: 332 },
        { x: 332, y: 180 }
    ]
};
