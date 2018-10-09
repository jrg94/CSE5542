var gl;
var shaderProgram;
var draw_type = 2;

// Lighting parameters
var light_ambient = [0, 0, 0, 1];
var light_diffuse = [.8, .8, .8, 1];
var light_specular = [1, 1, 1, 1];
var light_pos = [0, 0, 0, 1]; // eye space position

// Material parameters
var mat_ambient = [0, 0, 0, 1];
var mat_diffuse = [1, 1, 0, 1];
var mat_specular = [.9, .9, .9, 1];
var mat_shine = [50];

// Square buffers
var squareVertexPositionBuffer;
var squareVertexColorBuffer;
var squareVertexIndexBuffer;

// Cylinder Buffers
var cylinderVertexPositionBuffer;
var cylinderVertexNormalBuffer;
var cylinderVertexColorBuffer;
var cylinderVertexIndexBuffer;

// Matrices
var mMatrix = mat4.create(); // model matrix
var vMatrix = mat4.create(); // view matrix
var pMatrix = mat4.create(); //projection matrix
var nMatrix = mat4.create(); // normal matrix
var Z_angle = 0.0;

/**
 * Generates a geometry object.
 */
function Geometry() {
  this.verts = [];
  this.normals = [];
  this.colors = [];
  this.indices = [];
}

/**
 * Initializes the graphics context.
 *
 * @param canvas a canvas object
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

function webGLStart() {
  var canvas = document.getElementById("code03-canvas");
  initGL(canvas);
  initShaders();

  gl.enable(gl.DEPTH_TEST);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

  shaderProgram.mMatrixUniform = gl.getUniformLocation(shaderProgram, "uMMatrix");
  shaderProgram.vMatrixUniform = gl.getUniformLocation(shaderProgram, "uVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");

  shaderProgram.light_posUniform = gl.getUniformLocation(shaderProgram, "light_pos");
  shaderProgram.ambient_coefUniform = gl.getUniformLocation(shaderProgram, "ambient_coef");
  shaderProgram.diffuse_coefUniform = gl.getUniformLocation(shaderProgram, "diffuse_coef");
  shaderProgram.specular_coefUniform = gl.getUniformLocation(shaderProgram, "specular_coef");
  shaderProgram.shininess_coefUniform = gl.getUniformLocation(shaderProgram, "mat_shininess");

  shaderProgram.light_ambientUniform = gl.getUniformLocation(shaderProgram, "light_ambient");
  shaderProgram.light_diffuseUniform = gl.getUniformLocation(shaderProgram, "light_diffuse");
  shaderProgram.light_specularUniform = gl.getUniformLocation(shaderProgram, "light_specular");

  initSQBuffers();
  initCYBuffers(10, 50);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  document.addEventListener('mousedown', onDocumentMouseDown, false);

  drawScene();
}

/**
 * Creates a cylinder geometry.
 *
 * @param {number} nslices the number of vertical slices
 * @param {number} nstacks the number of circular stacks
 * @param {number} r the red value
 * @param {number} g the green value
 * @param {number} b the blue value
 */
function InitCylinder(nslices, nstacks, r, g, b) {
  var cylinder = new Geometry();
  var nvertices = nslices * nstacks;

  var Dangle = 2 * Math.PI / (nslices - 1);

  for (j = 0; j < nstacks; j++) {
    for (i = 0; i < nslices; i++) {
      var idx = j * nslices + i; // mesh[j][i]
      var angle = Dangle * i;
      cylinder.verts.push(Math.cos(angle));
      cylinder.verts.push(Math.sin(angle));
      cylinder.verts.push(j * 3.0 / (nstacks - 1) - 1.5);

      cylinder.normals.push(Math.cos(angle));
      cylinder.normals.push(Math.sin(angle));
      cylinder.normals.push(0.0);

      cylinder.colors.push(Math.cos(angle));
      cylinder.colors.push(Math.sin(angle));
      cylinder.colors.push(j * 1.0 / (nstacks - 1));
      cylinder.colors.push(1.0);
    }
  }

  nindices = (nstacks - 1) * 6 * (nslices + 1);

  for (j = 0; j < nstacks - 1; j++) {
    for (i = 0; i <= nslices; i++) {
      var mi = i % nslices;
      var mi2 = (i + 1) % nslices;
      var idx = (j + 1) * nslices + mi;
      var idx2 = j * nslices + mi; // mesh[j][mi]
      var idx3 = (j) * nslices + mi2;
      var idx4 = (j + 1) * nslices + mi;
      var idx5 = (j) * nslices + mi2;
      var idx6 = (j + 1) * nslices + mi2;

      cylinder.indices.push(idx);
      cylinder.indices.push(idx2);
      cylinder.indices.push(idx3);
      cylinder.indices.push(idx4);
      cylinder.indices.push(idx5);
      cylinder.indices.push(idx6);
    }
  }

  return cylinder;
}

