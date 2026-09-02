const SCALE = 3;

const PLOT_SIZE = 256 * SCALE;

const LEFT = 40;
const TOP = 30;
const RIGHT = 10;
const BOTTOM = 40;

const WIDTH = LEFT + PLOT_SIZE + RIGHT;   // 818
const HEIGHT = TOP + PLOT_SIZE + BOTTOM;  // 838

const canvas = document.getElementById("chart");
const ctx = canvas.getContext("2d");

canvas.width = WIDTH;
canvas.height = HEIGHT;

const info = d3.select("#info");

let points = [];
let quadtree;

let hoveredPoint = null;
let selectedPoint = null;



// ------------------------------------------------------------
// Coordinate conversion
// ------------------------------------------------------------

function sx(x) {
    return LEFT + x * SCALE;
}

function sy(y) {
    return TOP + y * SCALE;
}


// ------------------------------------------------------------
// Convert "ab56" -> x=171, y=86
// ------------------------------------------------------------

function idToPoint(id, name) {

    id = id.toLowerCase().padStart(4, "0");

    return {
        id,
        name,

        x: parseInt(id.substring(0, 2), 16),
        y: parseInt(id.substring(2, 4), 16)
    };
}


// ------------------------------------------------------------
// Load JSON
// ------------------------------------------------------------

fetch("vendors.json")
    .then(response => response.json())
    .then(data => {

        points = Object.entries(data)
            .map(([id, name]) => idToPoint(id, name));

        buildQuadtree();
        quadtree.addAll(points);

        draw();
    })
    .catch(error => {
        console.error("Failed to load JSON:", error);
    });


// ------------------------------------------------------------
// Draw everything
// ------------------------------------------------------------

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    drawQuadtree();
    drawPoints();
    drawAxes();
}

// ------------------------------------------------------------
// Draw points
// ------------------------------------------------------------

function drawPoints() {

    for (const d of points) {

        let radius = 1.5;
        let color = "#4dabf7";

        if (d === hoveredPoint) {
            radius = 3;
            color = "#ff6b6b";
        }

        if (d === selectedPoint) {
            radius = 3;
            color = "#ffd43b";
        }

        ctx.beginPath();

        ctx.arc(
            sx(d.x),
            sy(d.y),
            radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = color;
        ctx.fill();
    }
}


// ------------------------------------------------------------
// Build quadtree
// ------------------------------------------------------------

function buildQuadtree() {

    quadtree = d3.quadtree()
        .x(d => d.x)
        .y(d => d.y)
        .extent([
            [0, 0],
            [256, 256]
        ]);
}


// ------------------------------------------------------------
// Animate quadtree construction
// ------------------------------------------------------------

function animateQuadtree() {

    buildQuadtree();

    let i = 0;

    function addNext() {

        if (i >= points.length) {
            return;
        }

        quadtree.add(points[i]);

        draw();

        i++;

        setTimeout(addNext, 80);
    }

    addNext();
}


// ------------------------------------------------------------
// Draw quadtree cells
// ------------------------------------------------------------

function drawQuadtree() {

    if (!quadtree) {
        return;
    }

    quadtree.visit((node, x0, y0, x1, y1) => {

        ctx.beginPath();

        ctx.rect(
            sx(x0),
            sy(y0),
            (x1 - x0) * SCALE,
            (y1 - y0) * SCALE
        );

        ctx.strokeStyle = "rgba(150, 150, 150, 0.35)";
        ctx.lineWidth = 1;

        ctx.stroke();

        return false;
    });
}


// ------------------------------------------------------------
// Hexadecimal axes
// ------------------------------------------------------------

function toHex(value) {
    return Math.round(value)
        .toString(16)
        .padStart(2, "0");
}

function drawAxes() {

    ctx.save();

    ctx.strokeStyle = "#666";
    ctx.fillStyle = "#666";
    ctx.lineWidth = 1;
    ctx.font = "12px monospace";

    const axisX = LEFT;
    const axisY = TOP;


    // --------------------------------------------------------
    // X axis — TOP
    // --------------------------------------------------------

    ctx.beginPath();
    ctx.moveTo(axisX, axisY);
    ctx.lineTo(axisX + PLOT_SIZE, axisY);
    ctx.stroke();


    // --------------------------------------------------------
    // Y axis — LEFT
    // --------------------------------------------------------

    ctx.beginPath();
    ctx.moveTo(axisX, TOP);
    ctx.lineTo(axisX, TOP + PLOT_SIZE);
    ctx.stroke();


    // --------------------------------------------------------
    // Ticks
    // --------------------------------------------------------

    for (let value = 0; value <= 240; value += 16) {

        const x = sx(value);
        const y = sy(value);

        // X tick
        ctx.beginPath();
        ctx.moveTo(x, axisY);
        ctx.lineTo(x, axisY - 5);
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        ctx.fillText(
            toHex(value),
            x,
            axisY - 8
        );


        // Y tick
        ctx.beginPath();
        ctx.moveTo(axisX - 5, y);
        ctx.lineTo(axisX, y);
        ctx.stroke();

        ctx.textAlign = "right";
        ctx.textBaseline = "middle";

        ctx.fillText(
            toHex(value),
            axisX - 8,
            y
        );
    }


    // --------------------------------------------------------
    // ff
    // --------------------------------------------------------

    // X
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";

    ctx.fillText(
        "ff",
        sx(255),
        axisY - 8
    );


    // Y
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    ctx.fillText(
        "ff",
        axisX - 8,
        sy(255)
    );

    ctx.restore();
}

// ------------------------------------------------------------
// Mouse position
// ------------------------------------------------------------

function mousePosition(event) {

    const rect = canvas.getBoundingClientRect();

    // Screen -> canvas pixels
    const canvasX =
        (event.clientX - rect.left) *
        (canvas.width / rect.width);

    const canvasY =
        (event.clientY - rect.top) *
        (canvas.height / rect.height);

    // Canvas pixels -> data coordinates
    return {
        x: (canvasX - LEFT) / SCALE,
        y: (canvasY - TOP) / SCALE
    };
}




// ------------------------------------------------------------
// Hover
// ------------------------------------------------------------

canvas.addEventListener("mousemove", event => {

    if (!quadtree) {
        return;
    }

    const mouse = mousePosition(event);

    const point = quadtree.find(
        mouse.x,
        mouse.y,
        3
    );

    if (point !== hoveredPoint) {

        hoveredPoint = point;

        if (point) {

            info.html(`
                <strong>${escapeHtml(point.id)}</strong>
                — ${escapeHtml(point.name)}
            `);

        } else {

            info.text("Hover over a point");
        }

        draw();
    }
});


// ------------------------------------------------------------
// Click
// ------------------------------------------------------------

canvas.addEventListener("click", event => {

    if (!quadtree) {
        return;
    }

    const mouse = mousePosition(event);

    selectedPoint = quadtree.find(
        mouse.x,
        mouse.y,
        3
    );

    if (selectedPoint) {

        info.html(`
            <strong>${escapeHtml(selectedPoint.id)}</strong>
            — ${escapeHtml(selectedPoint.name)}
            <br>
            <small>x=${selectedPoint.x}, y=${selectedPoint.y}</small>
        `);

    } else {

        info.text("Hover over a point");
    }

    draw();
});


// ------------------------------------------------------------
// Button
// ------------------------------------------------------------

d3.select("#animate")
    .on("click", animateQuadtree);


// ------------------------------------------------------------
// Don't allow HTML in vendor names
// ------------------------------------------------------------

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
