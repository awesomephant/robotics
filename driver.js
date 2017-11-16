var c, canvas, instructions;
var currentStep = 0;
var penPath = [];
var pathMarkers = [];
var isRunning = true;
var mouseX = 0;
var mouseY = 0;
const tolerance = .7;
var plotter = {
    x: 0,
    y: 0,
    penDown: false,
    maxV: 1,
    vx: 0,
    vy: 0,
    step: 1
};

Number.prototype.between = function (a, b) {
    var min = Math.min.apply(Math, [a, b]),
        max = Math.max.apply(Math, [a, b]);
    return this > min && this < max;
};

var httpRequest;
function makeRequest() {
    httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = alertContents;
    httpRequest.open('GET', 'instructions.json');
    httpRequest.send();
}

function alertContents() {
    if (httpRequest.readyState === XMLHttpRequest.DONE) {
        instructions = JSON.parse(httpRequest.responseText);
        init();
        main(); //Start the cycle.

    }
}

var mapRange = function (n, range, targetRange) {
    var x = (n - range[0]) / (range[1] - range[0]) * (targetRange[1] - targetRange[0]) + targetRange[0];
    return x;
}

var setVelocity = function () {
    let s = instructions[currentStep]
    if (s.length === 2) { // calculate rel pen velocity
        let dx = Math.abs(plotter.x - s[0]);
        let dy = Math.abs(plotter.y - s[1]);
        let ratio = dx / dy;
        console.log('dx: ' + dx + ' dy: ' + dy + ' ratio: ' + ratio);
        if (ratio < 1) { // dx > dy
            plotter.vx = plotter.maxV * ratio;
            plotter.vy = plotter.maxV;
        } else {
            plotter.vx = plotter.maxV;
            plotter.vy = plotter.maxV / ratio;
        }
    }
}
var init = function () {
    canvas = document.querySelector("#world");
    c = canvas.getContext("2d");
    c.canvas.width = 600;
    c.canvas.height = 400;
    setVelocity();
    instructions.push("end");
};
var draw = function () {
    c.clearRect(0, 0, c.canvas.width, c.canvas.height);

    if (plotter.penDown) {
        c.fillStyle = "black";
    } else {
        c.fillStyle = 'lightgray'
    }
    c.fillRect(plotter.x, plotter.y, 10, 10);
    c.fillStyle = "black";
    for (var i = 0; i < penPath.length; i++) {
        c.fillRect(penPath[i][0], penPath[i][1], 1, 1);
    }
    c.fillStyle = "blue";
    for (var j = 0; j < instructions.length; j++) {
        if (instructions[j] === "d" || instructions[j] === "u") {
            c.fillText(instructions[j].toUpperCase(), instructions[j - 1][0], instructions[j - 1][1] - 13);

        } else {
      //      c.fillText(Math.round(instructions[j][0]) + ' / ' + Math.round(instructions[j][1]), instructions[j][0], instructions[j][1] - 2);
    //        c.fillRect(instructions[j][0], instructions[j][1], 4, 4);
        }
    }
    c.fillText(mouseX + ' / ' + mouseY, mouseX + 5, mouseY + 5, );
};

var next = function () {
    currentStep += 1;
    let s = instructions[currentStep];
    if (s.length === 2) { setVelocity() }

};

var runPlotter = function () {
    let s = instructions[currentStep];
    if (s === "d") {
        plotter.penDown = true;
        next();
    } else if (s === "u") {
        plotter.penDown = false;
        next();
    } else if (s === 'end') {
        console.log('done')
        isRunning = false;
    } else if (s.length === 2) {
        // position instruction
        if (plotter.x < s[0]) {
            plotter.x += plotter.vx;
        } else if (plotter.x > s[0]) {
            plotter.x -= plotter.vx;
        }
        if (plotter.y < s[1]) {
            plotter.y += plotter.vy;
        } else if (plotter.y > s[1]) {
            plotter.y -= plotter.vy;
        }

        if (plotter.x.between(s[0] - tolerance, s[0] + tolerance) && plotter.y.between(s[1] - tolerance, s[1] + tolerance)) {
            // position reached
            next();
        }

    }

    if (plotter.penDown) {
        penPath.push([plotter.x, plotter.y]);
    }
};
window.main = function () {
    if (isRunning) {
        window.requestAnimationFrame(main);
        draw();
        runPlotter();
    }
};

window.addEventListener('mousemove', function (e) {
    var rect = canvas.getBoundingClientRect();
    mouseX = Math.round(e.clientX - rect.left);
    mouseY = Math.round(e.clientY - rect.top);

})
window.onload = function (e) {
    makeRequest();
}
