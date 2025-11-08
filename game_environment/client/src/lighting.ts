import * as PIXI from 'pixi.js';
import { Vec, type Vector } from "../../common/src/utils/vector";
import type { ObstacleData } from "../../common/src/packets";
import type { Camera } from "./camera";

interface LightingObstacle {
    position: Vector;
    vertices: Vector[]; // Polygon vertices in world coordinates
    type: 'circle' | 'rect';
}

export class LightingSystem {
    private container: PIXI.Container;
    private shadowGraphics: PIXI.Graphics;
    private obstacles: LightingObstacle[] = [];
    private sunDirection: Vector;
    private shadowLength: number = 150;
    private shadowAlpha: number = 0.5;

    constructor(stage: PIXI.Container) {
        this.container = new PIXI.Container();
        this.container.eventMode = 'none'; // Don't intercept events

        // Shadow graphics with multiply blending for realistic shadows
        this.shadowGraphics = new PIXI.Graphics();
        this.shadowGraphics.blendMode = 'multiply';
        this.shadowGraphics.eventMode = 'none';

        this.container.addChild(this.shadowGraphics);
        stage.addChild(this.container);

        // Sun coming from top-right (casts shadows down-left)
        this.sunDirection = Vec.normalize(Vec(-0.5, 0.8));
    }

    getContainer(): PIXI.Container {
        return this.container;
    }

    setSunDirection(direction: Vector): void {
        this.sunDirection = Vec.normalize(direction);
    }

    setShadowIntensity(alpha: number): void {
        this.shadowAlpha = Math.max(0, Math.min(1, alpha));
    }

    updateObstacles(obstacleData: ObstacleData[]): void {
        this.obstacles = [];

        for (const obs of obstacleData) {
            if (obs.destroyed) continue;

            const pos = Vec(obs.x, obs.y);
            let vertices: Vector[] = [];

            if (obs.type === 'tree' || obs.type === 'rock') {
                // Approximate circle as octagon for shadow casting
                const radius = obs.type === 'tree' ? 3.5 * obs.scale : 4 * obs.scale;
                const segments = 12;
                for (let i = 0; i < segments; i++) {
                    const angle = (i / segments) * Math.PI * 2;
                    vertices.push(Vec.add(pos, Vec.fromPolar(angle, radius)));
                }
                this.obstacles.push({ position: pos, vertices, type: 'circle' });
            } else if (obs.type === 'crate') {
                // Rectangle
                const halfSize = 3.5 * obs.scale;
                const corners = [
                    Vec(-halfSize, -halfSize),
                    Vec(halfSize, -halfSize),
                    Vec(halfSize, halfSize),
                    Vec(-halfSize, halfSize)
                ];
                // Rotate corners
                vertices = corners.map(c => {
                    const rotated = Vec.rotate(c, obs.rotation);
                    return Vec.add(pos, rotated);
                });
                this.obstacles.push({ position: pos, vertices, type: 'rect' });
            } else if (obs.type === 'wall_horizontal') {
                const halfWidth = 256 * obs.scale;
                const halfHeight = 4 * obs.scale;
                vertices = [
                    Vec.add(pos, Vec(-halfWidth, -halfHeight)),
                    Vec.add(pos, Vec(halfWidth, -halfHeight)),
                    Vec.add(pos, Vec(halfWidth, halfHeight)),
                    Vec.add(pos, Vec(-halfWidth, halfHeight))
                ];
                this.obstacles.push({ position: pos, vertices, type: 'rect' });
            } else if (obs.type === 'wall_vertical') {
                const halfWidth = 4 * obs.scale;
                const halfHeight = 256 * obs.scale;
                vertices = [
                    Vec.add(pos, Vec(-halfWidth, -halfHeight)),
                    Vec.add(pos, Vec(halfWidth, -halfHeight)),
                    Vec.add(pos, Vec(halfWidth, halfHeight)),
                    Vec.add(pos, Vec(-halfWidth, halfHeight))
                ];
                this.obstacles.push({ position: pos, vertices, type: 'rect' });
            }
        }
    }

    update(camera: Camera): void {
        this.render(camera);
    }

    private render(camera: Camera): void {
        this.shadowGraphics.clear();

        // Don't render if no obstacles yet
        if (this.obstacles.length === 0) return;

        // Render shadow for each obstacle
        for (const obstacle of this.obstacles) {
            this.renderShadow(obstacle, camera);
        }
    }

    private renderShadow(obstacle: LightingObstacle, camera: Camera): void {
        const vertices = obstacle.vertices;
        if (vertices.length < 3) return;

        // Find the edges that face away from the sun (silhouette edges)
        const silhouetteEdges: Array<[Vector, Vector]> = [];

        for (let i = 0; i < vertices.length; i++) {
            const v1 = vertices[i];
            const v2 = vertices[(i + 1) % vertices.length];

            // Edge vector
            const edge = Vec.sub(v2, v1);
            // Normal (perpendicular to edge)
            const normal = Vec.normalize(Vec(-edge.y, edge.x));

            // Check if this edge faces away from sun
            const dotProduct = Vec.dot(normal, this.sunDirection);

            if (dotProduct < 0) { // Edge faces away from sun
                silhouetteEdges.push([v1, v2]);
            }
        }

        // Cast shadows from silhouette edges
        for (const [v1, v2] of silhouetteEdges) {
            // Project vertices away from sun
            const shadow1 = Vec.add(v1, Vec.scale(this.sunDirection, this.shadowLength));
            const shadow2 = Vec.add(v2, Vec.scale(this.sunDirection, this.shadowLength));

            // Convert to screen coordinates
            const sv1 = camera.worldToScreen(v1);
            const sv2 = camera.worldToScreen(v2);
            const ss1 = camera.worldToScreen(shadow1);
            const ss2 = camera.worldToScreen(shadow2);

            // Draw shadow quad
            this.shadowGraphics.moveTo(sv1.x, sv1.y);
            this.shadowGraphics.lineTo(sv2.x, sv2.y);
            this.shadowGraphics.lineTo(ss2.x, ss2.y);
            this.shadowGraphics.lineTo(ss1.x, ss1.y);
            this.shadowGraphics.closePath();
            this.shadowGraphics.fill({ color: 0x000000, alpha: this.shadowAlpha });
        }

        // Also draw shadow cap (area behind obstacle)
        if (silhouetteEdges.length >= 2) {
            const firstEdge = silhouetteEdges[0];
            const lastEdge = silhouetteEdges[silhouetteEdges.length - 1];

            const p1 = firstEdge[0];
            const p2 = lastEdge[1];
            const sp1 = Vec.add(p1, Vec.scale(this.sunDirection, this.shadowLength));
            const sp2 = Vec.add(p2, Vec.scale(this.sunDirection, this.shadowLength));

            const scp1 = camera.worldToScreen(p1);
            const scp2 = camera.worldToScreen(p2);
            const scsp1 = camera.worldToScreen(sp1);
            const scsp2 = camera.worldToScreen(sp2);

            this.shadowGraphics.moveTo(scp1.x, scp1.y);
            this.shadowGraphics.lineTo(scp2.x, scp2.y);
            this.shadowGraphics.lineTo(scsp2.x, scsp2.y);
            this.shadowGraphics.lineTo(scsp1.x, scsp1.y);
            this.shadowGraphics.closePath();
            this.shadowGraphics.fill({ color: 0x000000, alpha: this.shadowAlpha * 0.7 });
        }
    }

    destroy(): void {
        this.container.destroy();
    }
}