/**
 * Initializes cylinder buffers.
 *
 * @param {number} nslices the number of vertical cylinder slices
 * @param {number} nstacks the number of circular stacks
 */
function initCYBuffers(nslices, nstacks) {
  var cylinder = InitCylinder(nslices, nstacks, 1.0, 1.0, 0.0);

  cylinderVertexPositionBuffer = gl.createBuffer();
  initArrayBuffer(cylinderVertexPositionBuffer, cylinder.verts, 3);
  console.log("Positions: " + cylinderVertexPositionBuffer.numItems);

  cylinderVertexNormalBuffer = gl.createBuffer();
  initArrayBuffer(cylinderVertexNormalBuffer, cylinder.normals, 3)
  console.log("Normals: " + cylinderVertexNormalBuffer.numItems);

  cylinderVertexIndexBuffer = gl.createBuffer();
  initElementArrayBuffer(cylinderVertexIndexBuffer, cylinder.indices, 1);

  cylinderVertexColorBuffer = gl.createBuffer();
  initArrayBuffer(cylinderVertexColorBuffer, cylinder.colors, 4);
  console.log("Colors: " + cylinderVertexColorBuffer.numItems);
}

/**
 * A helper function for initializing an array buffer.
 *
 * @param buffer a gl buffer object
 * @param data a set of data--could be verts, colors, normals, etc.
 * @param itemSize the number of elements that constitute an item
 */
function initArrayBuffer(buffer, data, itemSize) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  buffer.itemSize = itemSize;
  buffer.numItems = data.length / itemSize;
}

/**
 * A helper function for initializing an element array buffer.
 *
 * @param buffer a gl buffer object
 * @param data a set of data--usually indices
 * @param itemSize the number of elements that constitute an item
 */
function initElementArrayBuffer(buffer, data, itemSize) {
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), gl.STATIC_DRAW);
  buffer.itemsize = itemSize;
  buffer.numItems = data.length / itemSize;
}

function InitSquare() {
  var square = new Geometry();

  square.verts = [
    0.5, 0.5, -.5,
    -0.5, 0.5, -.5,
    -0.5, -0.5, -.5,
    0.5, -0.5, -.5,
    0.5, 0.5, .5,
    -0.5, 0.5, .5,
    -0.5, -0.5, .5,
    0.5, -0.5, .5,

  ];

  square.indices = [
    0, 1, 2,
    0, 2, 3,
    0, 3, 7,
    0, 7, 4,
    6, 2, 3,
    6, 3, 7,
    5, 1, 2,
    5, 2, 6,
    5, 1, 0,
    5, 0, 4,
    5, 6, 7,
    5, 7, 4
  ];

  square.colors = [
    1.0, 0.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
  ];

  return square;
}


function initSQBuffers() {
  var square = InitSquare();

  squareVertexPositionBuffer = gl.createBuffer();
  initArrayBuffer(squareVertexPositionBuffer, square.verts, 3)

  squareVertexIndexBuffer = gl.createBuffer();
  initElementArrayBuffer(squareVertexIndexBuffer, square.indices, 1);

  squareVertexColorBuffer = gl.createBuffer();
  initArrayBuffer(squareVertexColorBuffer, square.colors, 4);
}

function setMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.mMatrixUniform, false, mMatrix);
  gl.uniformMatrix4fv(shaderProgram.vMatrixUniform, false, vMatrix);
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.nMatrixUniform, false, nMatrix);

}

function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

///////////////////////////////////////////////////////////////

