import FieldVisualizer from "./FieldVisualizer.ts";
import { Field, FeatureField, MeshField } from "./Field.ts";
import FieldFeature from "./FieldFeature.ts";
import AABB from "./AABB.ts";
import Vec2 from "./Vec2.ts";
import Point from "./Point.ts";

// Define field features
let ccw1 = new FieldFeature(-125, -125, 1,
    function (x: number, y: number, vector: Vec2) {
        let r = Math.hypot(x, y);
        let e = Math.exp(r * r / (250 * 250));
        vector.x = -y / r / e;
        vector.y = x / r / e;
    }
);
let ccw2 = new FieldFeature(125, 125, 1,
    function (x: number, y: number, vector: Vec2) {
        let r = Math.hypot(x, y);
        let e = Math.exp(r * r / (250 * 250));
        vector.x = -y / r / e;
        vector.y = x / r / e;
    }
);
let sin = new FieldFeature(0, 0, 0.5,
    function (x: number, y: number, vector: Vec2) {
        vector.x = 1;
        vector.y = Math.sin(x / 10);
    }
);
let suck = new FieldFeature(125, -125, 0.5,
    function (x: number, y: number, vector: Vec2) {
        let r = Math.hypot(x, y);
        // let e = Math.exp(r * r / (250 * 250));
        let e = 1;
        vector.x = -x / r / e;
        vector.y = -y / r / e;
    }
);
let example = new FieldFeature(0, 0, 1,
    function (x: number, y: number, vector: Vec2) {
        let xy = (x * x + y * y) / (100 * 100);
        vector.x = Math.sin(xy);
        vector.y = Math.cos(xy);
    }
);
let discontinuous = new FieldFeature(0, 0, 1,
    function (x: number, y: number, vector: Vec2) {
        y /= 100;
        vector.x = 1;
        vector.y = Math.pow(3, 2 / y);
    }
);

let doubleGyre1 = new FieldFeature(0, 0, 1,
    function (x: number, y: number, vector: Vec2) {
        let t = 0;
        let param = { A: 0.1, ww: 2 * Math.PI / 2, ee: 0.25 };
        let at = param.ee * Math.sin(param.ww * t);
        let bt = 1 - 2 * param.ee * Math.sin(param.ww * t);
        let fxt = at * x * x + bt * x;
        let dfdx = 2 * x * at + bt;
        let u = -Math.PI * param.A * Math.sin(Math.PI * fxt) * Math.cos(Math.PI * y);
        let v = Math.PI * param.A * Math.cos(Math.PI * fxt) * Math.sin(Math.PI * y) * dfdx;
        vector.x = u;
        vector.y = v;
    }
);
export function init() {
    let viz: FieldVisualizer;
    let bounds: AABB;

    // let f1 = new FeatureField(new AABB(0, 0, 500, 500));
    let f1 = new FeatureField(new AABB(0, 0.5, 2, 1));
    // f1.addFeatures(ccw1, ccw2, sin);
    // f.addFeatures(ccw1, ccw2);
    // f.addFeatures(suck);
    // f1.addFeatures(example);
    // f1.addFeatures(discontinuous);
    f1.addFeatures(doubleGyre1);
    viz = new FieldVisualizer(f1, 500, 250);
    viz.draw();

    // let f2 = new MeshField(new AABB(0, 0, 500, 500));
}
