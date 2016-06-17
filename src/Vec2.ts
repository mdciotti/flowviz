/**
 * Represents a 2D vector.
 */
export default class Vec2 {

    public static clone(vector: Vec2): Vec2 {
        return new Vec2(vector.x, vector.y);
    }

    public static magnitude(vector: Vec2): number {
        return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    }

    public static squaredMagnitude(vector: Vec2): number {
        return vector.x * vector.x + vector.y * vector.y;
    }

    /**
     * Returns the dot product of two vectors.
     */
    public static dot(lhs: Vec2, rhs: Vec2): number {
        return lhs.x * rhs.x + lhs.y * rhs.y;
    }

    /**
     * Returns the dot product of two vectors after normalization.
     */
    public static dotn(lhs: Vec2, rhs: Vec2): number {
        const lhsLen = lhs.x * lhs.x + lhs.y * lhs.y;
        const rhsLen = rhs.x * rhs.x + rhs.y * rhs.y;
        const len = Math.sqrt(lhsLen * rhsLen);
        return (lhs.x * rhs.x + lhs.y * rhs.y) / len;
    }

    public static zero(out: Vec2): Vec2 {
        out.x = 0;
        out.y = 0;
        return out;
    }

    public static create(): Vec2 {
        return new Vec2(0, 0);
    }

    // Mathematic Operations

    public static add(out: Vec2, lhs: Vec2, rhs: Vec2): Vec2 {
        out.x = lhs.x + rhs.x;
        out.y = lhs.y + rhs.y;
        return out;
    }

    public static subtract(out: Vec2, lhs: Vec2, rhs: Vec2): Vec2 {
        out.x = lhs.x - rhs.x;
        out.y = lhs.y - rhs.y;
        return out;
    }

    public static multiply(out: Vec2, lhs: Vec2, rhs: Vec2): Vec2 {
        out.x = lhs.x * rhs.x;
        out.y = lhs.y * rhs.y;
        return out;
    }

    public static divide(out: Vec2, lhs: Vec2, rhs: Vec2): Vec2 {
        out.x = lhs.x / rhs.x;
        out.y = lhs.y / rhs.y;
        return out;
    }

    public static scale(out: Vec2, lhs: Vec2, k: number): Vec2 {
        out.x = lhs.x * k;
        out.y = lhs.y * k;
        return out;
    }

    public static scaleAndAdd(out: Vec2, lhs: Vec2, rhs: Vec2, k: number): Vec2 {
        out.x = lhs.x + (k * rhs.x);
        out.y = lhs.y + (k * rhs.y);
        return out;
    }

    public static negate(out: Vec2, lhs: Vec2): Vec2 {
        out.x = -lhs.x;
        out.y = -lhs.y;
        return out;
    }

    public static normalize(out: Vec2, lhs: Vec2): Vec2 {
        let len = lhs.x * lhs.x + lhs.y * lhs.y;
        if (len > 0) {
            len = 1 / Math.sqrt(len);
            out.x = lhs.x * len;
            out.y = lhs.y * len;
        }
        return out;
    }

    public static min(out: Vec2, lhs: Vec2, rhs: Vec2): Vec2 {
        out.x = Math.min(lhs.x, rhs.x);
        out.y = Math.min(lhs.y, rhs.y);
        return out;
    }

    public static max(out: Vec2, lhs: Vec2, rhs: Vec2): Vec2 {
        out.x = Math.max(lhs.x, rhs.x);
        out.y = Math.max(lhs.y, rhs.y);
        return out;
    }

    // Performs a linear interpolation between two Vec2's
    public static lerp(out: Vec2, lhs: Vec2, rhs: Vec2, t): Vec2 {
        out.x = lhs.x + t * (rhs.x - lhs.x);
        out.y = lhs.y + t * (rhs.y - lhs.y);
        return out;
    }

    // Transforms the Vec2 with a mat2
    // public static transformMat2(out: Vec2, lhs, m: Mat2): Vec2 {
    // 	out.x = m[0] * lhs.x + m[2] * lhs.y;
    // 	out.y = m[1] * lhs.x + m[3] * lhs.y;
    // 	return out;
    // }

    public static distance(lhs: Vec2, rhs: Vec2) {
        let dx = rhs.x - lhs.x;
        let dy = rhs.y - lhs.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    public static squaredDistance(lhs: Vec2, rhs: Vec2) {
        let dx = rhs.x - lhs.x;
        let dy = rhs.y - lhs.y;
        return dx * dx + dy * dy;
    }

    public x: number;
    public y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public set(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }
}
