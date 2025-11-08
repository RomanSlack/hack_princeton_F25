/**
 * An interface to represent a 2D vector. The x and y values are coordinates in a 2D space
 */
export interface Vector {
    x: number
    y: number
}

/**
 * Creates a new `Vector`
 * @param x The horizontal (x-axis) coordinate
 * @param y The vertical (y-axis) coordinate
 * @returns A new `Vector` object with the provided x and y coordinates
 */
const create = (x: number, y: number): Vector => ({ x, y });

// This approach allows Vec to behave as both an object and a function
export const Vec = Object.assign(create, {
    /**
     * Adds two `Vector`s together
     */
    add(a: Vector, b: Vector): Vector {
        return create(a.x + b.x, a.y + b.y);
    },
    /**
     * Subtracts one `Vector` from another
     */
    sub(a: Vector, b: Vector): Vector {
        return create(a.x - b.x, a.y - b.y);
    },
    /**
     * Multiplies a `Vector` by a scalar
     */
    scale(a: Vector, n: number): Vector {
        return create(a.x * n, a.y * n);
    },
    /**
     * Clones a `Vector`
     */
    clone(vector: Vector): Vector {
        return create(vector.x, vector.y);
    },
    /**
     * Rotates a `Vector` by a given angle
     */
    rotate(vector: Vector, angle: number): Vector {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return create(vector.x * cos - vector.y * sin, vector.x * sin + vector.y * cos);
    },
    /**
     * Returns the squared length of a `Vector`
     */
    squaredLen(a: Vector): number {
        return a.x * a.x + a.y * a.y;
    },
    /**
     * Returns the length of a `Vector`
     */
    len(a: Vector): number {
        return Math.sqrt(Vec.squaredLen(a));
    },
    /**
     * Returns the direction of a given vector in radians
     */
    direction(a: Vector): number {
        return Math.atan2(a.y, a.x);
    },
    /**
     * Creates a new `Vector` parallel to the original, but whose length is 1
     */
    normalize(a: Vector): Vector {
        const eps = 0.000001;
        const len = Vec.len(a);
        return len > eps
            ? {
                x: a.x / len,
                y: a.y / len
            }
            : Vec.clone(a);
    },
    /**
     * Interpolate between two `Vector`s
     */
    lerp(start: Vector, end: Vector, interpFactor: number): Vector {
        return Vec.add(Vec.scale(start, 1 - interpFactor), Vec.scale(end, interpFactor));
    },
    /**
     * Takes a polar representation of a vector and converts it into a cartesian one
     */
    fromPolar(angle: number, magnitude = 1): Vector {
        return {
            x: Math.cos(angle) * magnitude,
            y: Math.sin(angle) * magnitude
        };
    },
    /**
     * Distance between two vectors
     */
    distance(a: Vector, b: Vector): number {
        return Vec.len(Vec.sub(a, b));
    },
    /**
     * Distance squared between two vectors
     */
    distanceSquared(a: Vector, b: Vector): number {
        return Vec.squaredLen(Vec.sub(a, b));
    },
    /**
     * Dot product of two vectors
     */
    dot(a: Vector, b: Vector): number {
        return a.x * b.x + a.y * b.y;
    }
});
