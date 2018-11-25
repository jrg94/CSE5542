var gl;
var shaderProgram;
var draw_type = 2;
var use_texture = 0;

var scene;

var lastMouseX = 0;
var lastMouseY = 0;

/**
 * Initializes the gl context.
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
 * A helper function for computing degrees to radians.
 *
 * @param degrees an integer denoting degrees
 */
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

/**
 * Binds listeners to mouse event.
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
 * Uses listeners on mouse event.
 */
function onDocumentMouseMove(event) {
  var mouseX = event.clientX;
  var mouseY = event.clientY;

  var diffX = mouseX - lastMouseX;
  var diffY = mouseY - lastMouseY;

  lastMouseX = mouseX;
  lastMouseY = mouseY;

  scene.draw()
}

/**
 * Removes listeners on mouse event.
 */
function onDocumentMouseUp(event) {
  document.removeEventListener('mousemove', onDocumentMouseMove, false);
  document.removeEventListener('mouseup', onDocumentMouseUp, false);
  document.removeEventListener('mouseout', onDocumentMouseOut, false);
}

/**
 * Removes listeners on mouse event.
 */
function onDocumentMouseOut(event) {
  document.removeEventListener('mousemove', onDocumentMouseMove, false);
  document.removeEventListener('mouseup', onDocumentMouseUp, false);
  document.removeEventListener('mouseout', onDocumentMouseOut, false);
}

/**
 * Sets up the scene for drawing.
 */
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

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  document.addEventListener('mousedown', onDocumentMouseDown, false);

  scene = generateScene();
  scheduleDraw(scene);
}

/**
 * A periodic drawing function.
 */
function scheduleDraw(scene) {
  window.setInterval(function(){
    scene.draw();
  }.bind(this), 50);
}

/**
 * A plane animation function.
 */
function animate(parent) {
  window.setInterval(function(){
    moveLeft(parent);
    scene.setCamera(parent);
  }.bind(this), 100);
}

function moveLeft(parent) {
  if (parent.location[0] > -1) {
    parent.moveObject(-.01, 0, 0);

    if (parent.rotation[1] < degToRad(200)) {
      parent.rotateObject(0, 1, 0);
    }
  } else if (parent.rotation[1] != degToRad(180)){
    parent.rotateObject(0, -1, 0);
  }
}

/**
 * A scene generation function.
 */
function generateScene() {
  var scene = new Scene();

  var plane = scene
    .addObject("Objects/plane.json", false, "Textures/camo.png")
    .setLocation([0, 0, 0])
    .setRotation([degToRad(90), degToRad(180), 0])
    .setScale([1 / 500, 1 / 500, 1 / 500])
    .setAnimation(animate);

  scene
    .addObject("Objects/quad.json", true, "Textures/morning_rt.png")
    .setLocation([2, 0, 0])
    .setRotation([0, degToRad(270), degToRad(180)])
    .setScale([4, 4, 4]);
  scene
    .addObject("Objects/quad.json", true, "Textures/morning_lf.png")
    .setLocation([-2, 0, 0])
    .setRotation([0, degToRad(-270), degToRad(180)])
    .setScale([4, 4, 4]);
  scene
    .addObject("Objects/quad.json", true, "Textures/morning_up.png")
    .setLocation([0, 2, 0])
    .setRotation([degToRad(-270), 0, 0])
    .setScale([4, 4, 4]);
  scene
    .addObject("Objects/quad.json", true, "Textures/morning_dn.png")
    .setLocation([0, -2, 0])
    .setRotation([degToRad(270), 0, 0])
    .setScale([4, 4, 4]);
  scene
    .addObject("Objects/quad.json", true, "Textures/morning_ft.png")
    .setLocation([0, 0, -2])
    .setRotation([0, 0, degToRad(180)])
    .setScale([4, 4, 4]);
  scene
    .addObject("Objects/quad.json", true, "Textures/morning_bk.png")
    .setLocation([0, 0, 2])
    .setRotation([0, degToRad(180), degToRad(180)])
    .setScale([4, 4, 4]);

  scene.setCamera(plane);

  return scene;
}

/**
 * A function for setting the background color.
 */
function BG(red, green, blue) {
  gl.clearColor(red, green, blue, 1.0);
  scene.draw();
}

/**
 * A function for redrawing the scene.
 */
function redraw() {
  scene.draw();
}

/**
 * A function for setting the draw type
 */
function drawType(type) {
  draw_type = type;
  scene.draw();
}

/**
 * A function for setting the active texture.
 */
function texture(value) {
  use_texture = value;
  scene.draw();
}
