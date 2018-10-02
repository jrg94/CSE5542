var gl;
var shaderProgram;
var draw_type = 2;
var which_object = "body";

// Buffers
var glSquareVertexPositionBuffer;
var glSquareVertexColorBuffer;
var glLineVertexPositionBuffer;
var glLineVertexColorBuffer;
var glMazeVertexPositionBuffer;
var glMazeVertexColorBuffer;
var glRectVertexPositionBuffer;
var glRectVertexColorBuffer;

// Values
var Xtranslate = 0.0;
var Ytranslate = 0.0;

// Mouse tracking
var lastMouseX = 0;
var lastMouseY = 0;

// Hierarchy
var root = generateHierarchy();
var coi = [0, 0, 0];
var viewAngle = 60;

/**
 * A scene graph node.
 *
 * @param {string} id an unique
 * @param {!Array<number>} vertices a set of object vertices for this node
 * @param {!Array<number>} axes a set of axes vertices for this node
 * @param {!Array<!Node>} children a set of children nodes
 */
function Node(id, vertices, axes, initTranslation, initRotation, initScale, children) {
  this.id = id;
  this.vertices = vertices;
  this.axes = axes;
  this.initTranslation = initTranslation;
  this.initRotation = initRotation;
  this.initScale = initScale;
  this.mMatrix = null;
  this.children = children;

  // Implements the drawing feature
  this.traverse = function(stack, model) {
    model = mat4.multiply(model, this.mMatrix);
    var pMatrix = getProjectionMatrix();
    var vMatrix = getViewMatrix();
    var mvMatrix = getModelViewMatrix(vMatrix, model);
    this.drawShape(mvMatrix, pMatrix);
    children.forEach(function(node) {
      pushMatrix(stack, model);
      node.traverse(stack, model);
      model = popMatrix(stack);
    });
  }

  // Prepares the buffers to draw a shape.
  this.drawShape = function(mvMatrix, pMatrix) {
    setMatrixUniforms(gl, mvMatrix, pMatrix);
    if (this.vertices === SQUARE) {
      this.drawSquareByContext(gl, glSquareVertexPositionBuffer, glSquareVertexColorBuffer, glLineVertexPositionBuffer);
    } else {
      this.drawSquareByContext(gl, glRectVertexPositionBuffer, glSquareVertexColorBuffer, glLineVertexPositionBuffer);
    }
  }

  // Prepares the buffers to draw a square.
  this.drawSquareByContext = function(gc, squarePositionBuffer, squareColorBuffer, linePositionBuffer) {
    // Prepares the square for transformation
    gc.bindBuffer(gc.ARRAY_BUFFER, squarePositionBuffer);
    gc.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squarePositionBuffer.itemSize, gc.FLOAT, false, 0, 0);
    gc.bindBuffer(gc.ARRAY_BUFFER, squareColorBuffer);
    gc.vertexAttribPointer(shaderProgram.vertexColorAttribute, squareColorBuffer.itemSize, gc.FLOAT, false, 0, 0);
    gc.drawArrays(gc.TRIANGLE_FAN, 0, squarePositionBuffer.numItems);

    // Prepares the axes for transformation
    gc.bindBuffer(gc.ARRAY_BUFFER, linePositionBuffer);
    gc.vertexAttribPointer(shaderProgram.vertexPositionAttribute, linePositionBuffer.itemSize, gc.FLOAT, false, 0, 0);
    gc.bindBuffer(gc.ARRAY_BUFFER, squareColorBuffer);
    gc.vertexAttribPointer(shaderProgram.vertexColorAttribute, squareColorBuffer.itemSize, gc.FLOAT, false, 0, 0);
    gc.drawArrays(gc.LINES, 0, linePositionBuffer.numItems);
  }

  // Implements a searching feature
  this.search = function(id) {
    var item = null;
    if (this.id === id) {
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

  // Implements the reset feature
  this.reset = function() {
    this.initMMatrix();
    if (this.initTranslation !== null) {
      this.translate(this.initTranslation);
    }
    if (this.initRotation !== null) {
      this.rotate(this.initRotation);
    }
    if (this.initScale !== null) {
      this.scale(this.initScale);
    }
    children.forEach(function(node) {
      node.reset();
    });
  }

  // Clears the model matrix
  this.initMMatrix = function() {
    var mMatrix = mat4.create();
    this.mMatrix = mat4.identity(mMatrix);
  }

  // Implements a translation feature
  this.translate = function(dir) {
    if (this.mvMatrix === null) {
      this.initMVMatrix();
    }
    this.mMatrix = mat4.translate(this.mMatrix, dir);
  }

  // Implements a rotation feature
  this.rotate = function(theta) {
    if (this.mvMatrix === null) {
      this.initMVMatrix();
    }
    this.mMatrix = mat4.rotateZ(this.mMatrix, theta);
  }

  // Implements a scaling feature
  this.scale = function(scale) {
    if (this.mvMatrix === null) {
      this.initMVMatrix();
    }
    this.mMatrix = mat4.scale(this.mMatrix, scale);
  }
}

/**
 * A helper function for grabbing the perspective projection matrix.
 */
function getProjectionMatrix() {
  var pMatrix = mat4.perspective(viewAngle, 1.0, 0.1, 100);
  return pMatrix;
}

/**
 * A helper function for grabbing the view matrix.
 */
function getViewMatrix() {
  var vMatrix = mat4.lookAt([0, 0, 5], coi, [0, 1, 0]);
  return vMatrix;
}

/**
 * A helper function for grabbing the model view matrix.
 */
function getModelViewMatrix(viewMatrix, modelMatrix) {
  var mvMatrix = mat4.create();
  mvMatrix = mat4.multiply(viewMatrix, modelMatrix);
  return mvMatrix;
}

/**
 * Generates an object hierarchy.
 */
function generateHierarchy() {
  var root = new Node("body", SQUARE, AXES, null, null, [.5, .5, .5], [
    new Node("head", SQUARE, AXES, [0, .75, 0], null, [.5, .5, .5], []),
    new Node("top-left-femur", RECT, AXES, [-0.5, .35, 0], degToRad(45.0), [.5, .5, .5], [
      new Node("top-left-tibia", RECT, AXES, [0.0, 1.0, 0], degToRad(90), null, [])
    ]),
    new Node("middle-left-femur", RECT, AXES, [-0.5, 0, 0], degToRad(45.0), [.5, .5, .5], [
      new Node("middle-left-tibia", RECT, AXES, [0.0, 1.0, 0], degToRad(90), null, [])
    ]),
    new Node("bottom-left-femur", RECT, AXES, [-0.5, -.35, 0], degToRad(45.0), [.5, .5, .5], [
      new Node("bottom-left-tibia", RECT, AXES, [0.0, 1.0, 0], degToRad(90), null, [])
    ]),
    new Node("top-right-femur", RECT, AXES, [0.5, .35, 0], degToRad(-45.0), [.5, .5, .5], [
      new Node("top-right-tibia", RECT, AXES, [0.0, 1.0, 0], degToRad(-90), null, [])
    ]),
    new Node("middle-right-femur", RECT, AXES, [0.5, 0, 0], degToRad(-45.0), [.5, .5, .5], [
      new Node("middle-right-tibia", RECT, AXES, [0.0, 1.0, 0], degToRad(-90), null, [])
    ]),
    new Node("bottom-right-femur", RECT, AXES, [0.5, -.35, 0], degToRad(-45.0), [.5, .5, .5], [
      new Node("bottom-right-tibia", RECT, AXES, [0.0, 1.0, 0], degToRad(-90), null, [])
    ])
  ])
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
  glSquareVertexPositionBuffer = gl.createBuffer();
  glMazeVertexPositionBuffer = gl.createBuffer();
  glMazeVertexColorBuffer = gl.createBuffer();
  glLineVertexPositionBuffer = gl.createBuffer();
  glSquareVertexColorBuffer = gl.createBuffer();
  glRectVertexPositionBuffer = gl.createBuffer();
  initBuffersByContext(
    gl,
    glSquareVertexPositionBuffer,
    glMazeVertexPositionBuffer,
    glMazeVertexColorBuffer,
    glLineVertexPositionBuffer,
    glSquareVertexColorBuffer,
    glRectVertexPositionBuffer
  );
}

/**
 * A helper function for generating buffers by context. This function
 * serves no real purpose as it was implemented to help with the map before
 * I learned about viewport and scissor.
 */
function initBuffersByContext(
  gc,
  squareVertexPositionBuffer,
  mazeVertexPositionBuffer,
  mazeVertexColorBuffer,
  lineVertexPositionBuffer,
  squareVertexColorBuffer,
  rectVertexPositionBuffer
) {

  // Square buffer
  gc.bindBuffer(gc.ARRAY_BUFFER, squareVertexPositionBuffer);
  gc.bufferData(gc.ARRAY_BUFFER, new Float32Array(SQUARE), gc.STATIC_DRAW);
  squareVertexPositionBuffer.itemSize = 3;
  squareVertexPositionBuffer.numItems = 4;

  // Rect Buffer
  gc.bindBuffer(gc.ARRAY_BUFFER, rectVertexPositionBuffer);
  gc.bufferData(gc.ARRAY_BUFFER, new Float32Array(RECT), gc.STATIC_DRAW);
  rectVertexPositionBuffer.itemSize = 3;
  rectVertexPositionBuffer.numItems = 4;

  // Maze buffer
  gc.bindBuffer(gc.ARRAY_BUFFER, mazeVertexPositionBuffer);
  gc.bufferData(gc.ARRAY_BUFFER, new Float32Array(MAZE), gc.STATIC_DRAW);
  mazeVertexPositionBuffer.itemSize = 3;
  mazeVertexPositionBuffer.numItems = MAZE.length / 3;

  // Maze color buffer
  gc.bindBuffer(gc.ARRAY_BUFFER, mazeVertexColorBuffer);
  var colorArray = Array((MAZE.length / 3) * 4).fill(0)
  gc.bufferData(gc.ARRAY_BUFFER, new Float32Array(colorArray), gc.STATIC_DRAW);
  mazeVertexColorBuffer.itemSize = 4;
  mazeVertexColorBuffer.numItems = colorArray.length / 4;

  // Line buffer
  gc.bindBuffer(gc.ARRAY_BUFFER, lineVertexPositionBuffer);
  gc.bufferData(gc.ARRAY_BUFFER, new Float32Array(AXES), gc.STATIC_DRAW);
  lineVertexPositionBuffer.itemSize = 3;
  lineVertexPositionBuffer.numItems = AXES.length / 3;

  // Color buffer
  gc.bindBuffer(gc.ARRAY_BUFFER, squareVertexColorBuffer);
  gc.bufferData(gc.ARRAY_BUFFER, new Float32Array(COLORS), gc.STATIC_DRAW);
  squareVertexColorBuffer.itemSize = 4;
  squareVertexColorBuffer.numItems = 4;
}

/**
 * A helper function which sets matrix uniforms.
 */
function setMatrixUniforms(gc, mvMatrix, pMatrix) {
  gc.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
  gc.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
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
 * Draws the static maze.
 */
function drawMaze() {
  drawMazeByContext(gl, glMazeVertexPositionBuffer, glMazeVertexColorBuffer);
}

/**
 * A helper function for drawing the static maze per context.
 * This function is not necessary.
 */
function drawMazeByContext(gc, positionBuffer, colorBuffer) {
  var modelMatrix = mat4.create();
  modelMatrix = mat4.identity(modelMatrix);
  var mvMatrix = getModelViewMatrix(getViewMatrix(), modelMatrix);
  setMatrixUniforms(gc, mvMatrix, getProjectionMatrix());

  gc.bindBuffer(gc.ARRAY_BUFFER, positionBuffer);
  gc.vertexAttribPointer(shaderProgram.vertexPositionAttribute, positionBuffer.itemSize, gc.FLOAT, false, 0, 0);
  gc.bindBuffer(gc.ARRAY_BUFFER, colorBuffer);
  gc.vertexAttribPointer(shaderProgram.vertexColorAttribute, colorBuffer.itemSize, gc.FLOAT, false, 0, 0);
  gc.drawArrays(gc.LINES, 0, positionBuffer.numItems);
}

/**
 * Draws the scene
 */
function drawScene() {
  // Main scene
  gl.enable(gl.SCISSOR_TEST);
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.scissor(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  draw();
  gl.disable(gl.SCISSOR_TEST);

  // Map
  gl.enable(gl.SCISSOR_TEST);
  var tempViewAngle = viewAngle;
  viewAngle = 120;
  gl.viewport(500, 500, gl.viewportWidth - 500, gl.viewportHeight - 500);
  gl.scissor(500, 500, gl.viewportWidth - 500, gl.viewportHeight - 500);
  gl.clearColor(0.05, 0.25, 0.05, 0.5);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  draw();
  viewAngle = tempViewAngle;
  gl.disable(gl.SCISSOR_TEST);
}

/**
 * A generic draw function which handles static and hierarchy drawing.
 */
function draw() {
  var mStack = [];
  var model = mat4.create();
  model = mat4.identity(model);
  root.traverse(mStack, model);
  drawMaze();
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

  var theta = degToRad(diffX / 5.0)
  root.search(which_object).rotate(theta);

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
 * d: translates the matrices by 0.1 on the local x-axis
 * a: translates the matrices by -0.1 on the local x-axis
 * w: translates the matrices by 0.1 on the local y-axis
 * s: translates the matrices by -0.1. on the local y-axis
 * e: scales the matrices by 1.05
 * q: scales the matrices by 0.95
 * 1: moves the camera up
 * 2: moves the camera down
 * 3: moves the camera left
 * 4: moves the camera right
 * 5: reduces the camera viewing angle
 * 6: expands the camera viewing angle
 *
 * @param event some keyboard event
 */
function onKeyDown(event) {
  switch (event.keyCode) {
    case 65: // a
      root.search(which_object).translate([-0.1, 0, 0]);
      break;
    case 68: // d
      root.search(which_object).translate([0.1, 0, 0]);
      break;
    case 87: // w
      root.search(which_object).translate([0.0, 0.1, 0]);
      break;
    case 83: // s
      root.search(which_object).translate([0.0, -0.1, 0]);
      break;
    case 81: // q
      root.search(which_object).scale([0.95, 0.95, 0.95]);
      break;
    case 69: // e
      root.search(which_object).scale([1.05, 1.05, 1.05]);
      break;
    case 49: // 1
      coi[1] += .05;
      break;
    case 50: // 2
      coi[1] -= .05;
      break;
    case 51: // 3
      coi[0] -= .05;
      break;
    case 52: // 4
      coi[0] += .05;
      break;
    case 53: // 5
      viewAngle -= 1;
      break;
    case 54: // 6
      viewAngle += 1;
      break;
  }
  drawScene();
}

/**
 * Initializes the canvas, and sets the scene.
 */
function webGLStart() {
  var canvas = document.getElementById("lab02-canvas");
  initGL(canvas);
  initShaders();

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");

  initBuffers();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  document.addEventListener('mousedown', onDocumentMouseDown, false);
  document.addEventListener('keydown', onKeyDown, false);

  root.reset();
  drawScene();
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
  root.reset();
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
