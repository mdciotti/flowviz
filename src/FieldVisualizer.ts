import { Field, MeshField } from "./Field.ts";
import Point from "./Point.ts";
import { mapRange } from "./util.ts";
import AABB from "./AABB.ts";
import VectorMesh from "./VectorMesh.ts";

function toWorldX(x, canvas, bounds) {
    return mapRange(x, canvas.offsetLeft, canvas.width, bounds.x - bounds.width / 2, bounds.width);
}

function toWorldY(y, canvas, bounds) {
    return mapRange(canvas.height - y, -canvas.offsetTop, canvas.height, bounds.y - bounds.height / 2, bounds.height);
}

export default class FieldVisualizer {
    public field: Field;
    public canvas: HTMLCanvasElement;
    public el: HTMLDivElement;
    private $file: HTMLInputElement;
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
        this.el = document.createElement("div");
        this.el.classList.add("flowviz");
        this.canvas = document.createElement("canvas");
        this.canvas.width = 500;
        this.canvas.height = 500;
        this.el.appendChild(this.canvas);
        this.ctx = this.canvas.getContext("2d");
        this.field.draw(this.ctx);

        this.canvas.addEventListener("mousemove", this.onmousemove.bind(this));
        this.canvas.addEventListener("mousedown", this.onmousedown.bind(this));
        this.canvas.addEventListener("mouseup", this.onmouseup.bind(this));

        // Create controls
        let $viewBtn = document.createElement("button");
        $viewBtn.innerHTML = "view";
        $viewBtn.addEventListener("click", this.setViewBounds.bind(this));
        this.el.appendChild($viewBtn);

        let $generateBtn = document.createElement("button");
        $generateBtn.innerHTML = "generate";
        $generateBtn.addEventListener("click", this.generateStreamlines.bind(this));
        this.el.appendChild($generateBtn);
        
        let $clearBtn = document.createElement("button");
        $clearBtn.innerHTML = "clear";
        $clearBtn.addEventListener("click", this.clear.bind(this));
        this.el.appendChild($clearBtn);

        let $resetBtn = document.createElement("button");
        $resetBtn.innerHTML = "reset";
        $resetBtn.addEventListener("click", this.reset.bind(this));
        this.el.appendChild($resetBtn);

        let $step100Btn = document.createElement("button");
        $step100Btn.innerHTML = "step 100";
        $step100Btn.addEventListener("click", this.stepn(100).bind(this));
        this.el.appendChild($step100Btn);

        let $stepBtn = document.createElement("button");
        $stepBtn.innerHTML = "step";
        $stepBtn.addEventListener("click", this.stepn(1).bind(this));
        this.el.appendChild($stepBtn);

        this.$file = document.createElement("input");
        this.$file.type = "file";
        this.$file.multiple = true;
        this.$file.addEventListener("onchange", this.stepn(1).bind(this));
        this.el.appendChild(this.$file);

        this.$file.addEventListener('change', this.onfileselect.bind(this), false);
        this.el.addEventListener('dragover', this.ondragover.bind(this), false);
        this.el.addEventListener('drop', this.ondrop.bind(this), false);

        document.body.appendChild(this.el);
    }

    public ondragover(ev) {
        ev.stopPropagation();
        ev.preventDefault();
        // Explicitly show this is a copy.
        ev.dataTransfer.dropEffect = 'copy';
        this.el.classList.add('dragover');
    }

    public onfileselect(ev: Event) {
        ev.stopPropagation();
        ev.preventDefault();

        let files = this.$file.files;

        for (let i = 0, f; f = files[i]; i++) {
            this.loadFile(f);
        }
    }

    public ondrop(ev: DragEvent) {
        this.el.classList.remove('dragover');

        ev.stopPropagation();
        ev.preventDefault();

        let files = ev.dataTransfer.files;

        for (let i = 0, f; f = files[i]; i++) {
            this.loadFile(f);
        }
    }

    public loadFile(file: File) {
        // console.log(f.type);
        // Only process PLY files.
        // if (!f.type.match('image.*')) {
        //     continue;
        // }
        // console.log('loading file', file);
        let reader = new FileReader();
        reader.onload = ((f) => {
            return (e) => {
                let vm = new VectorMesh(e.target.result);
                this.field = new MeshField(new AABB(0.5, 0.5, 1, 1), vm);
                this.field.draw(this.ctx);
            };
        })(file);
        reader.readAsArrayBuffer(file);
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
            let p = new Point(x, y);
            this.field.addSeed(p);
            this.field.draw(this.ctx);
            let b = this.field.mesh.bingrid.getBinAt(p);
            console.log(b, b.items.map((f)=>f.id));
            console.log(this.field.mesh.getFaceAt(x, y).id);
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
