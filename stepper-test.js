//MS1 : 6
//MS2 : 7
// green black blue red
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

var setMicrostep = function(resolution, ms1, ms2) {
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

/**
* Returns a random integer between min (inclusive) and max (inclusive)
* Using Math.round() will give you a non-uniform distribution!
*/
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
var five = require("johnny-five"),
  board = new five.Board();
var currentInst = 0;
var instructions = [];

for (let i = 0; i < 10000; i++){
  instructions.push([getRandomInt(0,1), getRandomInt(0,1)])
}
console.log(instructions)

board.on("ready", function() {
  var ms1 = new five.Pin(13);
  var ms2 = new five.Pin(12);
  setMicrostep("quarter", ms1, ms2);  
  var stepperY = new five.Stepper({
    type: five.Stepper.TYPE.DRIVER,
    stepsPerRev: 200, // 1.8 deg quarter stepping
    pins: {
      step: 9,
      dir: 8
    }
  });
  var stepperX = new five.Stepper({
    type: five.Stepper.TYPE.DRIVER,
    stepsPerRev: 200, // 1.8 deg quarter stepping
    pins: {
      step: 3,
      dir: 4
    }
  });
  var steppers = [stepperX, stepperY];
  var run = function() {
    let inst = instructions[currentInst];
    console.log(currentInst + '/' + instructions.length);
    let steppersRemaining = 2;
    for (let i = 0; i < steppers.length; i++) {
      steppers[i].direction(inst[i]).rpm(60).step(200, function() {
        steppersRemaining--;
        if (steppersRemaining === 0){
          currentInst++;
          run();
        }
      });
    }
  };

  run();
});
