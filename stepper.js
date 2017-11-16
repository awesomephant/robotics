//MS1 : 6
//MS2 : 7
// green black blue red
Number.prototype.between = function (a, b) {
  var min = Math.min.apply(Math, [a, b]),
      max = Math.max.apply(Math, [a, b]);
  return this > min && this < max;
};

var mapRange = function (n, range, targetRange) {
  var x = (n - range[0]) / (range[1] - range[0]) * (targetRange[1] - targetRange[0]) + targetRange[0];
  return x;
}

var five = require("johnny-five"),
  board = new five.Board();

var currentStep = 0;

var plotter = {
  stepperX: null,
  stepperY: null,
  penServo: null,
  vx: 0,
  vy: 0,
  maxV: 1,
  tolerance: .2,
  status: {
    x: 0,
    y: 0,
    penIsDown: false
  },
  run: function(instructions){
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

        if (plotter.x.between(s[0] - this.tolerance, s[0] + this.tolerance) && plotter.y.between(s[1] - this.tolerance, s[1] + this.tolerance)) {
            // position reached
            next();
        }
      }
  },
  initSteppers: function(cb) {
    this.stepperY = new five.Stepper({
      type: five.Stepper.TYPE.DRIVER,
      stepsPerRev: 200, // 1.8 deg quarter stepping
      pins: {
        step: 9,
        dir: 8
      }
    });
    this.stepperX = new five.Stepper({
      type: five.Stepper.TYPE.DRIVER,
      stepsPerRev: 200, // 1.8 deg quarter stepping
      pins: {
        step: 2,
        dir: 3
      }
    });
    cb();
  },
  setStepperSpeed: function(speedX, speedY) {
    this.stepperX.speed(speedX);
    this.stepperY.speed(speedY);
  },
  calculateStepperSpeed: function() {
    let s = instructions[currentStep];
    if (s.length === 2) {
      // calculate rel pen velocity
      let dx = Math.abs(this.status.x - s[0]);
      let dy = Math.abs(this.status.y - s[1]);
      let ratio = dx / dy;
      console.log("dx: " + dx + " dy: " + dy + " ratio: " + ratio);
      if (ratio < 1) {
        // dx > dy
        this.vx = this.maxV * ratio;
        this.vy = this.maxV;
      } else {
        this.vx = this.maxV;
        this.vy = this.maxV / ratio;
      }
      this.setStepperSpeed(this.vx, this.vy);
    }
  },
  penUp: function() {
    this.status.penIsDown = false;
  },
  penDown: function() {
    this.status.penIsDown = true;
  },
  setMicrostep: function(resolution, ms1, ms2) {
    if (resolution === "quarter") {
      ms1.low();
      ms2.high();
    } else if (resolution === "eighth") {
      ms1.high();
      ms2.high();
    } else {
      console.log("Invalid microstep resolution:" + resolution);
      return null;
    }
  }
};
board.on("ready", function() {
  var ms1 = new five.Pin(6);
  var ms2 = new five.Pin(7);
  var instructions;
  fs.readFile('instructions.json', 'utf-8', function (err, data) {
    if (err){console.error(err)}
    instructions = JSON.parse(data);
    console.log('Instructions loaded')
    plotter.setMicrostep(ms1, ms2, "quarter");
    plotter.initSteppers(function(){
      console.log('Steppers initialised')
      plotter.run(instructions)
    });
  })
  stepper.direction(0).step(4000, function() {
    console.log("2000 steps clockwise");
  });
});
