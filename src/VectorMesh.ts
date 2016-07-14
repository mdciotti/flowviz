/// <reference path="../typings/node.d.ts" />
/// <reference path="../typings/parse-ply.d.ts" />
/// <reference path="../typings/through.d.ts" />

import AABB from "./AABB.ts";
import Point from "./Point.ts";
import Vec2 from "./Vec2.ts";
import NDArray from "./NDArray.ts";
import BinGrid from "./BinGrid.ts";
import { clamp, mapRange } from "./util.ts";
import PLYParser from "parse-ply";
import through from "through";

class Vertex extends Vec2 {
    public id: number;
    public x: number;
    public y: number;
    public vx: number;
    public vy: number;
    public faces: Face[];

    constructor(id: number, x: number, y: number, vx: number, vy: number) {
        super(x, y);
        this.id = id;
        this.vx = vx;
        this.vy = vy;
        this.faces = [];
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = "#cc3333"
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        // ctx.lineTo(this.x + this.vx / 25, this.y + this.vy / 25);
        ctx.lineTo(this.x + this.vx * 10, this.y + this.vy * 10);
        ctx.stroke();
        // let caption = this.id.toString();
        // ctx.fillText(caption, this.x, this.y);
    }
}

function det(a11: number, a12: number, a13: number, a21: number, a22: number, a23: number): number {
    return (a11 * a22) - (a11 * a23) - (a12 * a21) + (a12 * a23) + (a13 * a21) - (a13 * a22);
}

function detp(v1: Vec2, v2: Vec2, v3: Vec2): number {
    return det(v1.x, v2.x, v3.x, v1.y, v2.y, v3.y);
}

class Face {
    public id: number;
    public A: Vertex;
    public B: Vertex;
    public C: Vertex;
    public BCN: Face;
    public ACN: Face;
    public ABN: Face;
    public centroid: Point;
    private determinant: number;
    public _bin_id: number;

    constructor(id: number, A: Vertex, B: Vertex, C: Vertex) {
        this.id = id;
        this.A = A;
        this.B = B;
        this.C = C;
        this.centroid = new Point(0, 0);
        this.centroid.x = (this.A.x + this.B.x + this.C.x) / 3;
        this.centroid.y = (this.A.y + this.B.y + this.C.y) / 3;
        this.determinant = detp(this.A, this.B, this.C);
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = "#888888"
        ctx.beginPath();
        ctx.moveTo(this.A.x, this.A.y);
        ctx.lineTo(this.B.x, this.B.y);
        ctx.lineTo(this.C.x, this.C.y);
        ctx.closePath();
        ctx.stroke();

        // this.centroid.draw(ctx, 3);
        
        this.A.draw(ctx);
        this.B.draw(ctx);
        this.C.draw(ctx);

        // ctx.fillText(`${this.id}`, this.centroid.x, this.centroid.y);

        // let caption = `(${this.centroid.x.toFixed(2)}, ${this.centroid.y.toFixed(2)})`;
        // ctx.fillText(caption, this.centroid.x, this.centroid.y + parseFloat(ctx.font));
    }

    public interpolate(out: Vec2, p: Vec2): Vec2 {
        let [u, v, w] = this.cartesianToBarycentric(p);
        out.x = u * this.A.vx + v * this.B.vx + w * this.C.vx;
        out.y = u * this.A.vy + v * this.B.vy + w * this.C.vy;
        return out;
    }

    public barycentricToCartesian(u: number, v: number, w: number, out: Vec2): Vec2 {
        out.x = u * this.A.x + v * this.B.x + w * this.C.x;
        out.y = u * this.A.y + v * this.B.y + w * this.C.y;
        return out;
    }

    public cartesianToBarycentric(p: Vec2): [number, number, number] {
        let u = detp(p, this.B, this.C) / this.determinant;
        let v = detp(this.A, p, this.C) / this.determinant;
        let w = detp(this.A, this.B, p) / this.determinant;
        return [u, v, w];
    }

