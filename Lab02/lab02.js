var gl;
var shaderProgram;
var draw_type = 2;
var which_object = "body";

// Buffers
var squareVertexPositionBuffer;
var squareVertexColorBuffer;
var lineVertexPositionBuffer;
var lineVertexColorBuffer;

// Values
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

// Colors
const COLORS = [
  1.0, 0.0, 0.0, 1.0,
  0.0, 1.0, 0.0, 1.0,
  0.0, 0.0, 1.0, 1.0,
  1.0, 0.0, 0.0, 1.0,
];

// Hierarchy
var root = generateHierarchy();

/**
 * A scene graph node.
 *
 * @param {string} id an unique
 * @param {!Array<number>} vertices a set of object vertices for this node
 * @param {!Array<number>} axes a set of axes vertices for this node
 * @param {!Array<!Node>} children a set of children nodes
 */
function Node(id, vertices, axes, children) {
  this.id = id;
  this.vertices = vertices;
  this.axes = axes;
  this.mvMatrix = null;
  this.children = children;

  // Implements the drawing feature
  this.traverse = function(stack, model) {
    model = mat4.multiply(model, this.mvMatrix);
    drawSquare(model);
    if (!Array.isArray(children) || children.length == 0) {
      // Do nothing
    } else {
      // Traverse
      children.forEach(function(node) {
        pushMatrix(stack, model);
        node.traverse(stack, model);
        model = popMatrix(stack);
      });
    }
  }

  // Implements a searching feature
  this.search = function(id) {
    console.log("Searching for: " + id);
    var item = null;
    if (this.id === id) {
      console.log("Found: " + id);
      item = this;
    } else {
      for (var i = 0; i < children.length; i++) {
        var temp = children[i].search(id);
        if (temp !== null) {
          item = temp;
          break;
        }
      }
    }
    return item;
  }

  this.initMVMatrix = function() {
    var mvMatrix = mat4.create();
    this.mvMatrix = mat4.identity(mvMatrix);
  }

  // Implements a translation feature
  this.translate = function(dir) {
    if (this.mvMatrix === null) {
      this.initMVMatrix();
    }
    this.mvMatrix = mat4.translate(this.mvMatrix, dir);
  }

  // Implements a rotation feature
  this.rotate = function(diffX) {
    if (this.mvMatrix === null) {
      this.initMVMatrix();
    }
    this.mvMatrix = mat4.rotate(this.mvMatrix, degToRad(diffX / 5.0), [0, 0, 1]);
  }

  // Implements a scaling feature
  this.scale = function(scale) {
    if (this.mvMatrix === null) {
      this.initMVMatrix();
    }
    this.mvMatrix = mat4.scale(this.mvMatrix, scale);
  }
}

/**
 * Generates an object hierarchy.
 */
function generateHierarchy() {
  var root = new Node("body", SQUARE, AXES, [
    new Node("head", SQUARE, AXES, []),
    new Node("top-left-femur", SQUARE, AXES, [
      new Node("top-left-tibia", SQUARE, AXES, [])
    ]),
    new Node("middle-left-femur", SQUARE, AXES, [
      new Node("middle-left-tibia", SQUARE, AXES, [])
    ]),
    new Node("bottom-left-femur", SQUARE, AXES, [
      new Node("bottom-left-tibia", SQUARE, AXES, [])
    ]),
    new Node("top-right-femur", SQUARE, AXES, [
      new Node("top-right-tibia", SQUARE, AXES, [])
    ]),
    new Node("middle-right-femur", SQUARE, AXES, [
      new Node("middle-right-tibia", SQUARE, AXES, [])
    ]),
    new Node("bottom-right-femur", SQUARE, AXES, [
      new Node("bottom-right-tibia", SQUARE, AXES, [])
    ])
  ])
  console.log(root);
  return root;
}

/**
 * Initializes the graphics context given some canvas.
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
 * Sets up the buffers for drawing.
 */
