import Point from "./Point";

/**
 * An axis-aligned bounding box centered at (x, y).
 */
export default class AABB {
    public x: number;
    public y: number;
    public width: number;
    public height: number;

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    get left(): number {
        return this.x - this.width / 2;
    }

    get right(): number {
        return this.x + this.width / 2;
    }

    get top(): number {
        return this.y + this.height / 2;
    }

    get bottom(): number {
        return this.y - this.height / 2;
    }

    /**
     * Returns a point sampled uniformly within this region.
     */
    public sample(): Point {
        return new Point(
            this.x + Math.random() * this.width - this.width / 2,
            this.y + Math.random() * this.height - this.height / 2
        );
    }

    /**
     * Checks if a point is contained by this region.
     */
    public contains(point: Point): boolean {
        return Math.abs(point.x - this.x) <= this.width / 2 &&
            Math.abs(point.y - this.y) <= this.height / 2;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.strokeRect(this.x - this.width / 2,
                       this.y - this.height / 2,
                       this.width,
                       this.height);
    }
}