    /**
     * Determines if a given point lies within this triangle.
     * https://stackoverflow.com/questions/2049582/how-to-determine-a-point-in-a-2d-triangle
     */
    public isPointWithin(p: Vec2): boolean {
        let as_x = p.x - this.A.x;
        let as_y = p.y - this.A.y;

        let s_ab = (this.B.x - this.A.x) * as_y - (this.B.y - this.A.y) * as_x > 0;

        if ((this.C.x - this.A.x) * as_y - (this.C.y - this.A.y) * as_x > 0 === s_ab) return false;

        if ((this.C.x - this.B.x) * (p.y - this.B.y) - (this.C.y - this.B.y) * (p.x - this.B.x) > 0 !== s_ab) return false;

        return true;
    }
}

export default class VectorMesh {
    private vertices: Vertex[];
    private faces: Face[];
    private bingrid: BinGrid<Face>;
    public bounds: AABB;

    constructor() {
        this.vertices = [];
        this.faces = [];
    }

    /**
     * Creates a discretized vector mesh from a continuous vector field.
     * @param bounds the boundaries
     * @param subdivisions the resolution of the resulting mesh
     * @param vec_at a function that should return the vector value at a given coordinate
     * @return a new VectorMesh object
     */
    static create(bounds: AABB, subdivisions: number, vec_at: (x: number, y: number, vec?: Vec2) => Vec2): VectorMesh {
        let vertices: Vertex[] = [];
        let faces: Face[] = [];
        const left = bounds.x - bounds.width / 2;
        const top = bounds.y + bounds.height / 2;
        let v = new Vec2(0, 0);

        // Create vertices on regular grid
        for (let j = 0; j <= subdivisions; j++) {
            for (let i = 0; i <= subdivisions; i++) {
                let id = j * (subdivisions + 1) + i;
                let x = mapRange(i, 0, subdivisions, bounds.x - bounds.width / 2, bounds.width);
                let y = mapRange(j, 0, subdivisions, bounds.y - bounds.height / 2, bounds.height);
                v = vec_at(x, y, v);
                vertices.push(new Vertex(id, x, y, v.x, v.y));
            }
        }

        // Attach vertices to make faces
        let face_id = 0;
        for (let j = 1; j <= subdivisions; j++) {
            for (let i = 1; i <= subdivisions; i++) {
                let id0 = j * (subdivisions + 1) + i;
                let id1 = (j - 1) * (subdivisions + 1) + i;
                let id2 = id0 - 1;
                faces.push(new Face(face_id, vertices[id0], vertices[id1], vertices[id2]));
                id0 = id1 - 1;
                faces.push(new Face(face_id, vertices[id0], vertices[id1], vertices[id2]));
                face_id += 1;
            }
        }

        let mesh = new VectorMesh();
        mesh.vertices = vertices;
        mesh.faces = faces;
        mesh.bounds = bounds;
        mesh.fillBins();
        return mesh;
    }

    public loadPLYData(filedata: ArrayBuffer) {
        // Create custom stream for browser
        let stream = through(function (data) {
            this.queue(data);
        });

        PLYParser(stream, (err, data) => {
            if (err) throw err;
            this.processPLYData(data);
        });

        stream.write(filedata);
        stream.end();
    }

