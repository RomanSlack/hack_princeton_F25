import { π } from "../../../common/src/utils/math";

// Zone 1: Main Arena (original map at 0-512, 0-512)
const ZONE_1_DATA = {
    obstacles: [
        // Dummy obstacle at start (workaround for first-obstacle hitbox bug)
        { type: "tree", x: -100, y: -200, rotation: 0 },

        // Border walls - form a clean box around the 512x512 map
        // Top wall (horizontal) - 512 wide × 8 tall
        { type: "wall_horizontal", x: 256, y: 4, rotation: 0, scale: 1 },
        // Bottom wall (horizontal)
        { type: "wall_horizontal", x: 256, y: 508, rotation: 0, scale: 1 },
        // Left wall (vertical)
        { type: "wall_vertical", x: 4, y: 256, rotation: 0, scale: 1 },
        // Right wall (vertical)
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

        // Bottom border trees
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

        // Left border trees
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

        // Right border trees
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
        { type: "crate", x: 320, y: 380, rotation: 0 }, // Moved from dead center to lower-right area
        { type: "crate", x: 180, y: 300, rotation: π / 4 },
        { type: "crate", x: 350, y: 180, rotation: π / 6 },
        { type: "crate", x: 140, y: 160, rotation: π / 3 },
        { type: "crate", x: 400, y: 350, rotation: π / 2 },
    ],

    loot: [
        // Weapons
        { type: "pistol", x: 100, y: 100, count: 1 },
        { type: "rifle", x: 400, y: 400, count: 1 },
        { type: "shotgun", x: 256, y: 100, count: 1 },
        { type: "pistol", x: 150, y: 450, count: 1 },
        { type: "rifle", x: 450, y: 150, count: 1 },

        // Ammo - universal ammo (works with all guns)
        { type: "ammo_universal", x: 150, y: 150, count: 20 },
        { type: "ammo_universal", x: 350, y: 350, count: 20 },
        { type: "ammo_universal", x: 200, y: 400, count: 20 },
        { type: "ammo_universal", x: 100, y: 200, count: 20 },
        { type: "ammo_universal", x: 400, y: 100, count: 20 },
        { type: "ammo_universal", x: 250, y: 300, count: 20 },
        { type: "ammo_universal", x: 300, y: 200, count: 20 },
        { type: "ammo_universal", x: 450, y: 350, count: 20 },
        { type: "ammo_universal", x: 100, y: 300, count: 20 },
        { type: "ammo_universal", x: 200, y: 150, count: 20 },
        { type: "ammo_universal", x: 380, y: 420, count: 20 },
        { type: "ammo_universal", x: 150, y: 480, count: 20 },
        { type: "ammo_universal", x: 350, y: 150, count: 20 },
        { type: "ammo_universal", x: 200, y: 450, count: 20 },
        { type: "ammo_universal", x: 450, y: 250, count: 20 },
        { type: "ammo_universal", x: 80, y: 120, count: 20 },
        { type: "ammo_universal", x: 320, y: 480, count: 20 },
        { type: "ammo_universal", x: 480, y: 180, count: 20 },

        // XP Orbs scattered around the map
        { type: "xp_orb", x: 80, y: 80, count: 10 },
        { type: "xp_orb", x: 200, y: 100, count: 10 },
        { type: "xp_orb", x: 420, y: 120, count: 10 },
        { type: "xp_orb", x: 100, y: 220, count: 10 },
        { type: "xp_orb", x: 300, y: 250, count: 10 },
        { type: "xp_orb", x: 450, y: 280, count: 10 },
        { type: "xp_orb", x: 180, y: 350, count: 10 },
        { type: "xp_orb", x: 350, y: 380, count: 10 },
        { type: "xp_orb", x: 120, y: 450, count: 10 },
        { type: "xp_orb", x: 430, y: 470, count: 10 },
        { type: "xp_orb", x: 256, y: 356, count: 10 },
        { type: "xp_orb", x: 380, y: 220, count: 10 },
    ],

    playerSpawns: [
        // Center is at 256, 256
        // All spawns within 20 units of center (236-276 range)
        { x: 256, y: 256 },  // Dead center
        { x: 240, y: 256 },  // Left
        { x: 272, y: 256 },  // Right
        { x: 256, y: 240 },  // Top
        { x: 256, y: 272 },  // Bottom
        { x: 240, y: 240 },  // Top-left
        { x: 272, y: 240 },  // Top-right
        { x: 240, y: 272 },  // Bottom-left
        { x: 272, y: 272 },  // Bottom-right
        { x: 246, y: 256 },  // Mid-left
        { x: 266, y: 256 },  // Mid-right
        { x: 256, y: 246 },  // Mid-top
        { x: 256, y: 266 },  // Mid-bottom
    ]
};

// Zone 2: Forest Clearing (smaller zone at 600-856, 0-256)
// Positioned to the right of Zone 1, smaller area (256x256)
const ZONE_2_OFFSET_X = 600;
const ZONE_2_OFFSET_Y = 0;

