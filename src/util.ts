export function lerp(x0: number, x1: number, t: number): number {
    return (1 - t) * x0 + t * x1;
}

export function clamp(min: number, max: number, x: number): number {
    return x > min ? (x < max ? x : max) : min; 
}

export function mapRange(x, x0, xw, y0, yw) {
    return (x - x0) / xw * yw + y0;
}
