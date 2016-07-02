import Point from "./Point.ts";
import Vec2 from "./Vec2.ts";
import { Field } from "./Field.ts";

enum Direction {
    FORWARD = 1,
    BACKWARD = -1
}

/**
 * Represends a single vertex within a streamline.
 */
export class Vertex extends Point {

    public static fromPoint(point: Point, streamline: Streamline): Vertex {
        return new Vertex(point.x, point.y, streamline);
    }

    public id: number;
    public partialArcLength: number;
    public v: Vec2;

    constructor(x: number, y: number, public streamline: Streamline) {
        super(x, y);
        this.v = new Vec2(0, 0);
    }
}

/**
 * Represents a streamline as a collection of connected vertices.
 */
export class Streamline {
    public arcLength: number = 0;
    public vertices: Array<Vertex> = [];
    private seed: Vertex;
    private field: Field;

    /**
     * Creates a streamline through the specified point.
     * @param p0 the starting point for this streamline
     */
    constructor(seed: Point, field?: Field) {
        this.seed = <Vertex>seed;
        this.seed.streamline = this;

        if (field instanceof Field) {
            this.field = field;
            this.field.binGrid2.clear();
            this.compute();
        }
    }

    /**
     * Computes the path (forward and reverse) of a streamline given by a point
     */
    public compute(): void {
        // Forward computation
        let fv: Array<Vertex> = [];
        let fLen = this.computeLine(Direction.FORWARD, fv);

        // Reverse computation
        let bv: Array<Vertex> = [];
        let bLen = this.computeLine(Direction.BACKWARD, bv);

        // Combine backward and forward vertices to form polyline
        this.arcLength = bLen + fLen;
        for (let i = bv.length - 1; i >= 0; i--) {
            let v = bv[i];
            v.partialArcLength = bLen - v.partialArcLength;
            this.vertices.push(v);
        }
        for (let i = 0; i < fv.length; i++) {
            let v = fv[i];
            v.partialArcLength += bLen;
            this.vertices.push(v);
        }
    }

    /**
     * Draws this streamline as a path on an HTML5 canvas context.
     * @param the HTML5 canvas 2D context
     */
    public draw(ctx: CanvasRenderingContext2D): void {
        // Draw seed
        // ctx.moveTo(this.seed.x, this.seed.y);

        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        for (let i = 1; i < this.vertices.length; i++) {
            let v = this.vertices[i];
            ctx.lineTo(v.x, v.y);
        }
        ctx.stroke();
    }

    private computeLine(dir: Direction, vertices: Vertex[]): number {
        // Limit maximum iterations to prevent infinite loops
        // This number may need to be adjusted as it will naively truncate long
        // streamlines
        const MAX_ITER: number = 1000;
        let partialArcLength = 0;
        let p1: Vertex = this.seed; // last vertex
        let p0: Vertex = null; // current vertex

        for (let i = 0; i < MAX_ITER; i++) {
            if (dir === Direction.FORWARD) {
                p0 = Vertex.fromPoint(this.field.integrator.step(p1.x, p1.y), this);
            } else {
                p0 = Vertex.fromPoint(this.field.integrator.stepReverse(p1.x, p1.y), this);
            }

            // Vec2.subtract(p0.v, p0, p1);
            this.field.vec_at(p0.x, p0.y, p1.v);

            let len = Math.hypot(p0.x - p1.x, p0.y - p1.y);
            if (len < this.field.minStepLength) {
                break;
            }
            partialArcLength += len;

            if (this.vertexIsValid(p0, p1, dir)) {
                p1.streamline = this;
                p1.partialArcLength = partialArcLength;
                vertices.push(p0);
                this.field.binGrid2.insert(p0);
            } else {
                break;
            }
            p1 = p0;
        }
        return partialArcLength;
    }

    private vertexIsValid(p0: Point, p1: Vertex, dir: Direction): boolean {
        let inBounds = this.field.bounds.contains(p0);
        if (!inBounds) return false;
        let emptyRadius = !this.field.binGrid.hasVertexWithinRadius(p0, this.field.d_test, this);
        if (!emptyRadius) return false;
        if (p1) {
            let looping = LoopDetection(this.field, p1, <Vertex>p0, dir);
            if (looping) return false;
        }

        return true;
    }
}

/**
 * Returns true if a loop (or tight spiral) is detected.
 * @param cp the closing point (passed out)
 * @param p1 the previous vertex
 * @param p0 the current vertex
 */
function LoopDetection(field: Field, p1: Vertex, p0: Vertex, a: Direction): boolean {
    let v1 = new Vec2(0, 0);
    let u0 = new Vec2(0, 0);
    let u1 = new Vec2(0, 0);
    const bin = field.binGrid2.getBinAt(p1);
    const cosAlpha = Math.cos(field.alpha);
    const cosBeta = Math.cos(field.beta);

    for (let cell of bin.neighbors) {
        if (cell.points.length === 0) continue;
        if (Math.abs(cell.range[(a + 1) / 2] - p0.id) < field.sigma) continue;

        for (let qp of cell.points) {
            let q = <Vertex>qp;
            if (Math.abs(q.id - p0.id) < field.sigma) continue;
            if (Vec2.distance(q, p0) >= field.d_test) continue;
            if (Vec2.distance(q, p0) <= field.epsilon) {
                // cp = q;
                return true; // closed
            }

            Vec2.subtract(v1, p0, p1);
            Vec2.scale(v1, v1, a);

            if (Vec2.dotn(q.v, v1) < cosAlpha) continue;

            Vec2.subtract(u0, p0, q);
            Vec2.scale(u0, u0, a);
            Vec2.subtract(u1, p1, q);
            Vec2.scale(u1, u1, a);

            if (Vec2.dot(u0, v1) >= 0 && Vec2.dot(u1, v1) >= 0) continue;
            if (Math.abs(Vec2.dotn(u0, p0.v)) > cosBeta) {
                // cp = q;
                return true; // closed
            }
            return true; // spiraling
        }
    }
    // bin.range[(a+1)/2] = p0.id;
    // add p0 to cc.sampleList;
    return false;
}
