var gl;
var shaderProgram;
var draw_type = 2;
var use_texture = 0;

var scene;
var plane;

var lastMouseX = 0;
var lastMouseY = 0;

var keys = new Map();

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
 * A keyboard event which manipulates the matrices for translation and
 * scaling depending on the key pressed.
 *
 * d: translates the plane right
 * a: translates the plane left
 *
 * @param event some keyboard event
 */
function onKeyDown(event) {
  keys.set(event.keyCode, true);
  switch(event.keyCode) {
    case 32: // space
    case 83: // s
      keys.set(event.keyCode, false);
      scene.fire(plane);
      break;
  }
}

/**
 * Sets the animation for lifting key.
 */
function onKeyUp(event) {
  keys.set(event.keyCode, false);
}

/**
 * Filters a map for all keys which have a true value
 */
function getTrueMap() {
  const trueMap = new Map(
    [...keys]
    .filter(([k, v]) => v == true)
  );
  return trueMap;
}

/**
 * Executes all functionality based on current keys pressed.
 */
function executeCurrentKeys() {
  var id = window.setInterval(function() {
    var trueMap = getTrueMap();

    if (trueMap.size != 0) {
      for (var key of trueMap.keys()) {
        switch (key) {
          case 68: // d
            moveRight(plane);
            break;
          case 65: // a
            moveLeft(plane);
            break;
        }
      }
    } else {
      level(plane);
    }

  }, 50)

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
async function webGLStart() {
  var canvas = document.getElementById("code13-canvas");
  var progressBar = document.getElementById("prog");
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
  document.addEventListener('keydown', onKeyDown, false);
  document.addEventListener('keyup', onKeyUp, false);

  scene = await generateScene(progressBar);
  progressBar.parentNode.removeChild(progressBar);
  scene.initialize();
  executeCurrentKeys();
  scheduleDraw(scene);
}

/**
 * A periodic drawing function.
 */
function scheduleDraw(scene) {
  window.setInterval(function() {
    scene.draw();
  }, 50);
}

/**
 * A function which moves the plane left.
 */
function moveLeft(parent) {
  if (parent.location[0] > -1) {
    parent.moveObject(-.01, 0, 0);
    if (parent.rotation[1] < degToRad(200)) {
      parent.rotateObject(0, 1, 0);
    }
  }
  scene.setCamera(parent);
}

/**
 * A function which moves the plane left.
 */
function moveRight(parent) {
  if (parent.location[0] < 1) {
    parent.moveObject(.01, 0, 0);
    if (parent.rotation[1] > degToRad(160)) {
      parent.rotateObject(0, -1, 0);
    }
  }
  scene.setCamera(parent);
}

/**
 * Levels the plane.
 */
function level(parent) {
  if (parent.rotation[1] > degToRad(180)) {
    parent.rotateObject(0, -1, 0);
    parent.moveObject(-.005, 0, 0);
    scene.setCamera(parent);
  } else if (parent.rotation[1] < degToRad(180)) {
    parent.rotateObject(0, 1, 0);
    parent.moveObject(.005, 0, 0);
    scene.setCamera(parent);
  }
}

/**
 * A function for controlling the progress bar.
 */
function setProgress(progressBar, progress, target) {
  progressBar.children[0].style.width = progress + "%";
  progressBar.setAttribute("data-label", "Loading " + target + "...");
}

/**
 * An image loading function.
 */
function loadImage(url) {
  console.log(`Loading ${url}`);
  var promise = new Promise((resolve, reject) => {
    let img = new Image();
    img.addEventListener('load', e => resolve(img));
    img.addEventListener('error', () => {
      reject(new Error(`Failed to load image's URL: ${url}`));
    });
    img.crossOrigin = "anonymous";
    img.src = url;
  });
  return promise;
}

/**
 * A helper method for preloading images.
 */
async function loadImageProgressWrapper(urls, progressBar) {
  var images = {};
  for (var i = 0; i < urls.length; i++) {
    var progress = 100 - 100 / (i + 1);
    setProgress(progressBar, progress, urls[i]);
    let image = await loadImage(urls[i]);
    images[urls[i]] = image;
  }
  return images;
}

/**
 * A scene generation function.
 */
async function generateScene(progressBar) {
  var scene = new Scene();

  var textureImages = [
    "Textures/camo.png",
    "Textures/fire.png",
    "Textures/wood.png",
    "Textures/morning_rt.png",
    "Textures/morning_lf.png",
    "Textures/morning_up.png",
    "Textures/morning_dn.png",
    "Textures/morning_ft.png",
    "Textures/morning_bk.png"
  ]

  scene.loadedImages = await loadImageProgressWrapper(textureImages, progressBar);

  setProgress(progressBar, 0, "plane");
  plane = await scene.addObject("Objects/plane.json", false, "Textures/camo.png");
  plane
    .setLocation([0, 0, 0])
    .setRotation([degToRad(90), degToRad(180), 0])
    .setScale([1 / 500, 1 / 500, 1 / 500]);

  setProgress(progressBar, 10, "right environment wall");
  let rightWall = await scene.addObject("Objects/quad.json", true, "Textures/morning_rt.png");
  rightWall
    .setLocation([2, 0, 0])
    .setRotation([0, degToRad(270), degToRad(180)])
    .setScale([4, 4, 4]);

  setProgress(progressBar, 20, "left environment wall");
  let leftWall = await scene.addObject("Objects/quad.json", true, "Textures/morning_lf.png");
  leftWall
    .setLocation([-2, 0, 0])
    .setRotation([0, degToRad(-270), degToRad(180)])
    .setScale([4, 4, 4]);

  setProgress(progressBar, 30, "top environment wall");
  let topWall = await scene.addObject("Objects/quad.json", true, "Textures/morning_up.png");
  topWall
    .setLocation([0, 2, 0])
    .setRotation([degToRad(-270), 0, 0])
    .setScale([4, 4, 4]);

  setProgress(progressBar, 40, "bottom environment wall");
  let bottomWall = await scene.addObject("Objects/quad.json", true, "Textures/morning_dn.png");
  bottomWall
    .setLocation([0, -2, 0])
    .setRotation([degToRad(270), 0, 0])
    .setScale([4, 4, 4]);

  setProgress(progressBar, 50, "front environment wall");
  let frontWall = await scene.addObject("Objects/quad.json", true, "Textures/morning_ft.png");
  frontWall
    .setLocation([0, 0, -2])
    .setRotation([0, 0, degToRad(180)])
    .setScale([4, 4, 4]);

  setProgress(progressBar, 60, "back environment wall");
  let backWall = await scene.addObject("Objects/quad.json", true, "Textures/morning_bk.png");
  backWall
    .setLocation([0, 0, 2])
    .setRotation([0, degToRad(180), degToRad(180)])
    .setScale([4, 4, 4]);

  let boat = await scene.addObject("Objects/boat.json", true, "Textures/wood.png");
  boat
    .setLocation([0, -2, -1.5])
    .setScale([1/9, 1/9, 1/9])
    .setAnimation(boatAnimation);

  setProgress(progressBar, 70, "projectiles");
  await scene.populateBullets("Objects/bullet.json", "Textures/fire.png");
  setProgress(progressBar, 85, "camera");
  scene.setCamera(plane);
  setProgress(progressBar, 100, "scene");

  return scene;
}

function boatAnimation(object) {
  boatMove(object, .005);
}

function boatMove(object, dir) {
  var id = window.setInterval(function() {
    if (dir > 0) {
      if (object.location[0] < 1) {
        object.moveObject(dir, 0, 0);
      } else {
        boatMove(object, -.005);
        window.clearInterval(id);
      }
    } else {
      if (object.location[0] > -1) {
        object.moveObject(dir, 0, 0);
      } else {
        boatMove(object, .005);
        window.clearInterval(id);
      }
    }
  }, 50);
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
