var _progress = require('cli-progress');
//MS1 : 6
//MS2 : 7
// green black blue red
var toTimeString = function (s) {
  var sec_num = parseInt(s, 10); // don't forget the second param
  var hours = Math.floor(sec_num / 3600);
  var minutes = Math.floor((sec_num - hours * 3600) / 60);
  var seconds = sec_num - hours * 3600 - minutes * 60;

  if (hours < 10) {
    hours = "0" + hours;
  }
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  return hours + ":" + minutes + ":" + seconds;
};

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

var setMicrostep = function (resolution, ms1, ms2) {
  if (resolution === "half") {
    ms1.high();
    ms2.low();
    plotter.MMPerStep *= 2;
    console.log("Set microstep resolution to " + resolution);
  } else if (resolution === "quarter") {
    ms1.low();
    ms2.high();
    plotter.MMPerStep *= 1.48;
    console.log("Set microstep resolution to " + resolution);
  } else if (resolution === "eighth") {
    ms1.high();
    ms2.high();
    console.log("Set microstep resolution to " + resolution);
  } else {
    console.log("Invalid microstep resolution: " + resolution);
    return null;
  }
};

/**
* Returns a random integer between min (inclusive) and max (inclusive)
* Using Math.round() will give you a non-uniform distribution!
*/
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
var isPositive = function (n) {
  if (n < 0) {
    return 0;
  } else {
    return 1;
  }
};
var five = require("johnny-five"),
  board = new five.Board();
var currentInst = 0;

var instructions = [];
var _instructions = require("./instructions.json");

for (let i = 0; i < _instructions.length; i++) {
  if (_instructions[i].length === 2) {
    // if its not a point array, remove it
    instructions.push(_instructions[i]);
  }
}

var plotter = {
  running: false,
  position_steps: { x: 0, y: 0 },
  position_mm: { x: 0, y: 0 },
  stepperX: null,
  stepperY: null,
  maxRPM: 200,
  MMPerStep: 0.025,
  stepsPerMM: 1 / this.MMPerStep,
  xyCorrection: 1.0245901,
  //xyCorrection: 1,
  calculateTotalDistance: function (instructions) {
    let totalDistance = 0;
    for (let i = 0; i < instructions.length - 1; i++) {
      //we only need to add up the larger delta, since that
      // notes on cosmic typewriter
      // 10.000 steps -> 12s
      // 1 step = 0.0012s
      let deltaX = Math.abs(instructions[i][0] - instructions[i + 1][0]);
      let deltaY = Math.abs(instructions[i][1] - instructions[i + 1][1]);
      if (deltaX > deltaY) {
        totalDistance += deltaX;
      } else {
        totalDistance += deltaY;
      }
    }
    return totalDistance;
  },
  calculateDrawingTime: function (instructions) {
    let seconds = 0;
    const stepDuration = 0.0012; //at 255 rpm
    seconds =
      this.mmToSteps(this.calculateTotalDistance(instructions)) * stepDuration;
    return toTimeString(seconds);
  },
  mmToSteps: function (n) {
    //The Johnny Five Stepper class uses Math.floor(), which I think leads to drift issues. Math.round should sometimes round up, sometimes round down in basically a random pattern - this way the error should be spread across the whole drawing. 
    return Math.round(n * (1 / this.MMPerStep));
  },
  calculateRPM: function (deltaX, deltaY) {
    // calculate rel pen velocity
    let dx = Math.abs(deltaX);
    let dy = Math.abs(deltaY);
    let ratio = 1;
    let rpm = { x: this.maxRPM, y: this.maxRPM };
    if (dx > dy) {
      ratio = dy / dx;
      rpm.y = this.maxRPM * ratio;
      rpm.x = this.maxRPM;
    } else if (dy > dx) {
      ratio = dx / dy;
      rpm.x = this.maxRPM * ratio;
      rpm.y = this.maxRPM;
    }
    if (dx === 0) {
      rpm.x = 0;
      rpm.y = this.maxRPM;
    } else if (dy === 0) {
      rpm.x = this.maxRPM;
      rpm.y = 0;
    }

    //console.log("RPM X: " + rpm.x + " RPM Y: " + rpm.y + " ratio: " + ratio);
    return rpm;
  },
  moveTo: function (x, y, cb) {
    let deltaX = x - this.position_mm.x;
    let xDirection = isPositive(deltaX);
    let deltaY = y - this.position_mm.y;
    let yDirection = isPositive(deltaY);
    let rpm = this.calculateRPM(deltaX, deltaY);
    // console.log("Position: " + this.position_mm.x + "/" + this.position_mm.y);
    // console.log("moveto:" + x + "/" + y);
    // console.log("delta:" + deltaX + "/" + deltaY);
    // console.log("direction:" + xDirection + "/" + yDirection);
    // console.log("rpm:" + rpm.x + "/" + rpm.y + "\n");
    var steppers = [this.stepperX, this.stepperY];
    var remainingSteppers = 2;
    for (let i = 0; i < 2; i++) {
      if (i === 0) {
        //x
        this.moveX(this.mmToSteps(deltaX), xDirection, rpm.x, function () {
          remainingSteppers--;
          if (remainingSteppers === 0) {
            plotter.position_mm.x += deltaX;
            plotter.position_mm.y += deltaY;
            cb();
          }
        });
      } else if (i === 1) {
        //y
        this.moveY(this.mmToSteps(deltaY), yDirection, rpm.y, function () {
          remainingSteppers--;
          if (remainingSteppers === 0) {
            plotter.position_mm.x += deltaX;
            plotter.position_mm.y += deltaY;
            cb();
          }
        });
      }
    }
  },
  moveByMM: function (x, y, cb) {
    let steppers = [this.stepperX, this.stepperY];
    let inst = [x, y];
    let steppersRemaining = 2;
    for (let i = 0; i < steppers.length; i++) {
      let direction = isPositive(inst[i]);
      let steps = inst[i] * (1 / this.MMPerStep);
      //console.log(steps);
      if (i === 0) {
        this.moveX(steps, direction, 200);
      } else {
        this.moveY(steps, direction, 200);
      }
    }
    cb();
  },
  moveX: function (steps, direction, rpm, cb) {
    steps = Math.abs(steps);
    this.stepperX
      .direction(direction)
      .rpm(rpm)
      .step(steps, function () {
        //      plotter.updatePosition(steps, direction, 0);
        cb();
      });
  },
  moveY: function (steps, direction, rpm, cb) {
    //Apply a correction factor (derived from measurement) to ensure both axis move equally
    steps = Math.abs(Math.round(this.xyCorrection * steps));
    //swap direction
    if (direction === 1) {
      direction = 0;
    } else if (direction === 0) {
      direction = 1;
    }
    this.stepperY
      .direction(direction)
      .rpm(rpm)
      .step(steps, function () {
        cb();
        //        plotter.updatePosition(steps, direction, 1);
      });
  },
  updatePosition: function (distance, direction, stepper) {
    if (stepper === 0) {
      //x stepper
      if (direction === 0) {
        this.position_steps.x -= distance;
        this.position_mm.x -= distance * this.MMPerStep;
      } else {
        this.position_steps.x += distance;
        this.position_mm.x += distance * this.MMPerStep;
      }
    } else if (stepper === 1) {
      //y stepper
      if (direction === 1) {
        this.position_steps.y -= distance;
        // Remove correction factor to get accurate mm reading
        this.position_mm.y -= Math.round(
          distance * this.MMPerStep / this.xyCorrection
        );
      } else {
        this.position_steps.y += distance;
        this.position_mm.y += Math.round(
          distance * this.MMPerStep / this.xyCorrection
        );
      }
    }
  }
};

