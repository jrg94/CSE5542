var gl;
var shaderProgram;
var draw_type = 2;
var which_object = 1;

// Buffers
var squareVertexPositionBuffer;
var squareVertexColorBuffer;
var lineVertexPositionBuffer;
var lineVertexColorBuffer;

// Matrices
var mvMatrix1;
var mvMatrix2;
var mvMatrix3;
var Xtranslate = 0.0;
var Ytranslate = 0.0;

// Stack
var mvMatrixStack = [];

// Mouse tracking
var lastMouseX = 0;
var lastMouseY = 0;

// Square vertices
const SQUARE = [
  0.5, 0.5, 0.0,
  -0.5, 0.5, 0.0,
  -0.5, -0.5, 0.0,
  0.5, -0.5, 0.0,
];

// Line vertices
const AXES = [
  0.0, 0.0, 0.0,
  0.7, 0.0, 0.0,
  0.0, 0.0, 0.0,
  0.0, 0.7, 0.0,
];

// Hierarchy
var root = new Node(1, SQUARE, AXES, [
  new Node(2, SQUARE, AXES, [
    new Node(3, SQUARE, AXES, [])
  ])
])

/**
 * A scene graph node.
 *
 * @param {number} id an unique
 * @param {!Array<number>} vertices a set of object vertices for this node
 * @param {!Array<number>} axes a set of axes vertices for this node
 * @param {!Array<!Node>} children a set of children nodes
 */
function Node(id, vertices, axes, children) {
  this.id = id;
  this.vertices = vertices;
  this.axes = axes;
  this.children = children;
}

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

function initBuffers() {
  squareVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);

  // Squares
  vertices = [
    0.5, 0.5, 0.0,
    -0.5, 0.5, 0.0,
    -0.5, -0.5, 0.0,
    0.5, -0.5, 0.0,
  ];

  // Lines
  l_vertices = [
    0.0, 0.0, 0.0,
    0.7, 0.0, 0.0,
    0.0, 0.0, 0.0,
    0.0, 0.7, 0.0,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  squareVertexPositionBuffer.itemSize = 3;
  squareVertexPositionBuffer.numItems = 4;

  lineVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lineVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(l_vertices), gl.STATIC_DRAW);
  lineVertexPositionBuffer.itemSize = 3;
  lineVertexPositionBuffer.numItems = 4;

  squareVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
  var colors = [
    1.0, 0.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  squareVertexColorBuffer.itemSize = 4;
  squareVertexColorBuffer.numItems = 4;
}

function setMatrixUniforms(matrix) {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, matrix);
}

/**
 * A helper function used to convert degrees to radians.
 *
 * @param {number} degrees the degrees of rotation
 * @return {number} the number of degrees as radians
 */
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

/**
 * A stack push function.
 *
 * @param {!Array<!Array<!Array<number>>>} stack a stack data structure
 * @param {!Array<!Array<number>} matrix a matrix
 */
function pushMatrix(stack, matrix) {
  var copy = mat4.create();
  mat4.set(matrix, copy);
  stack.push(copy);
}

/**
 * A stack pop function.
 *
 * @param {!Array<!Array<!Array<number>>>} stack a stack data structure
 * @return {!Array<!Array<number>} copy a matrix copy
 */
function popMatrix(stack) {
  if (stack.length == 0) {
    throw "Invalid popMatrix!";
  }
  return stack.pop();
}

/**
 * Prepares the buffers to draw a square.
 *
 * @param {!Array<!Array<number>} matrix a matrix
 */
function drawSquare(matrix) {

  setMatrixUniforms(matrix);

  // Prepares the square for transformation
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, squareVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, squareVertexPositionBuffer.numItems);

  // Prepares the axes for transformation
  gl.bindBuffer(gl.ARRAY_BUFFER, lineVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, lineVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, squareVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.LINES, 0, lineVertexPositionBuffer.numItems);
}

