//MS1 : 6
//MS2 : 7
// green black blue red
var five = require("johnny-five"),
  board = new five.Board();

var setMicrostep = function(ms1, ms2, resolution) {
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
};

board.on("ready", function() {
  var k = 0;
  var ms1 = new five.Pin(6);
  var ms2 = new five.Pin(7);

  setMicrostep("quarter");

  var stepper = new five.Stepper({
    type: five.Stepper.TYPE.DRIVER,
    stepsPerRev: 200, // 1.8 deg quarter stepping
    pins: {
      step: 9,
      dir: 8
    }
  });
  //  console.log(stepper)
  stepper.direction(0).step(4000, function() {
    console.log("2000 steps clockwise");
  });
});
