module.exports = {

    plotter: {
        running: false,
        position_steps: { x: 0, y: 0 },
        position_mm: { x: 0, y: 0 },
        stepperX: null,
        stepperY: null,
        maxRPM: 160,
        MMPerStep: 0.025,
        stepsPerMM: 1 / this.MMPerStep,
        //xyCorrection: 1.0245901,
        driftError: {
            x: 0,
            y: 0
        },
        xyCorrection: 1,
        calculateTotalDistance: function (instructions) {
            let totalDistance = 0;
            for (let i = 0; i < instructions.length - 1; i++) {
                //we only need to add up the larger delta, since that
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
        /**
         * Given a number of mm, returns the correct amout of steps depending on microstep resolution and axis.
         * @param {Number} n 
         * @param {Number} axis 
         */
        mmToSteps: function (n, axis) {
            //The Johnny Five Stepper class uses Math.floor(), which I think leads to drift issues. Math.round should sometimes round up, sometimes round down in basically a random pattern - this way the error should be spread across the whole drawing.

            // June 4, 2018. So the way to actually correct for this is I think this.
            // For each operation, calculate the error in steps - if we round 10.6 to 11, that's +0.4 error. 
            // When the cumulative error is greater 1 or smaller -1, correct it in the next operation
            // This needs to happen seperately for X/Y
            // This should reduce the error to +- 0.5 steps.
            let error = Math.round(n * (1 / this.MMPerStep)) - (n * (1 / this.MMPerStep))
            let correction = 0;
            this.driftError[axis] += error;
            if (this.driftError[axis] > 1) {
                correction = -1;
                this.driftError[axis] -= 1;
                //console.log('Correcting axis ' + axis + ' for ' + correction + ' step.')
            } else if (this.driftError[axis] < -1) {
                correction = 1;
                this.driftError[axis] += 1;
                //console.log(' Correcting axis ' + axis + ' for ' + correction + ' step.')
            }
            return Math.round(n * (1 / this.MMPerStep)) + correction;
        },
        calculateRPM: function (deltaX, deltaY) {
            // calculate relative pen velocity
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
            return rpm;
        },
        moveTo: function (x, y, cb) {
            let deltaX = x - this.position_mm.x;
            let xDirection = isPositive(deltaX);
            let deltaY = y - this.position_mm.y;
            let yDirection = isPositive(deltaY);
            let rpm = this.calculateRPM(deltaX, deltaY);
            var steppers = [this.stepperX, this.stepperY];
            var remainingSteppers = 2;
            for (let i = 0; i < 2; i++) {
                if (i === 0) {
                    //x
                    this.moveX(this.mmToSteps(deltaX, 'x'), xDirection, rpm.x, function () {
                        remainingSteppers--;
                        if (remainingSteppers === 0) {
                            plotter.position_mm.x += deltaX;
                            plotter.position_mm.y += deltaY;
                            cb();
                        }
                    });
                } else if (i === 1) {
                    //y
                    this.moveY(this.mmToSteps(deltaY, 'y'), yDirection, rpm.y, function () {
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
    }
}