function drawScene() {

  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var mStack = [];
  var model = mat4.create();
  mat4.identity(model);

  model = mat4.multiply(model, mvMatrix1);
  drawSquare(model);

  mStack.push(model);
  console.log("push matrix");

  model = mat4.multiply(model, mvMatrix2);
  drawSquare(model);

  model = mStack.pop();
  model = mat4.multiply(model, mvMatrix3);
  drawSquare(model);
}

/**
 * A mouse event which begins tracking the mouse position when the
 * user clicks the mouse down.
 *
 * @param event some mouse event
 */
function onDocumentMouseDown(event) {
  event.preventDefault();
  document.addEventListener('mousemove', onDocumentMouseMove, false);
  document.addEventListener('mouseup', onDocumentMouseUp, false);
  document.addEventListener('mouseout', onDocumentMouseOut, false);
  var mouseX = event.clientX;
  var mouseY = event.clientY;
  lastMouseX = mouseX;
  lastMouseY = mouseY;
}

/**
 * A mouse event which manipulates the transformation matricies
 * and draws the scene as the mouse is moved.
 *
 * @param event some mouse event
 */
function onDocumentMouseMove(event) {
  var mouseX = event.clientX;
  var mouseY = event.ClientY;

  var diffX = mouseX - lastMouseX;
  var diffY = mouseY - lastMouseY;

  console.log("rotate" + degToRad(diffX / 5.0));

  // Grandparent
  if (which_object == 1) {
    mvMatrix1 = mat4.rotate(mvMatrix1, degToRad(diffX / 5.0), [0, 0, 1]);
  }

  // Parent
  if (which_object == 2) {
    mvMatrix2 = mat4.rotate(mvMatrix2, degToRad(diffX / 5.0), [0, 0, 1]);
  }

  // Child
  if (which_object == 3) {
    mvMatrix3 = mat4.rotate(mvMatrix3, degToRad(diffX / 5.0), [0, 0, 1]);
  }

  lastMouseX = mouseX;
  lastMouseY = mouseY;

  drawScene();
}

/**
 * A mouse event which removes all listeners when the mouse is
 * not pressed down.
 *
 * @param event some mouse event
 */
function onDocumentMouseUp(event) {
  document.removeEventListener('mousemove', onDocumentMouseMove, false);
  document.removeEventListener('mouseup', onDocumentMouseUp, false);
  document.removeEventListener('mouseout', onDocumentMouseOut, false);
}

/**
 * A mouse event which removes all listeners when the mouse is out
 * of the canvas.
 *
 * @param event some mouse event
 */
function onDocumentMouseOut(event) {
  document.removeEventListener('mousemove', onDocumentMouseMove, false);
  document.removeEventListener('mouseup', onDocumentMouseUp, false);
  document.removeEventListener('mouseout', onDocumentMouseOut, false);
}

/**
 * A keyboard event which manipulates the matrices for translation and
 * scaling depending on the key pressed.
 *
 * H: translates the matrices by 0.1 on the local x-axis
 * h: translates the matrices by -0.1 on the local x-axis
 * V: translates the matrices by 0.1 on the local y-axis
 * v: translates the matrices by -0.1. on the local y-axis
 * S: scales the matrices by 1.05
 * s: scales the matrices by 0.95
 *
 * @param event some keyboard event
 */