function initBuffers() {
  // Square buffer
  squareVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(SQUARE), gl.STATIC_DRAW);
  squareVertexPositionBuffer.itemSize = 3;
  squareVertexPositionBuffer.numItems = 4;

  // Axes buffer
  lineVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lineVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(AXES), gl.STATIC_DRAW);
  lineVertexPositionBuffer.itemSize = 3;
  lineVertexPositionBuffer.numItems = 4;

  // Color buffer
  squareVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(COLORS), gl.STATIC_DRAW);
  squareVertexColorBuffer.itemSize = 4;
  squareVertexColorBuffer.numItems = 4;
}

/**
 * A helper function which sets matrix uniforms.
 */
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

/**
 * Draws the scene
 */
function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  var mStack = [];
  var model = mat4.create();
  model = mat4.identity(model);
  root.traverse(mStack, model);
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

  root.search(which_object).rotate(diffX);

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
        root.search(which_object).translate([0.1, 0, 0]);
      } else {
        console.log('enter h');
        root.search(which_object).translate([-0.1, 0, 0]);
      }
      break;
    case 86:
      if (event.shiftKey) {
        console.log('enter V');
        root.search(which_object).translate([0.0, 0.1, 0]);
      } else {
        console.log('enter v');
        root.search(which_object).translate([0.0, -0.1, 0]);
      }
      break;
    case 83:
      if (event.shiftKey) {
        console.log('enter S');
        root.search(which_object).scale([1.05, 1.05, 1.05]);
      } else {
        console.log('enter s');
        root.search(which_object).scale([0.95, 0.95, 0.95]);
      }
      break;
  }
  drawScene();
}

function webGLStart() {
  var canvas = document.getElementById("lab02-canvas");
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

  transformHierarchy();
  drawScene();
}

/**
 * Initializes the hierarchy by transforming all nodes.
 */
function transformHierarchy() {
  // Top level
  initNode("body", null, null, [0.25, 0.25, 0.25]);

  initNode("head", [.75, 0, 0], null, [.5, .5, .5]);

  initNode("top-left-femur", [0.35, .75, 0], null, [.20, .50, .35]);
  initNode("top-left-tibia", [0.0, 1.0, 0], null, null);

  initNode("middle-left-femur", [0.0, .75, 0], null, [.20, .50, .35]);
  initNode("middle-left-tibia", [0.0, 1.0, 0], null, null);

  initNode("bottom-left-femur", [-0.35, .75, 0], null, [.20, .50, .35]);
  initNode("bottom-left-tibia", [0.0, 1.0, 0], null, null);

  initNode("top-right-femur", [0.35, -.75, 0], null, [.20, .50, .35]);
  initNode("top-right-tibia", [0.0, -1.0, 0], null, null);

  initNode("middle-right-femur", [0.00, -.75, 0], null, [.20, .50, .35]);
  initNode("middle-right-tibia", [0.0, -1.0, 0], null, null);

  initNode("bottom-right-femur", [-0.35, -.75, 0], null, [.20, .50, .35]);
  initNode("bottom-right-tibia", [0.0, -1.0, 0], null, null);
}

/**
 * Sets some initial conditions for a node.
 */
function initNode(id, translate, rotate, scale) {
  var node = root.search(id);
  node.initMVMatrix();
  if (translate !== null) {
    node.translate(translate);
  }
  if (rotate !== null) {
    node.rotate(rotate);
  }
  if (scale !== null) {
    node.scale(scale);
  }
}

/**
 * Changes the background color of the canvas.
 *
 * @param {number} red the color value of red (0 <= red <= 1)
 * @param {number} green the color value of green (0 <= green <= 1)
 * @param {number} blue the color valye of blue (0 <= blue <= 1)
 */
function backgroundColor(red, green, blue) {
  gl.clearColor(red, green, blue, 1.0);
  drawScene();
}

/**
 * Resets the scene to it's original appearance.
 */
function redraw() {
  transformHierarchy();
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