function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  pMatrix = mat4.perspective(60, 1.0, 0.1, 100, pMatrix); // set up the projection matrix

  vMatrix = mat4.lookAt([0, 0, 5], [0, 0, 0], [0, 1, 0], vMatrix); // set up the view matrix, multiply into the modelview matrix

  mat4.identity(mMatrix);

  mMatrix = mat4.rotate(mMatrix, degToRad(Z_angle), [0, 1, 1]); // now set up the model matrix


  mat4.identity(nMatrix);
  nMatrix = mat4.multiply(nMatrix, vMatrix);
  nMatrix = mat4.multiply(nMatrix, mMatrix);
  nMatrix = mat4.inverse(nMatrix);
  nMatrix = mat4.transpose(nMatrix);

  shaderProgram.light_posUniform = gl.getUniformLocation(shaderProgram, "light_pos");


  gl.uniform4f(shaderProgram.light_posUniform, light_pos[0], light_pos[1], light_pos[2], light_pos[3]);
  gl.uniform4f(shaderProgram.ambient_coefUniform, mat_ambient[0], mat_ambient[1], mat_ambient[2], 1.0);
  gl.uniform4f(shaderProgram.diffuse_coefUniform, mat_diffuse[0], mat_diffuse[1], mat_diffuse[2], 1.0);
  gl.uniform4f(shaderProgram.specular_coefUniform, mat_specular[0], mat_specular[1], mat_specular[2], 1.0);
  gl.uniform1f(shaderProgram.shininess_coefUniform, mat_shine[0]);

  gl.uniform4f(shaderProgram.light_ambientUniform, light_ambient[0], light_ambient[1], light_ambient[2], 1.0);
  gl.uniform4f(shaderProgram.light_diffuseUniform, light_diffuse[0], light_diffuse[1], light_diffuse[2], 1.0);
  gl.uniform4f(shaderProgram.light_specularUniform, light_specular[0], light_specular[1], light_specular[2], 1.0);

  /*
        gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute,squareVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	*/

  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cylinderVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderVertexNormalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, cylinderVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderVertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, cylinderVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);


  // draw elementary arrays - triangle indices
  //  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareVertexIndexBuffer);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cylinderVertexIndexBuffer);

  setMatrixUniforms(); // pass the modelview mattrix and projection matrix to the shader

  if (draw_type == 1) gl.drawArrays(gl.LINE_LOOP, 0, cylinderVertexPositionBuffer.numItems);
  else if (draw_type == 0) gl.drawArrays(gl.POINTS, 0, cylinderVertexPositionBuffer.numItems);
  else if (draw_type == 2) gl.drawElements(gl.TRIANGLES, cylinderVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  /*
	if (draw_type ==1) gl.drawArrays(gl.LINE_LOOP, 0, squareVertexPositionBuffer.numItems);
        else if (draw_type ==0) gl.drawArrays(gl.POINTS, 0, squareVertexPositionBuffer.numItems);
	else if (draw_type==2) gl.drawElements(gl.TRIANGLES, squareVertexIndexBuffer.numItems , gl.UNSIGNED_SHORT, 0);
	*/

}


///////////////////////////////////////////////////////////////

var lastMouseX = 0,
  lastMouseY = 0;

///////////////////////////////////////////////////////////////

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

function onDocumentMouseMove(event) {
  var mouseX = event.clientX;
  var mouseY = event.ClientY;

  var diffX = mouseX - lastMouseX;
  var diffY = mouseY - lastMouseY;

  Z_angle = Z_angle + diffX / 5;

  lastMouseX = mouseX;
  lastMouseY = mouseY;

  drawScene();
}

/**
 * Removes all mouse listeners when the mouse is not clicked.
 */
function onDocumentMouseUp(event) {
  document.removeEventListener('mousemove', onDocumentMouseMove, false);
  document.removeEventListener('mouseup', onDocumentMouseUp, false);
  document.removeEventListener('mouseout', onDocumentMouseOut, false);
}

/**
 * Removes mouse listeners when mouse leaves the canvas.
 */
function onDocumentMouseOut(event) {
  document.removeEventListener('mousemove', onDocumentMouseMove, false);
  document.removeEventListener('mouseup', onDocumentMouseUp, false);
  document.removeEventListener('mouseout', onDocumentMouseOut, false);
}

/**
 * Sets the background color of the canvas
 */
function backgroundColor(red, green, blue) {
  gl.clearColor(red, green, blue, 1.0);
  drawScene();
}

/**
 * Redraws the scene
 */
function redraw() {
  Z_angle = 0;
  drawScene();
}

/**
 * Sets the geometry type for the scene.
 *
 * 0 - Points
 * 1 - Lines
 * 2 - Triangles
 *
 * @param {number} type the type of geometry
 */
function geometry(type) {
  draw_type = type;
  drawScene();
}
