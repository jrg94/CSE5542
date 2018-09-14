var gl;
var shaderProgram;
var ctx;

// Global buffer objects
var squareVertexPositionBuffer;
var squareVertexColorBuffer;
var squareVertexIndexBuffer;
var squareLineVertexPositionBuffer;
var squareLineVertexColorBuffer;

// Global collections
var vertices = [];
var indices = [];
var colors = [];
var lineVertices = [];
var lineColors = [];

// Global counts
var num_vertices;
var num_indices;
var num_colors;

/**
 * Initializes the GL object given a canvas.
 */
function initGL(canvas) {
  try {
    gl = canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch (e) {}
  if (!gl) {
    alert("Could not initialise WebGL, sorry :-(");
  }
}

/**
 * Draws graph vertices and indices given a data species
 * and an optional species.
 *
 * @param {object} speciesCollection an dictionary of species data
 * @param {string} species a species string
 */
function createGraphVertices(speciesCollection, species) {
  clearCanvas();

  var speciesData = speciesCollection["species"];
  var collectionData = speciesCollection["data"];
  if (species !== undefined) {
    var currSpeciesData = speciesData[species];
    var avgs = currSpeciesData["avgs"];
    var barColors = [];
    barColors.push(currSpeciesData["color"].slice())
    var num_bars = avgs.length;
    var width = currSpeciesData["avgRange"];
    var min = currSpeciesData["minAvg"];
    var max = currSpeciesData["maxAvg"];
    createGraphVerticesPerSpecies(avgs, width, min, max, num_bars, barColors);
  } else {
    var num_avgs = speciesData[Object.keys(speciesData)[0]]["avgs"].length;
    var avgs = [];
    for (var i = 0; i < num_avgs; i++) {
      for (const species of Object.keys(speciesData)) {
        avgs.push(speciesData[species]["avgs"][i]);
      }
    }
    var barColors = [];
    for (const species of Object.keys(speciesData)) {
      barColors.push(speciesData[species]["color"].slice());
    }
    var num_bars = avgs.length;
    var width = collectionData["avgRange"];
    var min = collectionData["minAvg"];
    var max = collectionData["maxAvg"];
    createGraphVerticesPerSpecies(avgs, width, min, max, num_bars, barColors);
  }

  initBuffers();
  drawScene();
}

/**
 * Adds text to a particular line on the canvas.
 *
 * @param {number} i the line index
 * @param {number} max the value of the line with the largest index
 * @param {number} numLines the number of lines
 * @param {number} pad the padding in NDC
 */
function drawText(i, max, numLines, pad) {
  var yValue = i * max / (numLines - 1);
  var yValueTrunc = Math.round(yValue * 100) / 100
  var yPad = pad * ctx.canvas.height * 2;
  var yDrawingHeight = ctx.canvas.height - yPad
  var yIncrement = i / (numLines - 1) * yDrawingHeight;
  var yLocation = yDrawingHeight + yPad / 2 - yIncrement;
  ctx.fillText(yValueTrunc, 10, yLocation);
}

/**
 * Adds line vertices and colors to their respective collections.
 *
 * @param {number} i the line index
 * @param {number} v_margin the vertical margin
 * @param {number} step the step size between lines
 * @param {!Array<number>} color an RGBA array of color values
 */
function drawHorizontalLine(i, v_margin, step, color) {
  lineVertices.push(-1); // x1
  lineVertices.push(-1 + v_margin + i * step); // y1
  lineVertices.push(0); // z1
  lineVertices.push(1); // x2
  lineVertices.push(-1 + v_margin + i * step); // y2
  lineVertices.push(0); // z2

  lineColors.push(...color);
  lineColors.push(...color);
}

/**
 * Adds line vertices and colors to their respective collections.
 *
 * @param {number} i the line index
 * @param {!Array<number>} color an RGBA array of color values
 */
function drawVerticalLine(i, color) {
  lineVertices.push(-1 + i * 2 / 4); // x1
  lineVertices.push(-1); // y1
  lineVertices.push(0); // z1

  lineVertices.push(-1 + i * 2 / 4); // x1
  lineVertices.push(1); // y1
  lineVertices.push(0); // z1

  lineColors.push(...color);
  lineColors.push(...color);
}

/**
 * Adds bar vertices to their respective collections
 *
 * TODO: Refactor this list of parameters
 *
 * @param {number} h height
 * @param {number} v_margin the vertical margin in NDC
 * @param {number} i the index of the bar
 * @param {!Array<number>} avgs a list of averages
 * @param {number} min the smallest average
 * @param {number} pad some padding
 * @param {number} width the range between min and max
 * @param {!Array<!Array<numbers>>} barColors a collection of colors
 */
function drawBar(h, v_margin, i, avgs, min, pad, width, barColors) {
  // Bottom left point
  vertices.push(-1 + (3 * i + 1) * h); // x
  vertices.push(-1 + v_margin); // y
  vertices.push(0.0); // z
  // Bottom right point
  vertices.push(-1 + (3 * i + 3) * h);
  vertices.push(-1 + v_margin);
  vertices.push(0.0);
  // Top right point
  vertices.push(-1 + (3 * i + 3) * h);
  vertices.push(-1 + v_margin + (2 - 2 * v_margin) * (avgs[i] - min + pad) / (width + pad));
  vertices.push(0.0);
  // Top left point
  vertices.push(-1 + (3 * i + 1) * h);
  vertices.push(-1 + v_margin + (2 - 2 * v_margin) * (avgs[i] - min + pad) / (width + pad));
  vertices.push(0.0);

  indices.push(0 + 4 * i);
  indices.push(1 + 4 * i);
  indices.push(2 + 4 * i);
  indices.push(0 + 4 * i);
  indices.push(2 + 4 * i);
  indices.push(3 + 4 * i);

  // Need one color per vertex
  for (var j = 0; j < 4; j++) {
    colors.push(...barColors[i % barColors.length]);
  }
}

/**
 * Generates vertices, colors, and indices given some set of averages
 * and its associated metadata.
 *
 * @param {!Array<number>} avgs a list of averages for a data set
 * @param {number} width the range of the averages
 * @param {number} min the smallest value in averages
 * @param {number} max the largest value in averages
 * @param {number} num_bars the number of bars to graph
 * @param {!Array<!Array<number>>} barColors a list of bar colors given as RGBA lists
 */
function createGraphVerticesPerSpecies(avgs, width, min, max, num_bars, barColors) {
  num_vertices = num_bars * 4;
  num_indices = num_bars * 6;
  num_colors = num_bars * 4;

  var v_margin = 0.25;
  var pad = v_margin / 2;
  var h = 2 / (3 * num_bars + 1);

  // Vertical space occupied by graph
  var l = 2 - v_margin * 2;
  var numLines = 8;
  var step = l / (numLines - 1);
  var black = [0.0, 0.0, 0.0, 1.0];

  // Generates horizontal lines and text
  for (var i = 0; i < numLines; i++) {
    drawText(i, max, numLines, pad);
    drawHorizontalLine(i, v_margin, step, black);
  }

  // Generates vertical lines
  for (var i = 0; i < 4; i++) {
    drawVerticalLine(i, black);
  }

  // Generates bars
  for (var i = 0; i < num_bars; i++) {
    drawBar(h, v_margin, i, avgs, min, pad, width, barColors);
  }
}

/**
 * Initializes the set of buffers for drawing.
 */
function initBuffers() {
  // Vertex position buffer
  squareVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  squareVertexPositionBuffer.itemSize = 3;
  squareVertexPositionBuffer.numItems = num_vertices;
  // Vertex color buffer
  squareVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  squareVertexColorBuffer.itemSize = 4; // RGBA four components
  squareVertexColorBuffer.numItems = num_colors;
  // Fragment index buffer
  squareVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  squareVertexIndexBuffer.itemsize = 1;
  squareVertexIndexBuffer.numItems = num_indices;
  // Line vertex position buffer
  squareLineVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareLineVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVertices), gl.STATIC_DRAW);
  squareLineVertexPositionBuffer.itemSize = 3;
  squareLineVertexPositionBuffer.numItems = lineVertices.length / 3;
  // Line vertex color buffer
  squareLineVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareLineVertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineColors), gl.STATIC_DRAW);
  squareLineVertexColorBuffer.itemSize = 4; // RGBA four components
  squareLineVertexColorBuffer.numItems = lineColors.length / 4;
}

