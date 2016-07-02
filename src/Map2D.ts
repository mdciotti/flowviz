/**
 * 2D hash map wrapper for built-in Map.
 */
export default class Map2D<T> {
    public size: number;
    private data: Map<number, T>;
    private static p1: number = 73856093;
    private static p2: number = 83492791;

    constructor(n: number) {
        if (n < 0) throw new RangeError("Invalid hash size");
        this.size = n;
        this.data = new Map<number, T>();
    }

    public get(i: number, j: number): T {
        return this.data.get(this.hash(i, j));
    }

    public set(i: number, j: number, val: T): void {
        this.data.set(this.hash(i, j), val);
    }

    public has(i: number, j: number): boolean {
        return this.data.has(this.hash(i, j));
    }

    public delete(i: number, j: number): void {
        this.data.delete(this.hash(i, j));
    }

    public clear(): void {
        this.data.clear();
    }

    private hash(i: number, j: number): number {
        return (i * Map2D.p1 ^ j * Map2D.p2) % this.size;
    }
}
