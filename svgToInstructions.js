const fs = require("fs");
const svgson = require("svgson");
const svgPath = require("svg-path-parser");
const jsBezier = require("jsbezier");
const pathToPolygon = require("svg-path-to-polygons");

const curveDecimals = 2;
const curveTolerance = 0.1;

var parseShapes = function(data, callback) {
  var instructions = [];
  for (let i = 0; i < data.childs.length; i++) {
    // start at 1 to skip title element
    let el = data.childs[i];
    if (el.name === "line") {
      instructions.push([el.attrs.x1 * 1, el.attrs.y1 * 1]);
      instructions.push("d");
      instructions.push([el.attrs.x2 * 1, el.attrs.y2 * 1]);
      instructions.push("u");
    } else if (el.name === "polygon" || el.name === "polyline") {
      let points = el.attrs.points
        .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
        .split(" ");
      let coordinates = [];
      let a = 0;
      while (a < points.length - 1) {
        // pair points
        //let p = points[a].split(',');
        let c = [parseFloat(points[a]), parseFloat(points[a + 1])];
        coordinates.push(c);
        a += 2;
      }
      instructions.push([coordinates[0][0], coordinates[0][1]]);
      instructions.push("d");
      for (let j = 1; j < coordinates.length; j++) {
        instructions.push([coordinates[j][0], coordinates[j][1]]);
      }
      instructions.push("u");
    } else if (el.name === "path") {
      let pathData = el.attrs.d;
      let points = pathToPolygon.pathDataToPolys(pathData, {
        tolerance: curveTolerance,
        decimals: curveDecimals
      });
      console.log(points[0])
      instructions.push(points[0][0]);
      instructions.push("d");
      for (let i = 1; i < points[0].length; i++) {
        instructions.push(points[0][i]);
      }
      instructions.push("u");
    }
  }
  callback(instructions);
};

fs.readFile("./drawings/type-test.svg", "utf-8", function(err, data) {
  data.replace(/(<g>|<\/g>)/g, "");
  svgson(
    data,
    {
      svgo: false
    },
    function(result) {
      parseShapes(result, function(instructions) {
          //console.log(instructions);
        fs.writeFileSync(
          "instructions.json",
          JSON.stringify(instructions),
          "utf-8"
        );
      });
    }
  );
});
