import Vec2 from "./Vec2.ts";

type VectorField = (x: number, y: number, vector: Vec2) => void;

export default class FieldFeature {
    private x: number;
    private y: number;
    private strength: number;
    private enabled: boolean;
    private V: VectorField;

    constructor(x: number, y: number, strength: number, Fn?: VectorField) {
        this.x = x;
        this.y = y;
        this.strength = strength;
        this.enabled = true;

        // Specify default function
        this.V = Fn || function (x: number, y: number, vector: Vec2) {
            vector.x = 0;
            vector.y = 0;
        };
    }

    public getVelocity(x: number, y: number, vector?: Vec2): Vec2 {
        if (!vector) vector = new Vec2(0, 0);
        this.V.call(this, x - this.x, y - this.y, vector);
        return Vec2.scale(vector, vector, this.strength);
    }

    public setOrigin(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    public clone(): FieldFeature {
        return new FieldFeature(this.x, this.y, this.strength, this.V);
    }
}
