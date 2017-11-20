const fs = require('fs');
const svgson = require('svgson');
const svgPath = require('svg-path-parser');
const jsBezier = require('jsbezier');
const curvePrecision = .1;

var bezierToSegments = function (bezier) {
    let points = [];
    //x0, y0: starting point
    //x1, y1: control 1
    //x2, y2: control 2
    //x, y: finish point
    for (let i = 0; i < (1 / curvePrecision) + 1; i++) { // TODO set max value based on curve length
        points.push(jsBezier.jsBezier.pointOnCurve([
            { x: bezier.x0, y: bezier.y0 },
            { x: bezier.x1, y: bezier.y1 },
            { x: bezier.x2, y: bezier.y2 },
            { x: bezier.x, y: bezier.y },
        ], i * curvePrecision));
    }
    return points;
}

var parseShapes = function (data, callback) {
    var instructions =  [];
    for (let i = 0; i < data.childs.length; i++) { // start at 1 to skip title element
        let el = data.childs[i];
        if (el.name === 'line') {
            instructions.push([el.attrs.x1 * 1, el.attrs.y1 * 1]);
            instructions.push('d');
            instructions.push([el.attrs.x2 * 1, el.attrs.y2 * 1]);
            instructions.push('u');
        }
        else if (el.name === 'polygon' || el.name === 'polyline') {
            let points = el.attrs.points.replace(/[\x00-\x1F\x7F-\x9F]/g, "").split(' ');
            let coordinates = []
            let a = 0;
            while (a < points.length - 1) { // pair points
                //let p = points[a].split(',');
                let c = [parseFloat(points[a]), parseFloat(points[a+1])]
               coordinates.push(c)
               a += 2;
            }
   //         coordinates.push(coordinates[0]),
  //          console.log(el.attrs.points)
            console.log(points)
            console.log(coordinates)
            instructions.push([coordinates[0][0], coordinates[0][1]]);
            instructions.push('d');
            for (let j = 1; j < coordinates.length; j++) {
                instructions.push([coordinates[j][0], coordinates[j][1]]);
            }
            instructions.push('u');
        }

        else if (el.name === 'path') {
            let d = svgPath.makeAbsolute(svgPath.parseSVG(el.attrs.d))
              console.log(d);
            //       instructions.push([d[0].x, d[0].y]);
            for (let i = 1; i < d.length; i++) {
                let point = d[i];
                if (point.code === 'C') {
                    let segments = bezierToSegments(point);
                    console.log(segments);
                    instructions.push([segments[0].x, segments[0].y])
                    instructions.push('d');
                    for (let j = 1; j < segments.length; j++) {
                        instructions.push([segments[j].x, segments[j].y])
                    }
                }
                instructions.push('u');
            }

        }
    }
    callback(instructions);
}

fs.readFile('./drawings/square-2.svg', 'utf-8', function (err, data) {
    data.replace(/(<g>|<\/g>)/g, '')
    svgson(data, {
        svgo: false,
    }, function (result) {
        console.log(result)
        parseShapes(result, function (instructions) {
            fs.writeFileSync('instructions.json', JSON.stringify(instructions), 'utf-8')
        })
    });
});