function onKeyDown(event) {

  console.log(event.keyCode);
  switch (event.keyCode) {
    case 72:
      if (event.shiftKey) {
        console.log('enter H');
        if (which_object == 1)
          mvMatrix1 = mat4.translate(mvMatrix1, [0.1, 0, 0]);
        if (which_object == 2)
          mvMatrix2 = mat4.translate(mvMatrix2, [0.1, 0, 0]);
        if (which_object == 3)
          mvMatrix3 = mat4.translate(mvMatrix3, [0.1, 0, 0]);
      } else {
        console.log('enter h');
        if (which_object == 1)
          mvMatrix1 = mat4.translate(mvMatrix1, [-0.1, 0, 0]);
        if (which_object == 2)
          mvMatrix2 = mat4.translate(mvMatrix2, [-0.1, 0, 0]);
        if (which_object == 3)
          mvMatrix3 = mat4.translate(mvMatrix3, [-0.1, 0, 0]);
      }
      break;
    case 86:
      if (event.shiftKey) {
        console.log('enter V');
        if (which_object == 1)
          mvMatrix1 = mat4.translate(mvMatrix1, [0.0, 0.1, 0]);
        if (which_object == 2)
          mvMatrix2 = mat4.translate(mvMatrix2, [0.0, 0.1, 0]);
        if (which_object == 3)
          mvMatrix3 = mat4.translate(mvMatrix3, [0.0, 0.1, 0]);
      } else {
        console.log('enter v');
        if (which_object == 1)
          mvMatrix1 = mat4.translate(mvMatrix1, [0.0, -0.1, 0]);
        if (which_object == 2)
          mvMatrix2 = mat4.translate(mvMatrix2, [0.0, -0.1, 0]);
        if (which_object == 3)
          mvMatrix3 = mat4.translate(mvMatrix3, [0.0, -0.1, 0]);
      }
      break;
    case 83:
      if (event.shiftKey) {
        console.log('enter S');
        if (which_object == 1)
          mvMatrix1 = mat4.scale(mvMatrix1, [1.05, 1.05, 1.05]);
        if (which_object == 2)
          mvMatrix2 = mat4.scale(mvMatrix2, [1.05, 1.05, 1.05]);
        if (which_object == 3)
          mvMatrix3 = mat4.scale(mvMatrix3, [1.05, 1.05, 1.05]);
      } else {
        console.log('enter s');
        if (which_object == 1)
          mvMatrix1 = mat4.scale(mvMatrix1, [0.95, 0.95, 0.95]);
        if (which_object == 2)
          mvMatrix2 = mat4.scale(mvMatrix2, [0.95, 0.95, 0.95]);
        if (which_object == 3)
          mvMatrix3 = mat4.scale(mvMatrix3, [0.95, 0.95, 0.95]);
      }
      break;
  }
  drawScene();
}

function webGLStart() {
  var canvas = document.getElementById("code04-canvas");
  initGL(canvas);
  initShaders();

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);


  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.whatever = 4;
  shaderProgram.whatever2 = 3;


  initBuffers();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  document.addEventListener('mousedown', onDocumentMouseDown, false);
  document.addEventListener('keydown', onKeyDown, false);

  mvMatrix1 = mat4.create();
  mat4.identity(mvMatrix1);
  mvMatrix1 = mat4.scale(mvMatrix1, [0.25, 0.25, 0.25]);

  mvMatrix2 = mat4.create();
  mat4.identity(mvMatrix2);
  mvMatrix1 = mat4.translate(mvMatrix1, [0.5, 0.5, 0]);

  mvMatrix3 = mat4.create();
  mat4.identity(mvMatrix3);
  mvMatrix3 = mat4.translate(mvMatrix3, [0.5, 0.5, 0]);

  drawScene();
}

function BG(red, green, blue) {
  gl.clearColor(red, green, blue, 1.0);
  drawScene();
}

function redraw() {

  mat4.identity(mvMatrix1);
  mat4.identity(mvMatrix2);
  mat4.identity(mvMatrix3);

  mvMatrix1 = mat4.scale(mvMatrix1, [0.25, 0.25, 0.25]);

  mvMatrix2 = mat4.translate(mvMatrix2, [0.5, 0.5, 0.25]);

  mvMatrix3 = mat4.translate(mvMatrix3, [0.5, 0.5, 0]);

  drawScene();
}

/**
 * A helper function used by the UI to control which object
 * is currently selected.
 *
 * @param {number} objectID the object id
 */
function obj(objectID) {
  which_object = objectID;
  drawScene();
}
