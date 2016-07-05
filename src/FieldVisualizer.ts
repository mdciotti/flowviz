/// <reference path="../node_modules/@types/dat-gui/index.d.ts" />

import { Field, MeshField, FieldOptions, FieldParameters } from "./Field.ts";
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
    private gui: dat.GUI;

    public viewOptions: FieldOptions = {
        features: true,
        mesh: true,
        seeds: true,
        bingrid: true,
        streamlines: true,
        boundaries: true
    };

    public parameters: FieldParameters = {
        d_sep: 0.02,
        d_test: 0.01,
        candidate_spacing: 0.04,
        step_size: 0.01,
        min_length: 0.1,
        seed_x: 0,
        seed_y: 0
    };

    constructor(f: Field) {
        this.field = f;
        this.field.updateParameters(this.parameters);
        this.el = document.createElement("div");
        this.el.classList.add("flowviz");
        this.canvas = document.createElement("canvas");
        this.canvas.width = 500;
        this.canvas.height = 500;
        this.el.appendChild(this.canvas);
        this.ctx = this.canvas.getContext("2d");
        this.gui = new dat.GUI({autoPlace: false});
        this.el.appendChild(this.gui.domElement);

        this.canvas.addEventListener("mousemove", this.onmousemove.bind(this));
        this.canvas.addEventListener("mousedown", this.onmousedown.bind(this));
        this.canvas.addEventListener("mouseup", this.onmouseup.bind(this));

        let toggles = this.gui.addFolder("Show/Hide");
        toggles.open();
        toggles.add(this.viewOptions, "features").onFinishChange(this.draw.bind(this));
        toggles.add(this.viewOptions, "mesh").onFinishChange(this.draw.bind(this));
        toggles.add(this.viewOptions, "seeds").onFinishChange(this.draw.bind(this));
        toggles.add(this.viewOptions, "bingrid").onFinishChange(this.draw.bind(this));
        toggles.add(this.viewOptions, "streamlines").onFinishChange(this.draw.bind(this));
        toggles.add(this.viewOptions, "boundaries").onFinishChange(this.draw.bind(this));
        let params = this.gui.addFolder("Parameters");
        params.open();
        let update = () => this.field.updateParameters(this.parameters);
        params.add(this.parameters, "d_sep", 0, 0.1).onFinishChange(update);
        params.add(this.parameters, "d_test", 0, 0.1).onFinishChange(update);
        params.add(this.parameters, "min_length", 0, 1).onFinishChange(update);
        params.add(this.parameters, "candidate_spacing", 0, 0.2).onFinishChange(update);
        // this.gui.add(this, "setViewBounds");
        // this.gui.add(this, "reset");
        this.step = this.stepn(1);
        this.step100 = this.stepn(100);
        this.gui.add(this, "step");
        this.gui.add(this, "step100").name("step x100");
        this.gui.add(this, "generateStreamlines").name("generate streamlines");
        this.gui.add(this, "clear").name("clear streamlines");
        this.gui.add(this, "draw");

        // this.$file = document.createElement("input");
        // this.$file.type = "file";
        // this.$file.multiple = true;
        // this.$file.addEventListener("onchange", this.stepn(1).bind(this));
        // this.el.appendChild(this.$file);

        // this.$file.addEventListener('change', this.onfileselect.bind(this), false);
        this.el.addEventListener('dragover', this.ondragover.bind(this), false);
        this.el.addEventListener('drop', this.ondrop.bind(this), false);

        document.body.appendChild(this.el);
    }

    public draw() {
        this.field.draw(this.ctx, this.viewOptions);
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
                this.field.updateParameters(this.parameters);
                this.draw();
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

    public onmousedown(ev: MouseEvent) {
        this.mousedown = true;
        this.mouseStartX = ev.pageX - this.canvas.offsetLeft;
        this.mouseStartY = ev.pageY - this.canvas.offsetTop;
    }

    public onmouseup(ev: MouseEvent) {
        this.mousedown = false;
        if (!this.mouseDragging && ev.button == 0) {
            let x = toWorldX(ev.pageX, this.canvas, this.field.bounds);
            let y = toWorldY(ev.pageY, this.canvas, this.field.bounds);
            x = mapRange(x, this.field.bounds.x - this.field.bounds.width / 2, this.field.bounds.width, -1, 2);
            y = mapRange(y, this.field.bounds.y - this.field.bounds.height / 2, this.field.bounds.height, -1, 2);

            // Create seed point
            // let p = new Point(x, y);
            // this.field.addSeed(p);
            this.parameters.seed_x = x;
            this.parameters.seed_y = y;
            this.field.updateParameters(this.parameters);
            this.draw()
            // let b = this.field.mesh.bingrid.getBinAt(p);
            // console.log(b, b.items.map((f)=>f.id));
            // console.log(this.field.mesh.getFaceAt(x, y).id);
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
        this.field.updateParameters(this.parameters);
        this.draw();
    }

    /**
     * Generate streamlines for the field.
     */
    public generateStreamlines() {
        this.field.generateStreamlines();
        this.draw();
    }

    /**
     * Clears the field while keeping the view unchanged.
     */
    public clear() {
        this.field.reset();
        this.draw();
    }

    /**
     * Clears the field and resets the view.
     */
    public reset() {
        this.clear();
        this.field.setBounds(new AABB(0, 0, 500, 500));
        this.draw();
    }

    /**
     * Returns a function which will call the field's step function n times.
     */
    public stepn(n: number) {
        return () => {
            for (let i = 0; i < n; i++) {
                this.field.step();
            }
            this.draw();
        }
    }
}
