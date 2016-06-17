import Point from "Point"

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

    public sample(): Point {
        return new Point(
            this.x + Math.random() * this.width - this.width / 2,
            this.y + Math.random() * this.height - this.height / 2
        );
    }

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
