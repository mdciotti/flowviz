import Vec2 from "Vec2"
import Point from "Point"

export interface Differentiable {
    vec_at(x: number, y: number, v?: Vec2): Vec2;
}

export interface Integrator {
    // Step size parameter
    stepSize: number;

    // Differential calculator function
    diff: Differentiable;
        
    step(x: number, y: number): Point;
    stepReverse(x: number, y: number): Point;
}

export class RungeKutta4 implements Integrator {
    v0: Vec2;
    v1: Vec2;
    v2: Vec2;
    v3: Vec2;

    constructor(public stepSize: number, public diff: Differentiable) {}

    step(x: number, y: number): Point {
        this.v0 = this.diff.vec_at(x, y, this.v0);
        this.v0 = Vec2.normalize(this.v0, this.v0);
        Vec2.scale(this.v0, this.v0, this.stepSize);
        this.v1 = this.diff.vec_at(x + this.v0.x / 2, y + this.v0.y / 2, this.v1);
        this.v1 = Vec2.normalize(this.v1, this.v1);
        Vec2.scale(this.v1, this.v1, this.stepSize);
        this.v2 = this.diff.vec_at(x + this.v1.x / 2, y + this.v1.y / 2, this.v2);
        this.v2 = Vec2.normalize(this.v2, this.v2);
        Vec2.scale(this.v2, this.v2, this.stepSize);
        this.v3 = this.diff.vec_at(x + this.v2.x, y + this.v2.y, this.v3);
        this.v3 = Vec2.normalize(this.v3, this.v3);
        Vec2.scale(this.v3, this.v3, this.stepSize);

        x += this.v0.x / 6 + this.v1.x / 3 + this.v2.x / 3 + this.v3.x / 6;
        y += this.v0.y / 6 + this.v1.y / 3 + this.v2.y / 3 + this.v3.y / 6;

        return new Point(x, y);
    }
    
    stepReverse(x: number, y: number): Point {
        let h = -this.stepSize;
        this.v0 = this.diff.vec_at(x, y, this.v0);
        this.v0 = Vec2.normalize(this.v0, this.v0);
        Vec2.scale(this.v0, this.v0, h);
        this.v1 = this.diff.vec_at(x + this.v0.x / 2, y + this.v0.y / 2, this.v1);
        this.v1 = Vec2.normalize(this.v1, this.v1);
        Vec2.scale(this.v1, this.v1, h);
        this.v2 = this.diff.vec_at(x + this.v1.x / 2, y + this.v1.y / 2, this.v2);
        this.v2 = Vec2.normalize(this.v2, this.v2);
        Vec2.scale(this.v2, this.v2, h);
        this.v3 = this.diff.vec_at(x + this.v2.x, y + this.v2.y, this.v3);
        this.v3 = Vec2.normalize(this.v3, this.v3);
        Vec2.scale(this.v3, this.v3, h);

        x += this.v0.x / 6 + this.v1.x / 3 + this.v2.x / 3 + this.v3.x / 6;
        y += this.v0.y / 6 + this.v1.y / 3 + this.v2.y / 3 + this.v3.y / 6;

        return new Point(x, y);
    }
}

export class Symplectic4 implements Integrator {
    c1: number;
    c2: number;
    c3: number;
    c4: number;
    d1: number;
    d2: number;
    d3: number;
    d4: number;

    constructor(public stepSize: number, public diff: Differentiable) {
        let twoPowOneThird = Math.pow(2, 1/3);
        this.c1 = this.c4 = 1 / (2 * (2 - twoPowOneThird));
        this.c2 = this.c3 = (1 - twoPowOneThird) * this.c1;
        this.d1 = this.d3 = 2 * this.c1;
        this.d2 = -twoPowOneThird * this.d1;
        this.d4 = 0
    }

    step(x: number, y: number): Point {
        return new Point(x, y);
    }
    stepReverse(x: number, y: number): Point {
        return new Point(x, y);
    }
}

export class Euler implements Integrator {
    v: Vec2;

    constructor(public stepSize: number, public diff: Differentiable) {
        this.v = new Vec2(0, 0);
    }
    step(x: number, y: number): Point {
        this.v = this.diff.vec_at(x, y, this.v);
        return new Point(x + this.v.x, y + this.v.y);
    }
    stepReverse(x: number, y: number): Point {
        this.v = this.diff.vec_at(x, y, this.v);
        return new Point(x - this.v.x, y - this.v.y);
    }
}
