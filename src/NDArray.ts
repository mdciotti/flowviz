export default class NDArray<T> implements Iterable<T> {
    data: Array<T>;
    constructor(public cols: number, public rows: number) {
        this.data = [];
    }

    get(i: number, j: number): T {
        return this.data[j * this.cols + i];
    }

    set(i: number, j: number, value: T): void {
        this.data[j * this.cols + i] = value;
    }

    each(lambda: (i: number, j: number, val: T) => void): void {
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                lambda(i, j, this.get(i, j));
            }
        }
    }

    init(lambda: (i: number, j: number) => T): void {
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
                } else {
                    return { value: undefined, done: true };
                }
            }
        };
    }
}
