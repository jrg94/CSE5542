var gl;
var shaderProgram;
var draw_type = 2;
var Z_angle = 0.0;
var lastMouseX = 0;
var lastMouseY = 0;
var scene;

/**
 * A scene object.
 */
function Scene() {
  this.objects = [];
  this.lights = [];

  this.drawScene = function() {
    this.lights.forEach(function(light) {
      light.emit();
    });
    this.objects.forEach(function(object) {
      object.draw();
    });
  }

  this.initBuffers = function() {
    this.objects.forEach(function(object) {
      object.initBuffers();
    });

    this.lights.forEach(function(light) {
      light.lightObject.initBuffers();
    })
  }
}

/**
 * Generates a transformation object.
 */
function Transformation(translation = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  this.translation = translation;
  this.rotation = rotation;
  this.scale = scale;
}

/**
 * Generates a material object.
 */
function Material(ambient = [0, 0, 1, 1], diffuse = [1, 1, 0, 1], specular = [.9, .9, .9, 1], shininess = 50) {
  this.ambient = ambient;
  this.diffuse = diffuse;
  this.specular = specular;
  this.shininess = shininess;
}

/**
 * Generates a light object.
 */
function Light(transformation = new Transformation, emitter = new Material()) {
  this.transformation = transformation;
  this.emitter = emitter;
  this.lightObject = initSphere(50, 50, .2, transformation, emitter);

  this.emit = function() {
    gl.uniform4f(
      shaderProgram.light_posUniform,
      this.transformation.translation[0],
      this.transformation.translation[1],
      this.transformation.translation[2],
      this.transformation.translation[3]
    );
    gl.uniform4f(
      shaderProgram.light_ambientUniform,
      this.emitter.ambient[0],
      this.emitter.ambient[1],
      this.emitter.ambient[2],
      1.0
    );
    gl.uniform4f(
      shaderProgram.light_diffuseUniform,
      this.emitter.diffuse[0],
      this.emitter.diffuse[1],
      this.emitter.diffuse[2],
      1.0
     );
    gl.uniform4f(
      shaderProgram.light_specularUniform,
      this.emitter.specular[0],
      this.emitter.specular[1],
      this.emitter.specular[2],
      1.0
     );

    this.lightObject.draw();
  }
}

/**
 * Generates a geometry object.
 */
