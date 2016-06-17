import { mapRange } from "util"
import Point from "Point"
import { FeatureField } from "Field"
import AABB from "AABB"

function toWorldX(x, canvas, bounds) {
    return mapRange(x, canvas.offsetLeft, canvas.width, bounds.x - bounds.width / 2, bounds.width);
}

function toWorldY(y, canvas, bounds) {
    return mapRange(canvas.height - y, -canvas.offsetTop, canvas.height, bounds.y - bounds.height / 2, bounds.height);
}

export function init() {
    let bounds = new AABB(0, 0, 500, 500);
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
    let f = new FeatureField(bounds);
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
            f.addSeed(new Point(x, y));
            f.draw(ctx);
        }

        dragging = false;
        endX = ev.pageX - canvas.offsetLeft;
        endY = ev.pageY - canvas.offsetTop;
    });

    document.getElementById("view").addEventListener("click", (ev) => {
        let w = endX - startX;
        let h = endY - startY;
        f.setBounds(new AABB(startX - w / 2, startY - h / 2, w, h));
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