board.on("ready", function () {
  var ms1_y = new five.Pin(7);
  var ms2_y = new five.Pin(2);
  var ms1_x = new five.Pin(6);
  var ms2_x = new five.Pin(5);
  setMicrostep("quarter", ms1_y, ms2_y);
  setMicrostep("quarter", ms1_x, ms2_x);
  plotter.stepperY = new five.Stepper({
    type: five.Stepper.TYPE.DRIVER,
    stepsPerRev: 200, // 1.8 deg 8th stepping
    pins: {
      step: 9,
      dir: 8
    }
  });
  plotter.stepperX = new five.Stepper({
    type: five.Stepper.TYPE.DRIVER,
    stepsPerRev: 200, // 1.8 deg 8th stepping
    pins: {
      step: 3,
      dir: 4
    }
  });

  var instructionTimeout = 10000;

  var run = function () {
    let inst = instructions[currentInst];
    plotter.moveTo(inst[0], inst[1], function () {
      if (instructions[currentInst + 1]) {
        currentInst++;
        if (clOptions.verbose) {
	let deltaX = 0;
	let deltaY = 0;
	if (currentInst > 4){
		deltaX = instructions[currentInst][0] - instructions[currentInst - 1][0]
		deltaY = instructions[currentInst][1] - instructions[currentInst - 1][1]

	}
          console.log("N: " + currentInst + "/" + instructions.length + ' X: ' + instructions[currentInst][0] + " Y: " + instructions[currentInst][1] + ' ΔX: ' + Math.round(deltaX) + ' ΔY: ' + Math.round(deltaY));
        } else {
          bar1.increment();
        }
        setTimeout(run, 20); //wait to reduce vibration
      } else {
        if (!clOptions.verbose) {
          bar1.stop();
        }
        plotter.moveTo(0, 0);
        console.log('Done.')
      }
    });
  };
  run();
});

const optionDefinitions = [
  { name: 'verbose', alias: 'v', type: Boolean },
]

const commandLineArgs = require('command-line-args')
const clOptions = commandLineArgs(optionDefinitions)

if (!clOptions.verbose) {
  var bar1 = new _progress.Bar({ etaBuffer: 100, barsize: 80, format: "{bar} {percentage}% | ETA: {eta}s | {value}/{total}" }, _progress.Presets.shades_classic);
  bar1.start(instructions.length, currentInst);
  //console.log( "Total drawing distance: " +   plotter.calculateTotalDistance(instructions) / 1000 + "m");
  console.log('\n')
}