/**
 * Draws the scene using the existing buffers.
 */
function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Line Vertex Position
  gl.bindBuffer(gl.ARRAY_BUFFER, squareLineVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareLineVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  // Line Vertex Color Buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, squareLineVertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, squareLineVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  // Draw lines
  gl.drawArrays(gl.LINES, 0, lineVertices.length / 3);

  // Vertex position
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  // Vertex color
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, squareVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  // Fragment index
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareVertexIndexBuffer);
  gl.drawElements(gl.TRIANGLES, num_indices, gl.UNSIGNED_SHORT, 0);
}

/**
 * Initializes the canvas for drawing.
 */
function webGLStart() {
  var canvas = document.getElementById("lab01-canvas");
  var textCanvas = document.getElementById("text");
  ctx = textCanvas.getContext("2d");
  initGL(canvas);
  initShaders();
  // Vertex attribute
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
  // Color attribute
  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
  gl.clearColor(0.5, 0.5, 0.5, 1.0);
}

/**
 * Sets the background color of the canvas.
 * @param {number} red the value of red between 0 and 1
 * @param {number} green the value of green between 0 and 1
 * @param {number} blue the value of blue between 0 and 1
 */
function BG(red, green, blue) {
  gl.clearColor(red, green, blue, 1.0);
  drawScene();
}

/**
 * Clears the canvas by clearing out all the collections.
 */
function clearCanvas() {
  vertices = [];
  indices = [];
  colors = [];
  lineVertices = [];
  lineColors = [];
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}
