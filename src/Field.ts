import AABB from "./AABB.ts";
import BinGrid from "./BinGrid.ts";
import { Streamline, Vertex } from "./Streamline.ts";
import Point from "./Point.ts";
import Vec2 from "./Vec2.ts";
import { lerp } from "./util.ts";
import FieldFeature from "./FieldFeature.ts";
import VectorMesh from "./VectorMesh.ts";
import { Integrator, Differentiable, RungeKutta4 } from "./Integrator.ts";

/**
 * Represents a collection of streamlines in a given vector field.
 */
export abstract class Field implements Differentiable {

    /** The viewport of the field */
    public bounds: AABB;

    /** Separating distance between samples */
    public d_sep: number;

    /** Minimum distance between streamline vertices and other streamlines */
    public d_test: number;

    /** Minimum arc length for a valid streamline */
    public minStreamlineLength: number;

    public minStepLength: number;

    /** Spacing between candidate seeds along streamline */
    public candidate_spacing: number;

    /** Threshold stamp-difference (for loop detection) */
    public sigma: number = 4;

    /** Threshold minimum distance to consider two points equivalent */
    public epsilon: number = 1E-20;

    /** Threshold angles */
    public alpha: number = 20 * Math.PI / 90; // 20 deg
    public beta: number = 10 * Math.PI / 90; // 10 deg

    public integrator: Integrator;

    public binGrid: BinGrid<Vertex>;
    public binGrid2: BinGrid<Vertex>;

    /** The collection of streamlines in this vector field */
    private streamlines: Array<Streamline>;

    private seedQueue: Array<Point>;

    /** The initial seeding point for the streamline computation */
    private initialSeed: Point;

    constructor(bounds: AABB) {
        this.setBounds(bounds);
        // this.generate_streamlines();
    }

    /**
     * Updates all parameters to values relative to view dimension.
     */
    public updateParameters(params: FieldParameters): void {
        let vdim = Math.min(this.bounds.width, this.bounds.height);
        this.d_sep = params.d_sep * vdim;
        this.d_test = params.d_test * vdim;
        this.candidate_spacing = params.candidate_spacing * vdim;
        this.minStepLength = 0.0001 * vdim;
        this.minStreamlineLength = params.min_length * vdim;
        this.integrator = new RungeKutta4(params.step_size * vdim, this);
    }

    /**
     * Set up all components that depend on the bounds.
     */
    public setBounds(bounds: AABB): void {
        this.bounds = bounds;
        this.binGrid = new BinGrid<Vertex>(this.bounds, 25);
        this.binGrid2 = new BinGrid<Vertex>(this.bounds, 25);
        this.reset();
    }

    public reset(): void {
        // Set up variables
        this.seedQueue = [];
        this.streamlines = [];
        this.binGrid.clear();
        this.binGrid2.clear();
    }

    public abstract vec_at(x: number, y: number, vector?: Vec2): Vec2;

    public addSeed(point: Point): void {
        this.seedQueue.push(point);
    }

    public step(): void {
        if (this.seedQueue.length === 0)
            return;

        // Remove (and select) the first seed from the queue
        let seed: Point = this.seedQueue.shift();
        if (!this.bounds.contains(seed))
            return;

        // Check separation distance against nearby points
        // (The seed point is too close to another vertex)
        if (this.binGrid.hasPointWithinRadius(seed, this.d_test))
            return;

        let streamline = new Streamline(seed, this);
        if (streamline.arcLength < this.minStreamlineLength)
            return;

        this.addStream(streamline);
        this.generateCandidates(streamline);
    }

    /**
     * Adds a streamline to this field and inserts its vertices into the bingrid
     * data structure for fast lookup.
     */
    public addStream(s: Streamline): void {
        this.streamlines.push(s);
        for (let v of s.vertices) {
            this.binGrid.insert(v);
        }
    }

    /**
     * Generate the streamlines
     * @param d_sep the minimum separation distance between adjacent streamlines
     */
    public generateStreamlines(): void {
        // While there is at least one seed in the queue
        while (this.seedQueue.length > 0) {
            this.step();
        }
    }

    public viewTransform(ctx: CanvasRenderingContext2D): void {
        ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);

