var gl;
var shaderProgram;
var draw_type = 2;
var use_texture = 0;

var light_ambient = [0, 0, 0, 1];
var light_diffuse = [.8, .8, .8, 1];
var light_specular = [1, 1, 1, 1];
var light_pos = [0, 0, 0, 1]; // eye space position

var mat_ambient = [0, 0, 0, 1];
var mat_diffuse = [1, 1, 0, 1];
var mat_specular = [.9, .9, .9, 1];
var mat_shine = [50];

var mMatrix = mat4.create(); // model matrix
var vMatrix = mat4.create(); // view matrix
var pMatrix = mat4.create(); // projection matrix
var nMatrix = mat4.create(); // normal matrix
var v2wMatrix = mat4.create(); // eye space to world space matrix
var Z_angle = 0.0;

var scene;

var lastMouseX = 0;
var lastMouseY = 0;

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

function setMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.mMatrixUniform, false, mMatrix);
  gl.uniformMatrix4fv(shaderProgram.vMatrixUniform, false, vMatrix);
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.nMatrixUniform, false, nMatrix);
  gl.uniformMatrix4fv(shaderProgram.v2wMatrixUniform, false, v2wMatrix);
}

function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

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

  scene.draw()
}

function onDocumentMouseUp(event) {
  document.removeEventListener('mousemove', onDocumentMouseMove, false);
  document.removeEventListener('mouseup', onDocumentMouseUp, false);
  document.removeEventListener('mouseout', onDocumentMouseOut, false);
}

function onDocumentMouseOut(event) {
  document.removeEventListener('mousemove', onDocumentMouseMove, false);
  document.removeEventListener('mouseup', onDocumentMouseUp, false);
  document.removeEventListener('mouseout', onDocumentMouseOut, false);
}

function webGLStart() {
  var canvas = document.getElementById("code13-canvas");
  initGL(canvas);
  initShaders();

  gl.enable(gl.DEPTH_TEST);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.vertexTexCoordsAttribute = gl.getAttribLocation(shaderProgram, "aVertexTexCoords");
  gl.enableVertexAttribArray(shaderProgram.vertexTexCoordsAttribute);

  shaderProgram.mMatrixUniform = gl.getUniformLocation(shaderProgram, "uMMatrix");
  shaderProgram.vMatrixUniform = gl.getUniformLocation(shaderProgram, "uVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  shaderProgram.v2wMatrixUniform = gl.getUniformLocation(shaderProgram, "uV2WMatrix");

  shaderProgram.light_posUniform = gl.getUniformLocation(shaderProgram, "light_pos");
  shaderProgram.ambient_coefUniform = gl.getUniformLocation(shaderProgram, "ambient_coef");
  shaderProgram.diffuse_coefUniform = gl.getUniformLocation(shaderProgram, "diffuse_coef");
  shaderProgram.specular_coefUniform = gl.getUniformLocation(shaderProgram, "specular_coef");
  shaderProgram.shininess_coefUniform = gl.getUniformLocation(shaderProgram, "mat_shininess");

  shaderProgram.light_ambientUniform = gl.getUniformLocation(shaderProgram, "light_ambient");
  shaderProgram.light_diffuseUniform = gl.getUniformLocation(shaderProgram, "light_diffuse");
  shaderProgram.light_specularUniform = gl.getUniformLocation(shaderProgram, "light_specular");

  shaderProgram.textureUniform = gl.getUniformLocation(shaderProgram, "myTexture");
  shaderProgram.cube_map_textureUniform = gl.getUniformLocation(shaderProgram, "cubeMap");
  shaderProgram.use_textureUniform = gl.getUniformLocation(shaderProgram, "use_texture");

  scene = new Scene();
  scene.initJSON("Objects/plane.json");

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  document.addEventListener('mousedown', onDocumentMouseDown, false);

  scene.draw();
}

function BG(red, green, blue) {
  gl.clearColor(red, green, blue, 1.0);
  scene.draw();
}

function redraw() {
  Z_angle = 0;
  scene.draw();
}

function geometry(type) {
  draw_type = type;
  scene.draw();
}

function texture(value) {
  use_texture = value;
  scene.draw();
}
