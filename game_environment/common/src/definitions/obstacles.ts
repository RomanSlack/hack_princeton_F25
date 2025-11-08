export interface ObstacleDefinition {
    idString: string;
    name: string;
    health: number;
    scale: number;
    hitbox: {
        type: 'circle' | 'rect';
        radius?: number;
        width?: number;
        height?: number;
    };
    indestructible?: boolean;
}

export const Obstacles: Record<string, ObstacleDefinition> = {
    tree: {
        idString: "tree",
        name: "Tree",
        health: 100,
        scale: 1.0,
        hitbox: {
            type: 'circle',
            radius: 3.5
        }
    },
    rock: {
        idString: "rock",
        name: "Rock",
        health: 200,
        scale: 1.0,
        hitbox: {
            type: 'circle',
            radius: 4
        }
    },
    crate: {
        idString: "crate",
        name: "Crate",
        health: 80,
        scale: 1.0,
        hitbox: {
            type: 'rect',
            width: 7,
            height: 7
        }
    },
    wall_horizontal: {
        idString: "wall_horizontal",
        name: "Horizontal Wall",
        health: 1000,
        scale: 1.0,
        hitbox: {
            type: 'rect',
            width: 512,   // Spans full map width
            height: 8     // Thicker for visibility and proper collision
        },
        indestructible: true
    },
    wall_vertical: {
        idString: "wall_vertical",
        name: "Vertical Wall",
        health: 1000,
        scale: 1.0,
        hitbox: {
            type: 'rect',
            width: 8,     // Thicker for visibility and proper collision
            height: 512   // Spans full map height
        },
        indestructible: true
    },
    gate: {
        idString: "gate",
        name: "Gate",
        health: 500,
        scale: 1.0,
        hitbox: {
            type: 'rect',
            width: 8,     // Same width as wall for seamless connection
            height: 32    // Gate height (can fit players through when open)
        },
        indestructible: true
    }
};
