const fs = require('fs')
var instructions = [];
var instructionPairs = [];
var _instructions = require("./instructions.json");
var newInstructions = [];

for (let i = 0; i < _instructions.length; i++) {
    if (_instructions[i].length === 2) {
        // if its not a point array, remove it
        instructions.push(_instructions[i]);
    }
}

for (let i = 1; i < instructions.length - 2; i+=2){
    instructionPairs.push([
        instructions[i],
        instructions[i - 1],
    ])
}


instructionPairs.sort(function (a, b) {
    return a[1][0] - b[1][0];
});

for (let i = 0; i < instructionPairs.length; i++){
    newInstructions.push(instructionPairs[i][0])
    newInstructions.push(instructionPairs[i][1])
}

let s = JSON.stringify(newInstructions)

fs.writeFileSync('instructions-ordered.json', s)