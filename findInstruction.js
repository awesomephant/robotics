const fs = require('fs');
const s = [180.4,90.4];
fs.readFile('./instructions.json', 'utf-8', function(err, data){
    var arr = JSON.parse(data);
    for(let i = 0; i < arr.length; i++){
        if (arr[i][0] === s[0] && arr[i][1] === s[1]){
            console.log('Found at ' + i)
        }
    }
})