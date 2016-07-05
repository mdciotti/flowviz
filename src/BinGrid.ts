import Point from "./Point.ts";
import AABB from "./AABB.ts";
import NDArray from "./NDArray.ts";
import { Streamline, Vertex } from "./Streamline.ts";

export class Bin<T> {
    public items: Array<T>;
    public neighbors: Array<Bin<T>>;
    public range: [number, number];

    constructor(public bounds: AABB) {
        this.items = [];
        this.neighbors = [];
        this.range = [Infinity, -Infinity];
    }
}

/**
 * A data structure to hold a collection of points inside a grid.
 */
export default class BinGrid<T> {
    private bins: NDArray<Bin<T>>;
    private pointCount: number = 0;

    constructor(public bounds: AABB, public subdivisions: number) {
        // Create bins in a grid arrangement
        this.bins = new NDArray<Bin<T>>(subdivisions, subdivisions);
        let left = this.bounds.x - this.bounds.width / 2;
        let top = this.bounds.y + this.bounds.height / 2;
        let binWidth = this.bounds.width / this.bins.cols;
        let binHeight = this.bounds.height / this.bins.rows;
        // Initialize all bins
        this.bins.init((i: number, j: number): Bin<T> => {
            let x = left + i * binWidth + binWidth / 2;
            let y = top - j * binHeight - binHeight / 2;
            return new Bin<T>(new AABB(x, y, binWidth, binHeight));
        });
        // Set neighbors
        this.bins.each((i: number, j: number, b: Bin<T>) => {
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
            b.items.push(point);
            point._bin_id = this.pointCount++;
            b.range[0] = Math.min(point._bin_id, b.range[0]);
            b.range[1] = Math.max(point._bin_id, b.range[1]);
            return true;
        } else {
            return false;
        }
    }

    public insertAt(i: number, j: number, item: T): boolean {
        if (this.bins.cols <= i || this.bins.rows <= j) {
            return false;
        }
        this.bins.get(i, j).items.push(item);
    }

    /**
     * Retrieves the bin containing a given point.
     */
    public getBinAt(point: Point): Bin<T> {
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
     * Combines all of the items from several bins into one array.
     * @param the bins to collect items from
     * @return the aggregated array of items
     */
    public aggregateBins(bin: Bin<T>, fn: (p: Point, b: Bin<T>) => any): any {
        // Iterate over all items from neighboring bins
        for (let b of bin.neighbors) {
            for (let p of b.items) {
                let result = fn(p, b);
                if (result) return result;
            }
        }
        return null;
    }

    /**
     * Checks if the point is within a minimum distance from any other point.
     */
    public hasPointWithinRadius(point: Point, radius: number): boolean {
        const bin = this.getBinAt(point);
        if (bin === null) return false;

        return this.aggregateBins(bin, function comparePointDistance(p: Point, b: Bin<T>) {
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

        return this.aggregateBins(bin, (p: Point, b: Bin<T>) => {
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
            b.items = [];
        }
    }

    /**
     * Draws the boundaries of each bin onto a graphics context.
     */
    public draw(ctx: CanvasRenderingContext2D, fill?: boolean): void {
        ctx.save();
        ctx.fillStyle = "#cccc33";
        this.bins.each((i, j, b: Bin<T>) => {
            if (fill) {
                let intensity = Math.min(b.items.length / 10, 1);
                // let has6 = b.items.map((f) => f.id).indexOf(2) >= 0;
                if (intensity > 0) {
                    ctx.globalAlpha = intensity;
                    ctx.fillRect(b.bounds.x - b.bounds.width / 2,
                                b.bounds.y - b.bounds.height / 2,
                                b.bounds.width,
                                b.bounds.height);
                }
                ctx.globalAlpha = 1;
            }
            b.bounds.draw(ctx)
        });
        ctx.restore();
    }
}
