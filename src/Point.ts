import Vec2 from "./Vec2.ts";

export default class Point extends Vec2 {
    constructor(public x: number, public y: number) {
        super(x, y);
    }

    public draw(ctx: CanvasRenderingContext2D, radius: number): void {
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, 2 * Math.PI);
        ctx.fill();
    }
}