    /**
     * Process the parsed PLY data into the VectorMesh data structures.
     * @return true if the PLY data was successfully processed
     */
    private processPLYData(data): boolean {
        try {
            if (!data.hasOwnProperty('vertex')) {
                throw new Error("Data must contain 'vertex' elements");
            }
            if (!data.vertex.hasOwnProperty('x')) {
                throw new Error("Data must contain an 'x' property on 'vertex' elements");
            }
            if (!data.vertex.hasOwnProperty('y')) {
                throw new Error("Data must contain a 'y' property on 'vertex' elements");
            }
            if (!data.vertex.hasOwnProperty('vx')) {
                throw new Error("Data must contain a 'vx' property on 'vertex' elements");
            }
            if (!data.vertex.hasOwnProperty('vy')) {
                throw new Error("Data must contain a 'vy' property on 'vertex' elements");
            }
            if (!data.hasOwnProperty('face')) {
                throw new Error("Data must contain 'face' elements");
            }
            if (!data.face.hasOwnProperty('vertex_indices')) {
                throw new Error("Data must contain a 'vertex_indices' property on 'face' elements");
            }

            let minX = data.vertex.x[0];
            let minY = data.vertex.y[0];
            let maxX = data.vertex.x[0];
            let maxY = data.vertex.y[0];

            let n = data.vertex.x.length;
            for (let i = 0; i < n; i++) {
                this.vertices[i] = new Vertex(i,
                    data.vertex.x[i], data.vertex.y[i],
                    data.vertex.vx[i], data.vertex.vy[i]
                );
                minX = Math.min(minX, data.vertex.x[i]);
                minY = Math.min(minY, data.vertex.y[i]);
                maxX = Math.max(maxX, data.vertex.x[i]);
                maxY = Math.max(maxY, data.vertex.y[i]);
            }

            n = data.face.vertex_indices.length;
            for (let i = 0; i < n; i++) {
                let A = this.vertices[data.face.vertex_indices[i][0]];
                let B = this.vertices[data.face.vertex_indices[i][1]];
                let C = this.vertices[data.face.vertex_indices[i][2]];
                this.faces[i] = new Face(i, A, B, C);
            }

            let w = maxX - minX;
            let h = maxY - minY;
            let x = minX + w / 2;
            let y = minY + h / 2;
            this.bounds = new AABB(x, y, w, h);
            this.fillBins();

        } catch (e) {
            console.error("Invalid PLY vector mesh format.");
            console.log(e);
            console.log(data);
            return false;
        }

        return true;
    }

    private fillBins() {
        let w = this.bounds.width;
        let h = this.bounds.height;
        let n = 24;
        this.bingrid = new BinGrid<Face>(this.bounds, n);
        
        for (let f of this.faces) {
            let minX = Math.min(f.A.x, f.B.x, f.C.x) - this.bounds.left;
            let maxX = Math.max(f.A.x, f.B.x, f.C.x) - this.bounds.left;
            let minY = Math.min(f.A.y, f.B.y, f.C.y) - this.bounds.bottom;
            let maxY = Math.max(f.A.y, f.B.y, f.C.y) - this.bounds.bottom;
            
            let startX = Math.floor(minX / (w / n));
            let startY = Math.floor(minY / (h / n));
            let endX = Math.floor(maxX / (w / n));
            let endY = Math.floor(maxY / (h / n));

            if (endX < 0 || startX >= n || endY < 0 || startY >= n) {
                continue;
            }

            startX = clamp(0, n - 1, startX - 1);
            startY = clamp(0, n - 1, startY - 1);
            endX = clamp(0, n - 1, endX + 1);
            endY = clamp(0, n - 1, endY + 1);

            for (let j = startY; j <= endY; j++) {
                for (let i = startX; i <= endX; i++) {
                    this.bingrid.insertAt(i, n - 1 - j, f);
                }
            }
        }
    }

    public getFaceAt(x: number, y: number): Face {
        // TODO: determine which face is at (x, y)
        let p = new Point(x, y);
        let b = this.bingrid.getBinAt(p);
        if (b === null) return null;
        // console.log(b.items.map((f)=>f.id), p, b.bounds.x, b.bounds.y);
        for (let f of b.items) {
            if (f.isPointWithin(p)) return f;
        }
        return null;
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = "#cccccc";
        // this.bingrid.draw(ctx);
        for (let f of this.faces) {
            f.draw(ctx);
        }
    }
}