        // Transform to bounds
        ctx.scale(ctx.canvas.width / this.bounds.width,
                  -ctx.canvas.height / this.bounds.height);
        ctx.translate(-this.bounds.x, -this.bounds.y);
        ctx.lineWidth = this.bounds.width / ctx.canvas.width;
        ctx.font = `${ctx.lineWidth * 12}px sans-serif`;
    }

    public draw(ctx: CanvasRenderingContext2D, opts: FieldOptions): void {
        if (opts.boundaries) {
            this.bounds.draw(ctx);
        }

        if (opts.seeds) {
            ctx.fillStyle = "#3333cc";
            let radius = 2.5 * this.bounds.width / ctx.canvas.width;
            for (let sc of this.seedQueue) {
                sc.draw(ctx, radius);
            }
        }

        if (opts.streamlines) {
            ctx.strokeStyle = "#000000";
            // ctx.lineWidth = 1.0;
            for (let i = 0; i < this.streamlines.length; i++) {
                this.streamlines[i].draw(ctx);
            }
        }
    }

    private generateCandidates(streamline: Streamline): void {
        let orthoVec = new Vec2(0, 0);
        let prevArcLength = 0;
        let t_len = 0;

        for (let i = 1; i < streamline.vertices.length; i++) {
            let lastVertex = streamline.vertices[i - 1];
            let vert = streamline.vertices[i];

            if (vert.partialArcLength - (prevArcLength + t_len) > this.candidate_spacing) {
                // Calculate percent along last segment
                let lastSegmentLength = vert.partialArcLength - lastVertex.partialArcLength;
                t_len = this.candidate_spacing - lastVertex.partialArcLength + prevArcLength + t_len;
                let t = t_len / lastSegmentLength;

                let x = lerp(lastVertex.x, vert.x, t);
                let y = lerp(lastVertex.y, vert.y, t);

                // Calculate orthogonal vector using rotated vector field
                orthoVec = this.vec_at(x, y, orthoVec);
                let temp = orthoVec.x;
                let k = this.d_sep / Vec2.magnitude(orthoVec);
                orthoVec.x = -orthoVec.y * k;
                orthoVec.y = temp * k;

                let s1: Point = new Point(x + orthoVec.x, y + orthoVec.y);
                let s2: Point = new Point(x - orthoVec.x, y - orthoVec.y);

                this.seedQueue.push(s1, s2);

                prevArcLength = lastVertex.partialArcLength;
            }
        }
    }
}


export class FeatureField extends Field implements Differentiable {

    private features: Array<FieldFeature>;

    constructor(bounds: AABB) {
        super(bounds);
        this.features = [];
    }

    public addFeatures(...features: FieldFeature[]) {
        for (let f of features) {
            this.features.push(f);
        }
    }

    /**
     * Computes the field vector at the given point.
     * @param point the point at which to compute the field vector
     * @param vector an optional Vec2 instance to reuse
     * @return the computed vector
     */
    public vec_at(x: number, y: number, vector?: Vec2): Vec2 {
        if (!vector) vector = new Vec2(0, 0);
        Vec2.zero(vector);
        this.features.forEach((f) => {
            Vec2.add(vector, vector, f.getVelocity(x, y));
        });
        return vector;
    }

    public draw(ctx: CanvasRenderingContext2D, opts: FieldOptions) {
        ctx.save();
        this.viewTransform(ctx);
        // Background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(this.bounds.x - this.bounds.width / 2,
                     this.bounds.y - this.bounds.height / 2,
                     this.bounds.width,
                     this.bounds.height);
        if (opts.bingrid) {
            ctx.strokeStyle = "#cccccc";
            this.binGrid.draw(ctx);
        }
        super.draw(ctx, opts);
        ctx.restore();
    }
}

export class MeshField extends Field implements Differentiable {
    private mesh: VectorMesh;

    constructor(bounds: AABB, mesh: VectorMesh) {
        super(bounds);
        this.mesh = mesh;
        // this.mesh.loadASCII("data/test.ply");
    }

    public vec_at(x: number, y: number, vector?: Vec2): Vec2 {
        if (!vector) vector = new Vec2(0, 0);
        let face = this.mesh.getFaceAt(x, y);
        if (face === null) {
            vector.x = 0;
            vector.y = 0;
        } else {
            face.interpolate(vector, new Vec2(x, y));
        }
        return vector;
    }

    public draw(ctx: CanvasRenderingContext2D, opts: FieldOptions) {
        ctx.save();
        this.viewTransform(ctx);
        // Background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(this.bounds.x - this.bounds.width / 2,
                     this.bounds.y - this.bounds.height / 2,
                     this.bounds.width,
                     this.bounds.height);

        if (opts.bingrid) {
            ctx.strokeStyle = "#cccccc";
            // this.binGrid.draw(ctx);
            this.mesh.bingrid.draw(ctx, true);
        }
        if (opts.mesh) this.mesh.draw(ctx);
        super.draw(ctx, opts);
        ctx.restore();
    }
}

export interface FieldParameters {
    d_sep: number;
    d_test: number;
    candidate_spacing: number;
    step_size: number;
    min_length: number;
    // alpha: number;
    // beta: number;
    // sigma: number;
};

export interface FieldOptions {
    features: boolean;
    mesh: boolean;
    seeds: boolean;
    bingrid: boolean;
    streamlines: boolean;
    boundaries: boolean;
}
