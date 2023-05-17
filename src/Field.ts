import AABB from "./AABB";
import BinGrid from "./BinGrid";
import { Streamline, Vertex, Pathline } from "./Streamline";
import Point from "./Point";
import Vec2 from "./Vec2";
import { lerp, mapRange } from "./util";
import { FieldFeature } from "./FieldFeature";
import VectorMesh from "./VectorMesh";
import { Integrator, Differentiable, RungeKutta4 } from "./Integrator";

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

    /** Unsteady visualization parameters */
    public t_span: number = 10;
    public t_end: number = 0.1;

    /** Toggles for advection */
    public check_bounds: boolean = true;
    public check_sep: boolean = true;
    public check_loops: boolean = true;

    /** Toggle for line tapering */
    public tapering: boolean = true;

    /** Toggle for seed candidate placement */
    public enable_candidate_placement;

    public integrator: Integrator;

    public binGrid: BinGrid<Vertex>;
    public binGrid2: BinGrid<Vertex>;

    /** The collection of streamlines in this vector field */
    private streamlines: Array<Streamline>;
    private pathlines: Array<Pathline>;

    private seedQueue: Array<Point>;

    /** The initial seeding point for the streamline computation */
    public initialSeed: Point;

    constructor(bounds: AABB) {
        this.initialSeed = new Point(0, 0);
        this.setBounds(bounds);
        this.streamlines = [];
        this.pathlines = [];
    }

    /**
     * Updates all parameters to values relative to view dimension.
     */
    public updateParameters(params: FieldParameters): void {
        let vdim = Math.min(this.bounds.width, this.bounds.height);
        this.d_sep = params.d_sep * vdim;
        this.d_test = params.d_test * vdim;
        this.t_end = params.t_end;
        this.t_span = params.t_span;
        this.candidate_spacing = params.candidate_spacing * vdim;
        this.minStepLength = 0.0001 * vdim;
        this.minStreamlineLength = params.min_length * vdim;
        this.integrator = new RungeKutta4(params.step_size * vdim, this);
        this.check_bounds = params.check_bounds;
        this.check_sep = params.check_sep;
        this.check_loops = params.check_loops;
        this.tapering = params.tapering;
        this.enable_candidate_placement = params.candidate_placement;

        this.initialSeed.x = mapRange(params.seed_x, -1, 2, this.bounds.x - this.bounds.width / 2, this.bounds.width);
        this.initialSeed.y = mapRange(params.seed_y, -1, 2, this.bounds.y - this.bounds.height / 2, this.bounds.height);
        if (this.seedQueue.length === 0) this.seedQueue.push(this.initialSeed);
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
        this.seedQueue = [this.initialSeed];
        this.streamlines = [];
        this.pathlines = [];
        this.binGrid.clear();
        this.binGrid2.clear();
    }

    public abstract vec_at(x: number, y: number, t: number, vector?: Vec2): Vec2;

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
        if (this.enable_candidate_placement)
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
        console.log(this.streamlines);
    }

    /**
     * Generate the pathlines
     */
    public generatePathlines(): void {
        // TODO: split into nxn samples and forward integrate for each timestep
        let n = 10;
        let t_step = 1;
        let t_end = 10;
        for (let t = 0; t < t_end; t += t_step) {
            for (let j = 0; j < n; j++) {
                let y = this.bounds.top - j * this.bounds.height / n;
                for (let i = 0; i < n; i++) {
                    let x = this.bounds.left + i * this.bounds.width / n;
                    // console.log(x, y);
                    this.pathlines.push(new Pathline(new Point(x, y), t, this));
                }
            }
        }
        console.log(this.pathlines);
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
            // if (this.initialSeed) this.initialSeed.draw(ctx, radius);
            for (let sc of this.seedQueue) {
                sc.draw(ctx, radius);
            }
        }

        if (opts.streamlines) {
            ctx.strokeStyle = "#000000";
            // ctx.lineWidth = 1.0;
            ctx.save();
            for (let s of this.streamlines) {
                s.draw(ctx);
            }
            console.log(this.pathlines);
            for (let p of this.pathlines) {
                // console.log("Drawing pathline", p);
                p.draw(ctx);
            }
            ctx.restore();
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
                orthoVec = this.vec_at(x, y, 0, orthoVec);
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

    public abstract export(): string;
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
    public vec_at(x: number, y: number, t: number, vector?: Vec2): Vec2 {
        if (!vector) vector = new Vec2(0, 0);
        Vec2.zero(vector);
        this.features.forEach((f) => {
            Vec2.add(vector, vector, f.getVelocity(x, y, t));
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
        if (opts.features) {
            ctx.fillStyle = "#cc3333";
            for (let f of this.features) {
                let p = new Point(f.x, f.y);
                p.draw(ctx, 5);
            }
        }
        super.draw(ctx, opts);
        ctx.restore();
    }

    public discretize(subdivisions: number): MeshField {
        let mesh = VectorMesh.create(this.bounds, subdivisions, this.vec_at.bind(this));
        console.log(mesh);
        return new MeshField(this.bounds, mesh);
    }

    public export(): string {
        return "not yet implemented";
    }
}

export class MeshField extends Field implements Differentiable {
    private mesh: VectorMesh;

    constructor(bounds: AABB, mesh: VectorMesh) {
        super(bounds);
        this.mesh = mesh;
        // this.mesh.loadASCII("data/test.ply");
    }

    public vec_at(x: number, y: number, t: number, vector?: Vec2): Vec2 {
        if (!vector) vector = new Vec2(0, 0);
        let face = this.mesh.getFaceAt(x, y);
        if (face === null) {
            vector.x = 0;
            vector.y = 0;
        } else {
            // TODO: choose face data from nearest frames and interpolate
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

    public export(): string {
        return VectorMesh.serialize(this.mesh);
    }
}

export interface FieldParameters {
    d_sep: number;
    d_test: number;
    candidate_spacing: number;
    resolution: number;
    step_size: number;
    min_length: number;
    seed_x: number;
    seed_y: number;
    t_end: number;
    t_span: number;
    check_bounds: boolean;
    check_sep: boolean;
    check_loops: boolean;
    tapering: boolean;
    candidate_placement: boolean;
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