function Geometry(transformation = new Transformation(), material = new Material()) {
  this.verts = [];
  this.normals = [];
  this.indices = [];
  this.positionBuffer = null;
  this.normalBuffer = null;
  this.indexBuffer = null;
  this.mat_ambient = material.ambient;
  this.mat_diffuse = material.diffuse;
  this.mat_specular = material.specular;
  this.mat_shine = [material.shininess];
  this.mMatrix = mat4.create(); // model matrix
  this.vMatrix = mat4.create(); // view matrix
  this.pMatrix = mat4.create(); //projection matrix
  this.nMatrix = mat4.create(); // normal matrix
  this.location = transformation.translation;
  this.rotation = transformation.rotation;
  this.scale = transformation.scale;

  this.initArrayBuffer = function(buffer, data, itemSize) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    buffer.itemSize = itemSize;
    buffer.numItems = data.length / itemSize;
  }

  this.initElementArrayBuffer = function(buffer, data, itemSize) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), gl.STATIC_DRAW);
    buffer.itemsize = itemSize;
    buffer.numItems = data.length / itemSize;
  }

  this.initBuffers = function() {
    this.positionBuffer = gl.createBuffer();
    this.initArrayBuffer(this.positionBuffer, this.verts, 3);
    this.normalBuffer = gl.createBuffer();
    this.initArrayBuffer(this.normalBuffer, this.normals, 3)
    this.indexBuffer = gl.createBuffer();
    this.initElementArrayBuffer(this.indexBuffer, this.indices, 1);
  }

  this.transform = function() {
    this.pMatrix = mat4.perspective(60, 1.0, 0.1, 100, this.pMatrix); // set up the projection matrix
    this.vMatrix = mat4.lookAt([0, 0, 5], [0, 0, 0], [0, 1, 0], this.vMatrix); // set up the view matrix, multiply into the modelview matrix

    mat4.identity(this.mMatrix);
    this.mMatrix = mat4.translate(this.mMatrix, this.location);
    this.mMatrix = mat4.rotate(this.mMatrix, degToRad(Z_angle), [0, 1, 1]); // now set up the model matrix
    this.mMatrix = mat4.scale(this.mMatrix, this.scale);

    mat4.identity(this.nMatrix);
    this.nMatrix = mat4.multiply(this.nMatrix, this.vMatrix);
    this.nMatrix = mat4.multiply(this.nMatrix, this.mMatrix);
    this.nMatrix = mat4.inverse(this.nMatrix);
    this.nMatrix = mat4.transpose(this.nMatrix);
  }

  this.setMatrixUniforms = function() {
    gl.uniformMatrix4fv(shaderProgram.mMatrixUniform, false, this.mMatrix);
    gl.uniformMatrix4fv(shaderProgram.vMatrixUniform, false, this.vMatrix);
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, this.pMatrix);
    gl.uniformMatrix4fv(shaderProgram.nMatrixUniform, false, this.nMatrix);
  }

  this.setMaterialProperties = function() {
    gl.uniform4f(shaderProgram.ambient_coefUniform, this.mat_ambient[0], this.mat_ambient[1], this.mat_ambient[2], 1.0);
    gl.uniform4f(shaderProgram.diffuse_coefUniform, this.mat_diffuse[0], this.mat_diffuse[1], this.mat_diffuse[2], 1.0);
    gl.uniform4f(shaderProgram.specular_coefUniform, this.mat_specular[0], this.mat_specular[1], this.mat_specular[2], 1.0);
    gl.uniform1f(shaderProgram.shininess_coefUniform, this.mat_shine[0]);
  }

  this.draw = function() {
    this.transform();
    this.setMaterialProperties();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.positionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, this.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    this.setMatrixUniforms(); // pass the modelview mattrix and projection matrix to the shader

    if (draw_type == 1) {
      gl.drawArrays(gl.LINE_LOOP, 0, this.positionBuffer.numItems);
    } else if (draw_type == 0) {
      gl.drawArrays(gl.POINTS, 0, this.positionBuffer.numItems);
    } else if (draw_type == 2) {
      gl.drawElements(gl.TRIANGLES, this.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
  }
}

/**
 * A helper function to group all scene initialization.
 */
function initScene() {
  // Lights
  var lightTransformation = new Transformation([0, 10, 0, 1]);
  var lightEmitter = new Material([0, 0, 0, 1], [.8, .8, .8, 1], [1, 1, 1, 1])
  var light = new Light(lightTransformation, lightEmitter);

  // Objects
  var cylinderTransformation = new Transformation([-1, 0, 0], undefined, [.5, .5, .5]);
  var cylinderMaterial = new Material([0, 1, 0], [1, 0, 1, 1], [.5, .5, .5, 1], 10);
  var cylinder = initCylinder(50, 50, cylinderTransformation, cylinderMaterial);
  var cubeTransformation = new Transformation([1, 1, 0]);
  var cubeMaterial = new Material([0, 1, 0], [1, 0, 1, 1]);
  var cube = initCube(cubeTransformation, cubeMaterial);
  var sphereTransformation = new Transformation([1, -1, 0]);
  var sphereMaterial = new Material([0, 1, 0], [0, 0, 1, 1], undefined, 5);
  var sphere = initSphere(50, 50, 1, sphereTransformation, sphereMaterial);

  scene = new Scene();
  scene.objects.push(cylinder);
  scene.objects.push(cube);
  scene.objects.push(sphere);
  scene.lights.push(light);
  scene.initBuffers();
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

/**
 * Initializes the canvas and several other fields.
 */
function webGLStart() {
  var canvas = document.getElementById("code03-canvas");
  initGL(canvas);
  initShaders();

  gl.enable(gl.DEPTH_TEST);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

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

  initScene();

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
function initCylinder(nslices, nstacks, transformation, material) {
  var cylinder = new Geometry(transformation);
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
 * Generates a cube.
 */
function initCube(transformation, material) {
  var cube = new Geometry(transformation, material);

  var a = [0.5, 0.5, -0.5];
  var b = [-0.5, 0.5, -0.5];
  var c = [-0.5, -0.5, -0.5];
  var d = [0.5, -0.5, -0.5];
  var e = [0.5, 0.5, 0.5];
  var f = [-0.5, 0.5, 0.5];
  var g = [-0.5, -0.5, 0.5];
  var h = [0.5, -0.5, 0.5];

  initCubeSide(cube, a, b, c, d, [0, 0, -1]);
  initCubeSide(cube, e, f, g, h, [0, 0, 1]);
  initCubeSide(cube, b, c, g, f, [-1, 0, 0]);
  initCubeSide(cube, a, d, h, e, [1, 0, 0]);
  initCubeSide(cube, a, b, f, e, [0, 1, 0]);
  initCubeSide(cube, c, d, h, g, [0, -1, 0]);

  for (var i = 0; i < 6; i++) {
    cube.indices.push(i * 4);
    cube.indices.push(i * 4 + 1);
    cube.indices.push(i * 4 + 2);
    cube.indices.push(i * 4);
    cube.indices.push(i * 4 + 2);
    cube.indices.push(i * 4 + 3);
  }

  return cube;
}

/**
 * A helper method for generating cube faces.
 */
function initCubeSide(cube, v1, v2, v3, v4, normal) {
  cube.verts.push(...v1);
  cube.verts.push(...v2);
  cube.verts.push(...v3);
  cube.verts.push(...v4);
  cube.normals.push(...normal);
  cube.normals.push(...normal);
  cube.normals.push(...normal);
  cube.normals.push(...normal);
}

/**
 * Generates a sphere object.
 * Adapted from: http://learningwebgl.com/blog/?p=1253
 */
function initSphere(nslices, nstacks, radius, transformation, material) {
  var sphere = new Geometry(transformation, material);

  for (var i = 0; i <= nstacks; i++) {
    var theta = i * Math.PI / nstacks;
    var sinTheta = Math.sin(theta);
    var cosTheta = Math.cos(theta);

    for (var j = 0; j <= nslices; j++) {
      var phi = j * 2 * Math.PI / nslices;
      var sinPhi = Math.sin(phi);
      var cosPhi = Math.cos(phi);

      var x = cosPhi * sinTheta;
      var y = cosTheta;
      var z = sinPhi * sinTheta;

      sphere.normals.push(x);
      sphere.normals.push(y);
      sphere.normals.push(z);
      sphere.verts.push(radius * x);
      sphere.verts.push(radius * y);
      sphere.verts.push(radius * z);
    }
  }

  for (var i = 0; i < nstacks; i++) {
    for (var j = 0; j < nslices; j++) {
      var v1 = (i * (nslices + 1)) + j;
      var v2 = v1 + nslices + 1;

      sphere.indices.push(v1);
      sphere.indices.push(v2);
      sphere.indices.push(v1 + 1);

      sphere.indices.push(v2);
      sphere.indices.push(v2 + 1);
      sphere.indices.push(v1 + 1);
    }
  }
  return sphere;
}

/**
 * Computes radians from degrees.
 */
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

/**
 * Draws the scene.
 */
function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  scene.drawScene();
}

/**
 * Sets the event listeners on mouse down.
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
 * Calculates the mouse displacement on mouse move.
 */
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
