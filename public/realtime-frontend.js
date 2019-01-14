var c, oldX, oldY, output;
var penDown = false;
var points = [];

var config = {
    chartLength: 600,
    chartIncrement: 1,
    speed: .003,
    triangleHarmonics: 5,
    gridLines: 8,
    chartWidth: 600,
    chartHeight: 600
}

var getRelativeX = function (x) {
    return x - c.canvas.offsetLeft;
};
var getRelativeY = function (y) {
    return y - c.canvas.offsetTop;
};

var fillCircle = function (c, x, y, r) {
    c.beginPath();
    c.arc(x, y, r, 0, 2 * Math.PI, false)
    c.fillStyle = 'white';
    c.fill();
}

var sendUpdate = function () {
    socket.emit('instructions', points, (data) => {
    });
}

function draw() {
    c.fillStyle = 'white';
    c.fillRect(10, 10, 10, 10)
}

function step(timestamp) {
    draw();
    window.requestAnimationFrame(step);
}


var init = function () {
    let canvas = document.querySelector('#world')
    output = document.querySelector('.output')
    c = canvas.getContext('2d');

    draw();

    //window.setInterval(sendUpdate, 40)
    window.requestAnimationFrame(step);
}

scaleFactor = 1;

document.addEventListener('mousemove', function (e) {
    var x = getRelativeX(e.pageX);
    var y = getRelativeY(e.pageY);
    if (penDown && x > 0 && y > 0 && x < c.canvas.width && y < c.canvas.height) {
        c.beginPath();
        c.moveTo(oldX, oldY)
        c.lineTo(x, y)
        c.stroke();
        c.strokeStyle = 'white'
        points.push([Math.round(x * scaleFactor), Math.round(y * scaleFactor)])
        output.innerHTML = JSON.stringify(points).replace(/[\[\]]/g, ' ')
    }
    oldX = x;
    oldY = y;
})

document.addEventListener('mousedown', function (e) {
    penDown = true;
    c.clearRect(0,0,c.canvas.width, c.canvas.height)
    points = [];
})
document.addEventListener('mouseup', function (e) {
    penDown = false;
    if (points.length > 0){
        sendUpdate();
    }

})

init();
