import Point from "Point"
import AABB from "AABB"
import NDArray from "NDArray"
import { Streamline, Vertex } from "Streamline"

export class Bin {
    public points: Array<Point>;
    public neighbors: Array<Bin>;
    public range: [number, number];

    constructor(public bounds: AABB) {
        this.points = [];
        this.neighbors = [];
        this.range = [Infinity, -Infinity];
    }
}

/**
 * A data structure to hold a collection of points inside a grid.
 */
export default class BinGrid {
    private bins: NDArray<Bin>;
    private pointCount: number = 0;

    constructor(public bounds: AABB, public subdivisions: number) {
        // Create bins in a grid arrangement
        this.bins = new NDArray<Bin>(subdivisions, subdivisions);
        let left = this.bounds.x - this.bounds.width / 2;
        let top = this.bounds.y + this.bounds.height / 2;
        let binWidth = this.bounds.width / this.bins.cols;
        let binHeight = this.bounds.height / this.bins.rows;
        // Initialize all bins
        this.bins.init((i: number, j: number): Bin => {
            let x = left + i * binWidth + binWidth / 2;
            let y = top - j * binHeight - binHeight / 2;
            return new Bin(new AABB(x, y, binWidth, binHeight));
        });
        // Set neighbors
        this.bins.each((i: number, j: number, b: Bin) => {
            b.neighbors.push(b);
            if (i > 0) {
                b.neighbors.push(this.bins.get(i - 1, j));
                if (j > 0) {
                    b.neighbors.push(this.bins.get(i - 1, j - 1));
                }
                if (j < this.bins.rows - 1) {
                    b.neighbors.push(this.bins.get(i - 1, j + 1));
                }
            }
            if (i < this.bins.cols - 1) {
                b.neighbors.push(this.bins.get(i + 1, j));
                if (j > 0) {
                    b.neighbors.push(this.bins.get(i + 1, j - 1));
                }
                if (j < this.bins.rows - 1) {
                    b.neighbors.push(this.bins.get(i + 1, j + 1));
                }
            }
            if (j > 0) {
                b.neighbors.push(this.bins.get(i, j - 1));
            }
            if (j < this.bins.rows - 1) {
                b.neighbors.push(this.bins.get(i, j + 1));
            }
        });
    }

    /**
     * Inserts a point to the appropriate bin for this grid.
     * @param point the point to insert
     * @return true if the point was successfully inserted
     */
    public insert(point: Vertex): boolean {
        let b = this.getBinAt(point);
        if (b !== null) {
            b.points.push(point);
            point.id = this.pointCount++;
            b.range[0] = Math.min(point.id, b.range[0]);
            b.range[1] = Math.max(point.id, b.range[1]);
            return true;
        } else {
            return false;
        }
    }

    /**
     * Retrieves the bin containing a given point. 
     */
    public getBinAt(point: Point): Bin {
        if (this.bounds.contains(point)) {
            let left = this.bounds.x - this.bounds.width / 2;
            let bottom = this.bounds.y - this.bounds.height / 2;
            let x = (point.x - left) / this.bounds.width;
            let y = 1 - (point.y - bottom) / this.bounds.height;
            let i = Math.floor(x * this.subdivisions);
            let j = Math.floor(y * this.subdivisions);
            return this.bins.get(i, j);
        } else {
            return null;
        }
    }

    /**
     * Combines all of the points from several bins into one array.
     * @param the bins to collect points from
     * @return the aggregated array of points
     */
    public aggregateBinsOld(bin: Bin): Array<Point> {
        let points: Array<Point> = [];
        // Accumulate points from central bin
        for (let p of bin.points) {
            points.push(p);
        }
        // Accumulate points from neighboring bins
        for (let b of bin.neighbors) {
            for (let p of b.points) {
                points.push(p);
            }
        }
        return points;
    }

    /**
     * Combines all of the points from several bins into one array.
     * @param the bins to collect points from
     * @return the aggregated array of points
     */
    public aggregateBins(bin: Bin, fn: (p: Point, b: Bin) => boolean): boolean {
        // Iterate over all points from neighboring bins
        for (let b of bin.neighbors)
            for (let p of b.points)
                if (fn(p, b)) return true;
        return false;
    }

    /**
     * Aggregate points from bins into an iterator.
     */
    public aggregateBins2(bin: Bin): IterableIterator<Point> {
        let currentBin = -1;
        let i = 0;
        let b = bin;
        const iterable: IterableIterator<Point> = {
            next(): IteratorResult<Point> {
                if (i >= b.points.length) {
                    i = 0;

                    do {
                        ++currentBin;
                        if (currentBin < bin.neighbors.length) {
                            b = bin.neighbors[currentBin];
                        } else {
                            return { done: true, value: null };
                        }
                    } while (b.points.length === 0);
                }

                let p = b.points[i];
                ++i;
                return { done: false, value: p };
            },
            [Symbol.iterator](): IterableIterator<Point> {
                return iterable;
            }
        };
        return iterable;
    }

    /**
     * Checks if the point is within a minimum distance from any other point.
     */
    public hasPointWithinRadius(point: Point, radius: number): boolean {
        const bin = this.getBinAt(point);
        if (bin === null) return false;

        return this.aggregateBins(bin, function comparePointDistance(p: Point, b: Bin) {
            let dx = p.x - point.x;
            let dy = p.y - point.y;
            let dSq = dx * dx + dy * dy;
            if (dSq < radius * radius)
                return true;

            return false;
        });
    }

    /**
     * Checks if the point is within a minimum distance from another vertex in the streamline.
     */
    public hasVertexWithinRadius(point: Point, radius: number, streamline: Streamline): boolean {
        const bin = this.getBinAt(point);
        if (bin === null) return false;

        return this.aggregateBins(bin, (p: Point, b: Bin) => {
            // Exclude points in streamline
            if (streamline && (<Vertex>p).streamline === streamline)
                return false;

            let dx = p.x - point.x;
            let dy = p.y - point.y;
            let dSq = dx * dx + dy * dy;
            if (dSq < radius * radius)
                return true;

            return false;
        });
    }

    /**
     * Clears all bins.
     */
    public clear(): void {
        for (let b of this.bins.data) {
            b.points = [];
        }
    }

    /**
     * Draws the boundaries of each bin onto a graphics context.
     */
    public draw(ctx: CanvasRenderingContext2D): void {
        this.bins.each((i, j, b) => b.bounds.draw(ctx));
    }
}