const ZONE_2_DATA = {
    obstacles: [
        // Border walls for Zone 2 (256x256 area)
        // Top wall
        { type: "wall_horizontal", x: ZONE_2_OFFSET_X + 128, y: ZONE_2_OFFSET_Y + 4, rotation: 0, scale: 0.5 },
        // Bottom wall
        { type: "wall_horizontal", x: ZONE_2_OFFSET_X + 128, y: ZONE_2_OFFSET_Y + 252, rotation: 0, scale: 0.5 },
        // Left wall
        { type: "wall_vertical", x: ZONE_2_OFFSET_X + 4, y: ZONE_2_OFFSET_Y + 128, rotation: 0, scale: 0.5 },
        // Right wall
        { type: "wall_vertical", x: ZONE_2_OFFSET_X + 252, y: ZONE_2_OFFSET_Y + 128, rotation: 0, scale: 0.5 },

        // CENTER DIVIDING WALL (vertical, splits Zone 2 in half)
        // Top section of dividing wall (from top to gate)
        { type: "wall_vertical", x: ZONE_2_OFFSET_X + 128, y: ZONE_2_OFFSET_Y + 56, rotation: 0, scale: 0.21875 }, // 112 tall (256*0.21875)
        // Gate in the middle (interactive!)
        { type: "gate", x: ZONE_2_OFFSET_X + 128, y: ZONE_2_OFFSET_Y + 128, rotation: 0, scale: 1.0 }, // 32 tall
        // Bottom section of dividing wall (from gate to bottom)
        { type: "wall_vertical", x: ZONE_2_OFFSET_X + 128, y: ZONE_2_OFFSET_Y + 200, rotation: 0, scale: 0.21875 }, // 112 tall (256*0.21875)

        // 3 trees near perimeter
        { type: "tree", x: ZONE_2_OFFSET_X + 30, y: ZONE_2_OFFSET_Y + 30, rotation: 0, scale: 1.0 },   // Top-left corner
        { type: "tree", x: ZONE_2_OFFSET_X + 226, y: ZONE_2_OFFSET_Y + 30, rotation: 0, scale: 1.0 },  // Top-right corner
        { type: "tree", x: ZONE_2_OFFSET_X + 128, y: ZONE_2_OFFSET_Y + 226, rotation: 0, scale: 1.0 }, // Bottom-center

        // 5 rocks near perimeter (moved some away from center wall)
        { type: "rock", x: ZONE_2_OFFSET_X + 30, y: ZONE_2_OFFSET_Y + 128, rotation: 0, scale: 0.9 },  // Left-center
        { type: "rock", x: ZONE_2_OFFSET_X + 226, y: ZONE_2_OFFSET_Y + 128, rotation: 0, scale: 0.9 }, // Right-center
        { type: "rock", x: ZONE_2_OFFSET_X + 80, y: ZONE_2_OFFSET_Y + 30, rotation: 0, scale: 0.9 },  // Top-left
        { type: "rock", x: ZONE_2_OFFSET_X + 60, y: ZONE_2_OFFSET_Y + 226, rotation: 0, scale: 0.85 }, // Bottom-left
        { type: "rock", x: ZONE_2_OFFSET_X + 196, y: ZONE_2_OFFSET_Y + 226, rotation: 0, scale: 0.85 }, // Bottom-right
    ],

    loot: [
        // NO LOOT IN ZONE 2
    ],

    playerSpawns: [
        { x: ZONE_2_OFFSET_X + 128, y: ZONE_2_OFFSET_Y + 128 }, // Center
        { x: ZONE_2_OFFSET_X + 60, y: ZONE_2_OFFSET_Y + 60 },   // Top-left
        { x: ZONE_2_OFFSET_X + 196, y: ZONE_2_OFFSET_Y + 60 },  // Top-right
        { x: ZONE_2_OFFSET_X + 60, y: ZONE_2_OFFSET_Y + 196 },  // Bottom-left
        { x: ZONE_2_OFFSET_X + 196, y: ZONE_2_OFFSET_Y + 196 }, // Bottom-right
        { x: ZONE_2_OFFSET_X + 128, y: ZONE_2_OFFSET_Y + 60 },  // Top-center
        { x: ZONE_2_OFFSET_X + 128, y: ZONE_2_OFFSET_Y + 196 }, // Bottom-center
        { x: ZONE_2_OFFSET_X + 60, y: ZONE_2_OFFSET_Y + 128 },  // Left-center
        { x: ZONE_2_OFFSET_X + 196, y: ZONE_2_OFFSET_Y + 128 }, // Right-center
    ]
};

// Combined map data (both zones in same world)
export const MAP_DATA = {
    width: 856,  // Extended to fit both zones (512 + gap + 256 = 856)
    height: 512, // Keep max height

    obstacles: [
        ...ZONE_1_DATA.obstacles,
        ...ZONE_2_DATA.obstacles,
        // Dummy obstacle (workaround for last-obstacle hitbox bug)
        { type: "tree", x: -100, y: -100, rotation: 0 }
    ],

    loot: [
        ...ZONE_1_DATA.loot,
        ...ZONE_2_DATA.loot
    ],

    playerSpawns: [
        ...ZONE_1_DATA.playerSpawns,
        ...ZONE_2_DATA.playerSpawns
    ],

    // Zone metadata for spawn selection
    zones: {
        zone1: {
            name: "Main Arena",
            spawnRange: [0, ZONE_1_DATA.playerSpawns.length - 1]
        },
        zone2: {
            name: "Forest Clearing",
            spawnRange: [
                ZONE_1_DATA.playerSpawns.length,
                ZONE_1_DATA.playerSpawns.length + ZONE_2_DATA.playerSpawns.length - 1
            ]
        }
    }
};
