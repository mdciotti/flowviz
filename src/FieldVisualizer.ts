import { Field } from "./Field"
import Point from "./Point"
import { mapRange } from "./util"
import AABB from "./AABB"

function toWorldX(x, canvas, bounds) {
    return mapRange(x, canvas.offsetLeft, canvas.width, bounds.x - bounds.width / 2, bounds.width);
}

function toWorldY(y, canvas, bounds) {
    return mapRange(canvas.height - y, -canvas.offsetTop, canvas.height, bounds.y - bounds.height / 2, bounds.height);
}

export default class FieldVisualizer {
    public field: Field;
    public canvas: HTMLCanvasElement;
    public ctx: CanvasRenderingContext2D;
    private mousedown = false;
    private mouseDragging = false;
    private mouseStartX = 0;
    private mouseStartY = 0;
    private mouseEndX = 0;
    private mouseEndY = 0;
    private mouseDx = 0;
    private mouseDy = 0;

    constructor(f: Field) {
        this.field = f;
        this.canvas = document.createElement("canvas");
        this.canvas.width = 500;
        this.canvas.height = 500;
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext("2d");
        this.field.draw(this.ctx);

        this.canvas.addEventListener("mousemove", this.onmousemove.bind(this));
        this.canvas.addEventListener("mousedown", this.onmousedown.bind(this));
        this.canvas.addEventListener("mouseup", this.onmouseup.bind(this));
    }

    public onmousemove(ev) {
        this.mouseDx = ev.movementX;
        this.mouseDy = ev.movementY;
        // if (this.mousedown) {
        //     this.mouseDragging = true;
        //     this.mouseEndX = ev.pageX - this.canvas.offsetLeft;
        //     this.mouseEndY = ev.pageY - this.canvas.offsetTop;
        //     // this.field.draw(this.ctx);
        //     this.ctx.strokeRect(this.mouseStartX, this.mouseStartY,
        //         this.mouseEndX - this.mouseStartX, this.mouseEndY - this.mouseStartY);
        // } else {
        //     this.mouseDragging = false;
        // }
    }

    public onmousedown(ev) {
        this.mousedown = true;
        this.mouseStartX = ev.pageX - this.canvas.offsetLeft;
        this.mouseStartY = ev.pageY - this.canvas.offsetTop;
    }

    public onmouseup(ev) {
        this.mousedown = false;
        if (!this.mouseDragging) {
            let x = toWorldX(ev.pageX, this.canvas, this.field.bounds);
            let y = toWorldY(ev.pageY, this.canvas, this.field.bounds);

            // Create seed point
            this.field.addSeed(new Point(x, y));
            this.field.draw(this.ctx);
        }

        this.mouseDragging = false;
        this.mouseEndX = ev.pageX - this.canvas.offsetLeft;
        this.mouseEndY = ev.pageY - this.canvas.offsetTop;
    }

    /**
     * Update the view bounds from the mouse selection.
     */
    public setViewBounds() {
        let w = Math.abs(this.mouseEndX - this.mouseStartX);
        let h = Math.abs(this.mouseEndY - this.mouseStartY);
        let cx = this.mouseStartX - w / 2;
        let cy = this.mouseStartY - h / 2;
        this.field.setBounds(new AABB(cx, cy, w, h));
        this.field.draw(this.ctx);
    }

    /**
     * Generate streamlines for the field.
     */
    public generateStreamlines() {
        this.field.generateStreamlines();
        this.field.draw(this.ctx);
    }

    /**
     * Clears the field while keeping the view unchanged.
     */
    public clear() {
        this.field.reset();
        this.field.draw(this.ctx);
    }

    /**
     * Clears the field and resets the view.
     */
    public reset() {
        this.clear();
        this.field.setBounds(new AABB(0, 0, 500, 500));
        this.field.draw(this.ctx);
    }

    /**
     * Returns a function which will call the field's step function n times.
     */
    public stepn(n: number) {
        return () => {
            for (let i = 0; i < n; i++) {
                this.field.step();
            }
            this.field.draw(this.ctx);
        }
    }
}
