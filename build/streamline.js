define("util", ["require", "exports"], function (require, exports) {
    "use strict";
    function lerp(x0, x1, t) {
        return (1 - t) * x0 + t * x1;
    }
    exports.lerp = lerp;
    function clamp(min, max, x) {
        return x > min ? (x < max ? x : max) : min;
    }
    exports.clamp = clamp;
    function mapRange(x, x0, xw, y0, yw) {
        return (x - x0) / xw * yw + y0;
    }
    exports.mapRange = mapRange;
});
define("Vec2", ["require", "exports"], function (require, exports) {
    "use strict";
    /**
     * Represents a 2D vector.
     */
    class Vec2 {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
        static clone(vector) {
            return new Vec2(vector.x, vector.y);
        }
        static magnitude(vector) {
            return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        }
        static squaredMagnitude(vector) {
            return vector.x * vector.x + vector.y * vector.y;
        }
        /**
         * Returns the dot product of two vectors.
         */
        static dot(lhs, rhs) {
            return lhs.x * rhs.x + lhs.y * rhs.y;
        }
        /**
         * Returns the dot product of two vectors after normalization.
         */
        static dotn(lhs, rhs) {
            const lhsLen = lhs.x * lhs.x + lhs.y * lhs.y;
            const rhsLen = rhs.x * rhs.x + rhs.y * rhs.y;
            const len = Math.sqrt(lhsLen * rhsLen);
            return (lhs.x * rhs.x + lhs.y * rhs.y) / len;
        }
        static zero(out) {
            out.x = 0;
            out.y = 0;
            return out;
        }
        static create() {
            return new Vec2(0, 0);
        }
        // Mathematic Operations
        static add(out, lhs, rhs) {
            out.x = lhs.x + rhs.x;
            out.y = lhs.y + rhs.y;
            return out;
        }
        static subtract(out, lhs, rhs) {
            out.x = lhs.x - rhs.x;
            out.y = lhs.y - rhs.y;
            return out;
        }
        static multiply(out, lhs, rhs) {
            out.x = lhs.x * rhs.x;
            out.y = lhs.y * rhs.y;
            return out;
        }
        static divide(out, lhs, rhs) {
            out.x = lhs.x / rhs.x;
            out.y = lhs.y / rhs.y;
            return out;
        }
        static scale(out, lhs, k) {
            out.x = lhs.x * k;
            out.y = lhs.y * k;
            return out;
        }
        static scaleAndAdd(out, lhs, rhs, k) {
            out.x = lhs.x + (k * rhs.x);
            out.y = lhs.y + (k * rhs.y);
            return out;
        }
        static negate(out, lhs) {
            out.x = -lhs.x;
            out.y = -lhs.y;
            return out;
        }
        static normalize(out, lhs) {
            let len = lhs.x * lhs.x + lhs.y * lhs.y;
            if (len > 0) {
                len = 1 / Math.sqrt(len);
                out.x = lhs.x * len;
                out.y = lhs.y * len;
            }
            return out;
        }
        static min(out, lhs, rhs) {
            out.x = Math.min(lhs.x, rhs.x);
            out.y = Math.min(lhs.y, rhs.y);
            return out;
        }
        static max(out, lhs, rhs) {
            out.x = Math.max(lhs.x, rhs.x);
            out.y = Math.max(lhs.y, rhs.y);
            return out;
        }
        // Performs a linear interpolation between two Vec2's
        static lerp(out, lhs, rhs, t) {
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
        static distance(lhs, rhs) {
            let dx = rhs.x - lhs.x;
            let dy = rhs.y - lhs.y;
            return Math.sqrt(dx * dx + dy * dy);
        }
        static squaredDistance(lhs, rhs) {
            let dx = rhs.x - lhs.x;
            let dy = rhs.y - lhs.y;
            return dx * dx + dy * dy;
        }
        set(x, y) {
            this.x = x;
            this.y = y;
        }
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Vec2;
});
define("Point", ["require", "exports", "Vec2"], function (require, exports, Vec2_1) {
    "use strict";
    class Point extends Vec2_1.default {
        constructor(x, y) {
            super(x, y);
            this.x = x;
            this.y = y;
        }
        draw(ctx, radius) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Point;
});
define("AABB", ["require", "exports", "Point"], function (require, exports, Point_1) {
    "use strict";
    class AABB {
        constructor(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
        sample() {
            return new Point_1.default(this.x + Math.random() * this.width - this.width / 2, this.y + Math.random() * this.height - this.height / 2);
        }
        contains(point) {
            return Math.abs(point.x - this.x) <= this.width / 2 &&
                Math.abs(point.y - this.y) <= this.height / 2;
        }
        draw(ctx) {
            ctx.strokeRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        }
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = AABB;
});
define("NDArray", ["require", "exports"], function (require, exports) {
    "use strict";
    class NDArray {
        constructor(cols, rows) {
            this.cols = cols;
            this.rows = rows;
            this.data = [];
        }
        get(i, j) {
            return this.data[j * this.cols + i];
        }
        set(i, j, value) {
            this.data[j * this.cols + i] = value;
        }
        each(lambda) {
            for (let i = 0; i < this.cols; i++) {
                for (let j = 0; j < this.rows; j++) {
                    lambda(i, j, this.get(i, j));
                }
            }
        }
        init(lambda) {
            for (let i = 0; i < this.cols; i++) {
                for (let j = 0; j < this.rows; j++) {
                    this.set(i, j, lambda(i, j));
                }
            }
        }
        [Symbol.iterator]() {
            let self = this;
            let i = 0;
            return {
                next() {
                    if (i < self.data.length) {
                        return { value: self.data[i], done: false };
                    }
                    else {
                        return { value: undefined, done: true };
                    }
                }
            };
        }
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = NDArray;
});
define("Streamline", ["require", "exports", "Point", "Vec2", "Field"], function (require, exports, Point_2, Vec2_2, Field_1) {
    "use strict";
    var Direction;
    (function (Direction) {
        Direction[Direction["FORWARD"] = 1] = "FORWARD";
        Direction[Direction["BACKWARD"] = -1] = "BACKWARD";
    })(Direction || (Direction = {}));
    /**
     * Represends a single vertex within a streamline.
     */
    class Vertex extends Point_2.default {
        constructor(x, y, streamline) {
            super(x, y);
            this.streamline = streamline;
            this.v = new Vec2_2.default(0, 0);
        }
        static fromPoint(point, streamline) {
            return new Vertex(point.x, point.y, streamline);
        }
    }
    exports.Vertex = Vertex;
    /**
     * Represents a streamline as a collection of connected vertices.
     */
    class Streamline {
        /**
         * Creates a streamline through the specified point.
         * @param p0 the starting point for this streamline
         */
        constructor(seed, field) {
            this.arcLength = 0;
            this.vertices = [];
            this.seed = seed;
            this.seed.streamline = this;
            if (field instanceof Field_1.Field) {
                this.field = field;
                this.field.binGrid2.clear();
                this.compute();
            }
        }
        /**
         * Computes the path (forward and reverse) of a streamline given by a point
         */
        compute() {
            // Forward computation
            let fv = [];
            let fLen = this.computeLine(Direction.FORWARD, fv);
            // Reverse computation
            let bv = [];
            let bLen = this.computeLine(Direction.BACKWARD, bv);
            // Combine backward and forward vertices to form polyline
            this.arcLength = bLen + fLen;
            for (let i = bv.length - 1; i >= 0; i--) {
                let v = bv[i];
                v.partialArcLength = bLen - v.partialArcLength;
                this.vertices.push(v);
            }
            for (let i = 0; i < fv.length; i++) {
                let v = fv[i];
                v.partialArcLength += bLen;
                this.vertices.push(v);
            }
        }
        /**
         * Draws this streamline as a path on an HTML5 canvas context.
         * @param the HTML5 canvas 2D context
         */
        draw(ctx) {
            // Draw seed
            // ctx.moveTo(this.seed.x, this.seed.y);
            ctx.beginPath();
            ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
            for (let i = 1; i < this.vertices.length; i++) {
                let v = this.vertices[i];
                ctx.lineTo(v.x, v.y);
            }
            ctx.stroke();
        }
        computeLine(dir, vertices) {
            // Limit maximum iterations to prevent infinite loops
            // This number may need to be adjusted as it will naively truncate long
            // streamlines
            const MAX_ITER = 1000;
            let partialArcLength = 0;
            let p1 = this.seed; // last vertex
            let p0 = null; // current vertex
            for (let i = 0; i < MAX_ITER; i++) {
                if (dir === Direction.FORWARD) {
                    p0 = Vertex.fromPoint(this.field.integrator.step(p1.x, p1.y), this);
                }
                else {
                    p0 = Vertex.fromPoint(this.field.integrator.stepReverse(p1.x, p1.y), this);
                }
                // Vec2.subtract(p0.v, p0, p1);
                this.field.vec_at(p0.x, p0.y, p1.v);
                let len = Math.hypot(p0.x - p1.x, p0.y - p1.y);
                if (len < this.field.minStepLength) {
                    break;
                }
                partialArcLength += len;
                if (this.vertexIsValid(p0, p1, dir)) {
                    p1.streamline = this;
                    p1.partialArcLength = partialArcLength;
                    vertices.push(p0);
                    this.field.binGrid2.insert(p0);
                }
                else {
                    break;
                }
                p1 = p0;
            }
            return partialArcLength;
        }
        vertexIsValid(p0, p1, dir) {
            let inBounds = this.field.bounds.contains(p0);
            if (!inBounds)
                return false;
            let emptyRadius = !this.field.binGrid.hasVertexWithinRadius(p0, this.field.d_test, this);
            if (!emptyRadius)
                return false;
            if (p1) {
                let looping = LoopDetection(this.field, p1, p0, dir);
                if (looping)
                    return false;
            }
            return true;
        }
    }
    exports.Streamline = Streamline;
    /**
     * Returns true if a loop (or tight spiral) is detected.
     * @param cp the closing point (passed out)
     * @param p1 the previous vertex
     * @param p0 the current vertex
     */
    function LoopDetection(field, p1, p0, a) {
        let v1 = new Vec2_2.default(0, 0);
        let u0 = new Vec2_2.default(0, 0);
        let u1 = new Vec2_2.default(0, 0);
        const bin = field.binGrid2.getBinAt(p1);
        const cosAlpha = Math.cos(field.alpha);
        const cosBeta = Math.cos(field.beta);
        for (let cell of bin.neighbors) {
            if (cell.points.length === 0)
                continue;
            if (Math.abs(cell.range[(a + 1) / 2] - p0.id) < field.sigma)
                continue;
            for (let qp of cell.points) {
                let q = qp;
                if (Math.abs(q.id - p0.id) < field.sigma)
                    continue;
                if (Vec2_2.default.distance(q, p0) >= field.d_test)
                    continue;
                if (Vec2_2.default.distance(q, p0) <= field.epsilon) {
                    // cp = q;
                    return true; // closed
                }
                Vec2_2.default.subtract(v1, p0, p1);
                Vec2_2.default.scale(v1, v1, a);
                if (Vec2_2.default.dotn(q.v, v1) < cosAlpha)
                    continue;
                Vec2_2.default.subtract(u0, p0, q);
                Vec2_2.default.scale(u0, u0, a);
                Vec2_2.default.subtract(u1, p1, q);
                Vec2_2.default.scale(u1, u1, a);
                if (Vec2_2.default.dot(u0, v1) >= 0 && Vec2_2.default.dot(u1, v1) >= 0)
                    continue;
                if (Math.abs(Vec2_2.default.dotn(u0, p0.v)) > cosBeta) {
                    // cp = q;
                    return true; // closed
                }
                return true; // spiraling
            }
        }
        // bin.range[(a+1)/2] = p0.id;
        // add p0 to cc.sampleList;
        return false;
    }
});
define("BinGrid", ["require", "exports", "AABB", "NDArray"], function (require, exports, AABB_1, NDArray_1) {
    "use strict";
    class Bin {
        constructor(bounds) {
            this.bounds = bounds;
            this.points = [];
            this.neighbors = [];
            this.range = [Infinity, -Infinity];
        }
    }
    exports.Bin = Bin;
    /**
     * A data structure to hold a collection of points inside a grid.
     */
    class BinGrid {
        constructor(bounds, subdivisions) {
            this.bounds = bounds;
            this.subdivisions = subdivisions;
            this.pointCount = 0;
            // Create bins in a grid arrangement
            this.bins = new NDArray_1.default(subdivisions, subdivisions);
            let left = this.bounds.x - this.bounds.width / 2;
            let top = this.bounds.y + this.bounds.height / 2;
            let binWidth = this.bounds.width / this.bins.cols;
            let binHeight = this.bounds.height / this.bins.rows;
            // Initialize all bins
            this.bins.init((i, j) => {
                let x = left + i * binWidth + binWidth / 2;
                let y = top - j * binHeight - binHeight / 2;
                return new Bin(new AABB_1.default(x, y, binWidth, binHeight));
            });
            // Set neighbors
            this.bins.each((i, j, b) => {
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
        insert(point) {
            let b = this.getBinAt(point);
            if (b !== null) {
                b.points.push(point);
                point.id = this.pointCount++;
                b.range[0] = Math.min(point.id, b.range[0]);
                b.range[1] = Math.max(point.id, b.range[1]);
                return true;
            }
            else {
                return false;
            }
        }
        /**
         * Retrieves the bin containing a given point.
         */
        getBinAt(point) {
            if (this.bounds.contains(point)) {
                let left = this.bounds.x - this.bounds.width / 2;
                let bottom = this.bounds.y - this.bounds.height / 2;
                let x = (point.x - left) / this.bounds.width;
                let y = 1 - (point.y - bottom) / this.bounds.height;
                let i = Math.floor(x * this.subdivisions);
                let j = Math.floor(y * this.subdivisions);
                return this.bins.get(i, j);
            }
            else {
                return null;
            }
        }
        /**
         * Combines all of the points from several bins into one array.
         * @param the bins to collect points from
         * @return the aggregated array of points
         */
        aggregateBinsOld(bin) {
            let points = [];
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
        aggregateBins(bin, fn) {
            // Iterate over all points from neighboring bins
            for (let b of bin.neighbors)
                for (let p of b.points)
                    if (fn(p, b))
                        return true;
            return false;
        }
        /**
         * Aggregate points from bins into an iterator.
         */
        aggregateBins2(bin) {
            let currentBin = -1;
            let i = 0;
            let b = bin;
            const iterable = {
                next() {
                    if (i >= b.points.length) {
                        i = 0;
                        do {
                            ++currentBin;
                            if (currentBin < bin.neighbors.length) {
                                b = bin.neighbors[currentBin];
                            }
                            else {
                                return { done: true, value: null };
                            }
                        } while (b.points.length === 0);
                    }
                    let p = b.points[i];
                    ++i;
                    return { done: false, value: p };
                },
                [Symbol.iterator]() {
                    return iterable;
                }
            };
            return iterable;
        }
        /**
         * Checks if the point is within a minimum distance from any other point.
         */
        hasPointWithinRadius(point, radius) {
            const bin = this.getBinAt(point);
            if (bin === null)
                return false;
            return this.aggregateBins(bin, function comparePointDistance(p, b) {
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
        hasVertexWithinRadius(point, radius, streamline) {
            const bin = this.getBinAt(point);
            if (bin === null)
                return false;
            return this.aggregateBins(bin, (p, b) => {
                // Exclude points in streamline
                if (streamline && p.streamline === streamline)
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
        clear() {
            for (let b of this.bins.data) {
                b.points = [];
            }
        }
        /**
         * Draws the boundaries of each bin onto a graphics context.
         */
        draw(ctx) {
            this.bins.each((i, j, b) => b.bounds.draw(ctx));
        }
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = BinGrid;
});
define("FieldFeature", ["require", "exports", "Vec2"], function (require, exports, Vec2_3) {
    "use strict";
    class FieldFeature {
        constructor(x, y, strength, Fn) {
            this.x = x;
            this.y = y;
            this.strength = strength;
            this.enabled = true;
            // Specify default function
            this.V = Fn || function (x, y, vector) {
                vector.x = 0;
                vector.y = 0;
            };
        }
        getVelocity(x, y, vector) {
            if (!vector)
                vector = new Vec2_3.default(0, 0);
            this.V.call(this, x - this.x, y - this.y, vector);
            return Vec2_3.default.scale(vector, vector, this.strength);
        }
        setOrigin(x, y) {
            this.x = x;
            this.y = y;
        }
        clone() {
            return new FieldFeature(this.x, this.y, this.strength, this.V);
        }
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = FieldFeature;
});
define("Integrator", ["require", "exports", "Vec2", "Point"], function (require, exports, Vec2_4, Point_3) {
    "use strict";
    class RungeKutta4 {
        constructor(stepSize, diff) {
            this.stepSize = stepSize;
            this.diff = diff;
        }
        step(x, y) {
            this.v0 = this.diff.vec_at(x, y, this.v0);
            this.v0 = Vec2_4.default.normalize(this.v0, this.v0);
            Vec2_4.default.scale(this.v0, this.v0, this.stepSize);
            this.v1 = this.diff.vec_at(x + this.v0.x / 2, y + this.v0.y / 2, this.v1);
            this.v1 = Vec2_4.default.normalize(this.v1, this.v1);
            Vec2_4.default.scale(this.v1, this.v1, this.stepSize);
            this.v2 = this.diff.vec_at(x + this.v1.x / 2, y + this.v1.y / 2, this.v2);
            this.v2 = Vec2_4.default.normalize(this.v2, this.v2);
            Vec2_4.default.scale(this.v2, this.v2, this.stepSize);
            this.v3 = this.diff.vec_at(x + this.v2.x, y + this.v2.y, this.v3);
            this.v3 = Vec2_4.default.normalize(this.v3, this.v3);
            Vec2_4.default.scale(this.v3, this.v3, this.stepSize);
            x += this.v0.x / 6 + this.v1.x / 3 + this.v2.x / 3 + this.v3.x / 6;
            y += this.v0.y / 6 + this.v1.y / 3 + this.v2.y / 3 + this.v3.y / 6;
            return new Point_3.default(x, y);
        }
        stepReverse(x, y) {
            let h = -this.stepSize;
            this.v0 = this.diff.vec_at(x, y, this.v0);
            this.v0 = Vec2_4.default.normalize(this.v0, this.v0);
            Vec2_4.default.scale(this.v0, this.v0, h);
            this.v1 = this.diff.vec_at(x + this.v0.x / 2, y + this.v0.y / 2, this.v1);
            this.v1 = Vec2_4.default.normalize(this.v1, this.v1);
            Vec2_4.default.scale(this.v1, this.v1, h);
            this.v2 = this.diff.vec_at(x + this.v1.x / 2, y + this.v1.y / 2, this.v2);
            this.v2 = Vec2_4.default.normalize(this.v2, this.v2);
            Vec2_4.default.scale(this.v2, this.v2, h);
            this.v3 = this.diff.vec_at(x + this.v2.x, y + this.v2.y, this.v3);
            this.v3 = Vec2_4.default.normalize(this.v3, this.v3);
            Vec2_4.default.scale(this.v3, this.v3, h);
            x += this.v0.x / 6 + this.v1.x / 3 + this.v2.x / 3 + this.v3.x / 6;
            y += this.v0.y / 6 + this.v1.y / 3 + this.v2.y / 3 + this.v3.y / 6;
            return new Point_3.default(x, y);
        }
    }
    exports.RungeKutta4 = RungeKutta4;
    class Symplectic4 {
        constructor(stepSize, diff) {
            this.stepSize = stepSize;
            this.diff = diff;
            let twoPowOneThird = Math.pow(2, 1 / 3);
            this.c1 = this.c4 = 1 / (2 * (2 - twoPowOneThird));
            this.c2 = this.c3 = (1 - twoPowOneThird) * this.c1;
            this.d1 = this.d3 = 2 * this.c1;
            this.d2 = -twoPowOneThird * this.d1;
            this.d4 = 0;
        }
        step(x, y) {
            return new Point_3.default(x, y);
        }
        stepReverse(x, y) {
            return new Point_3.default(x, y);
        }
    }
    exports.Symplectic4 = Symplectic4;
    class Euler {
        constructor(stepSize, diff) {
            this.stepSize = stepSize;
            this.diff = diff;
            this.v = new Vec2_4.default(0, 0);
        }
        step(x, y) {
            this.v = this.diff.vec_at(x, y, this.v);
            return new Point_3.default(x + this.v.x, y + this.v.y);
        }
        stepReverse(x, y) {
            this.v = this.diff.vec_at(x, y, this.v);
            return new Point_3.default(x - this.v.x, y - this.v.y);
        }
    }
    exports.Euler = Euler;
});
define("Field", ["require", "exports", "BinGrid", "Streamline", "Point", "Vec2", "util", "FieldFeature", "Integrator"], function (require, exports, BinGrid_1, Streamline_1, Point_4, Vec2_5, util_1, FieldFeature_1, Integrator_1) {
    "use strict";
    /**
     * Represents a collection of streamlines in a given vector field.
     */
    class Field {
        constructor(bounds) {
            /** Threshold stamp-difference (for loop detection) */
            this.sigma = 4;
            /** Threshold minimum distance to consider two points equivalent */
            this.epsilon = 1E-20;
            /** Threshold angles */
            this.alpha = 20 * Math.PI / 90; // 20 deg
            this.beta = 10 * Math.PI / 90; // 10 deg
            this.setBounds(bounds);
            // this.generate_streamlines();
        }
        /**
         * Set up all components that depend on the bounds.
         */
        setBounds(bounds) {
            this.bounds = bounds;
            // Integration step size = 1/100 of view width
            let s = 0.01 * Math.min(this.bounds.width, this.bounds.height);
            this.integrator = new Integrator_1.RungeKutta4(s, this);
            // this.integrator = new Euler(s, this);
            let vdim = Math.min(this.bounds.width, this.bounds.height);
            this.d_sep = 0.02 * vdim;
            this.d_test = 0.5 * this.d_sep;
            this.candidate_spacing = 2 * this.d_sep;
            this.minStepLength = 0.0001 * vdim;
            this.minStreamlinelength = 0.1 * vdim;
            this.binGrid = new BinGrid_1.default(this.bounds, 25);
            this.binGrid2 = new BinGrid_1.default(this.bounds, 25);
            this.reset();
        }
        reset() {
            // Set up variables
            this.seedQueue = [];
            this.streamlines = [];
            this.binGrid.clear();
        }
        addSeed(point) {
            this.seedQueue.push(point);
        }
        step() {
            if (this.seedQueue.length === 0)
                return;
            // Remove (and select) the first seed from the queue
            let seed = this.seedQueue.shift();
            if (!this.bounds.contains(seed))
                return;
            // Check separation distance against nearby points
            // (The seed point is too close to another vertex)
            if (this.binGrid.hasPointWithinRadius(seed, this.d_test))
                return;
            let streamline = new Streamline_1.Streamline(seed, this);
            if (streamline.arcLength < this.minStreamlinelength)
                return;
            this.addStream(streamline);
            this.generateCandidates(streamline);
        }
        /**
         * Adds a streamline to this field and inserts its vertices into the bingrid
         * data structure for fast lookup.
         */
        addStream(s) {
            this.streamlines.push(s);
            for (let v of s.vertices) {
                this.binGrid.insert(v);
            }
        }
        /**
         * Generate the streamlines
         * @param d_sep the minimum separation distance between adjacent streamlines
         */
        generateStreamlines() {
            // While there is at least one seed in the queue
            while (this.seedQueue.length > 0) {
                this.step();
            }
        }
        draw(ctx) {
            ctx.save();
            ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
            // Transform to bounds
            ctx.scale(ctx.canvas.width / this.bounds.width, -ctx.canvas.height / this.bounds.height);
            ctx.translate(-this.bounds.x, -this.bounds.y);
            ctx.lineWidth = this.bounds.width / ctx.canvas.width;
            // Background
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(this.bounds.x - this.bounds.width / 2, this.bounds.y - this.bounds.height / 2, this.bounds.width, this.bounds.height);
            // Center
            // ctx.fillStyle = "#000000";
            // ctx.fillRect(0, 0, 1, 1);
            // Boundaries
            this.bounds.draw(ctx);
            // Grid
            ctx.strokeStyle = "#cccccc";
            this.binGrid.draw(ctx);
            // Initial seed
            if (this.initialSeed) {
                ctx.fillStyle = "#cc3333";
                this.initialSeed.draw(ctx, 2.5);
            }
            // Seed candidates
            ctx.fillStyle = "#3333cc";
            let radius = 2.5 * this.bounds.width / ctx.canvas.width;
            for (let sc of this.seedQueue) {
                sc.draw(ctx, radius);
            }
            // Streamlines
            ctx.strokeStyle = "#000000";
            // ctx.lineWidth = 1.0;
            for (let i = 0; i < this.streamlines.length; i++) {
                this.streamlines[i].draw(ctx);
            }
            ctx.restore();
        }
        generateCandidates(streamline) {
            let orthoVec = new Vec2_5.default(0, 0);
            let prevArcLength = 0;
            let t_len = 0;
            for (let i = 1; i < streamline.vertices.length; i++) {
                let lastVertex = streamline.vertices[i - 1];
                let vert = streamline.vertices[i];
                if (vert.partialArcLength - (prevArcLength + t_len) > this.candidate_spacing) {
                    // Calculate percent along last segment
                    let lastSegmentLength = vert.partialArcLength - lastVertex.partialArcLength;
                    t_len = this.candidate_spacing - lastVertex.partialArcLength + prevArcLength + t_len;
                    let t = t_len / lastSegmentLength;
                    let x = util_1.lerp(lastVertex.x, vert.x, t);
                    let y = util_1.lerp(lastVertex.y, vert.y, t);
                    // Calculate orthogonal vector using rotated vector field
                    orthoVec = this.vec_at(x, y, orthoVec);
                    let temp = orthoVec.x;
                    let k = this.d_sep / Vec2_5.default.magnitude(orthoVec);
                    orthoVec.x = -orthoVec.y * k;
                    orthoVec.y = temp * k;
                    let s1 = new Point_4.default(x + orthoVec.x, y + orthoVec.y);
                    let s2 = new Point_4.default(x - orthoVec.x, y - orthoVec.y);
                    this.seedQueue.push(s1, s2);
                    prevArcLength = lastVertex.partialArcLength;
                }
            }
        }
    }
    exports.Field = Field;
    class FeatureField extends Field {
        constructor(bounds) {
            super(bounds);
            // Define field features
            let ccw1 = new FieldFeature_1.default(-125, -125, 1, function (x, y, vector) {
                let r = Math.hypot(x, y);
                let e = Math.exp(r * r / (250 * 250));
                vector.x = -y / r / e;
                vector.y = x / r / e;
            });
            let ccw2 = new FieldFeature_1.default(125, 125, 1, function (x, y, vector) {
                let r = Math.hypot(x, y);
                let e = Math.exp(r * r / (250 * 250));
                vector.x = -y / r / e;
                vector.y = x / r / e;
            });
            let sin = new FieldFeature_1.default(0, 0, 0.5, function (x, y, vector) {
                vector.x = 1;
                vector.y = Math.sin(x / 10);
            });
            let suck = new FieldFeature_1.default(125, -125, 0.5, function (x, y, vector) {
                let r = Math.hypot(x, y);
                // let e = Math.exp(r * r / (250 * 250));
                let e = 1;
                vector.x = -x / r / e;
                vector.y = -y / r / e;
            });
            this.features = [ccw1, ccw2, sin];
            // this.features = [ccw1, ccw2];
            // this.features = [suck];
        }
        /**
         * Computes the field vector at the given point.
         * @param point the point at which to compute the field vector
         * @param vector an optional Vec2 instance to reuse
         * @return the computed vector
         */
        vec_at(x, y, vector) {
            if (!vector)
                vector = new Vec2_5.default(0, 0);
            // TODO: write barycentric interpolator for vector mesh
            // vector.set(1, Math.sin(x/10));
            // vector.set(Math.sin(y), Math.sin(x));
            // vector.set(Math.cos(x*x + y), x - y*y + 1);
            vector.x = 0;
            vector.y = 0;
            this.features.forEach((f) => {
                Vec2_5.default.add(vector, vector, f.getVelocity(x, y));
            });
            return vector;
        }
    }
    exports.FeatureField = FeatureField;
    class MeshField extends Field {
        // private mesh: VectorMesh;
        constructor(bounds) {
            super(bounds);
        }
        vec_at(x, y, vector) {
            if (!vector)
                vector = new Vec2_5.default(0, 0);
            return vector;
        }
    }
    exports.MeshField = MeshField;
});
define("main", ["require", "exports", "util", "Point", "Field", "AABB"], function (require, exports, util_2, Point_5, Field_2, AABB_2) {
    "use strict";
    function toWorldX(x, canvas, bounds) {
        return util_2.mapRange(x, canvas.offsetLeft, canvas.width, bounds.x - bounds.width / 2, bounds.width);
    }
    function toWorldY(y, canvas, bounds) {
        return util_2.mapRange(canvas.height - y, -canvas.offsetTop, canvas.height, bounds.y - bounds.height / 2, bounds.height);
    }
    function init() {
        let bounds = new AABB_2.default(0, 0, 500, 500);
        // let bounds = new AABB(-32, -32, 64, 64);
        // Set up canvas for drawing
        let canvas = document.createElement("canvas");
        canvas.width = 500;
        canvas.height = 500;
        document.body.appendChild(canvas);
        let ctx = canvas.getContext("2d");
        // ctx.translate(canvas.width / 2, canvas.height / 2);
        // ctx.scale(1, -1);
        // ctx.fillRect(0, 0, 10, 10);
        // Create field and draw
        let f = new Field_2.FeatureField(bounds);
        console.log(f);
        f.draw(ctx);
        let mousedown = false;
        let dragging = false;
        let dx = 0;
        let dy = 0;
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;
        // canvas.addEventListener("mousemove", (ev) => {
        //     dx = ev.movementX;
        //     dy = ev.movementY;
        //     if (mousedown) {
        //         dragging = true;
        //         endX = ev.pageX - canvas.offsetLeft;
        //         endY = ev.pageY - canvas.offsetTop;
        //         f.draw(ctx);
        //         ctx.strokeRect(startX, startY, endX - startX, endY - startY);
        //     } else {
        //         dragging = false;
        //     }
        // });
        canvas.addEventListener("mousedown", (ev) => {
            mousedown = true;
            startX = ev.pageX - canvas.offsetLeft;
            startY = ev.pageY - canvas.offsetTop;
        });
        canvas.addEventListener("mouseup", (ev) => {
            mousedown = false;
            console.log(dragging);
            if (!dragging) {
                let x = toWorldX(ev.pageX, canvas, f.bounds);
                let y = toWorldY(ev.pageY, canvas, f.bounds);
                // Create seed point
                f.addSeed(new Point_5.default(x, y));
                f.draw(ctx);
            }
            dragging = false;
            endX = ev.pageX - canvas.offsetLeft;
            endY = ev.pageY - canvas.offsetTop;
        });
        document.getElementById("view").addEventListener("click", (ev) => {
            let w = endX - startX;
            let h = endY - startY;
            f.setBounds(new AABB_2.default(startX - w / 2, startY - h / 2, w, h));
            f.draw(ctx);
        });
        document.getElementById("generate").addEventListener("click", (ev) => {
            f.generateStreamlines();
            f.draw(ctx);
        });
        document.getElementById("reset").addEventListener("click", (ev) => {
            f.reset();
            f.draw(ctx);
        });
        document.getElementById("reset_view").addEventListener("click", (ev) => {
            f.setBounds(bounds);
            f.draw(ctx);
        });
        document.getElementById("step100").addEventListener("click", (ev) => {
            for (let i = 0; i < 100; i++) {
                f.step();
            }
            f.draw(ctx);
        });
        document.getElementById("step").addEventListener("click", (ev) => {
            f.step();
            f.draw(ctx);
        });
    }
    exports.init = init;
});
//# sourceMappingURL=streamline.js.map