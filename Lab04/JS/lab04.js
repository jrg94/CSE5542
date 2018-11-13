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

var teapotVertexPositionBuffer;
var teapotVertexNormalBuffer;
var teapotVertexTextureCoordBuffer;
var teapotVertexIndexBuffer;

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

function drawScene() {

  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if (teapotVertexPositionBuffer == null || teapotVertexNormalBuffer == null || teapotVertexIndexBuffer == null) {
    return;
  }

  pMatrix = mat4.perspective(60, 1.0, 0.1, 100, pMatrix); // set up the projection matrix

  vMatrix = mat4.lookAt([0, 0, 5], [0, 0, 0], [0, 1, 0], vMatrix); // set up the view matrix, multiply into the modelview matrix

  mat4.identity(mMatrix);


  mMatrix = mat4.scale(mMatrix, [1 / 10, 1 / 10, 1 / 10]);

  mMatrix = mat4.rotate(mMatrix, degToRad(Z_angle), [0, 1, 1]); // now set up the model matrix

  mat4.identity(nMatrix);
  nMatrix = mat4.multiply(nMatrix, vMatrix);
  nMatrix = mat4.multiply(nMatrix, mMatrix);
  nMatrix = mat4.inverse(nMatrix);
  nMatrix = mat4.transpose(nMatrix);

  mat4.identity(v2wMatrix);
  v2wMatrix = mat4.multiply(v2wMatrix, vMatrix);
  v2wMatrix = mat4.transpose(v2wMatrix);

  shaderProgram.light_posUniform = gl.getUniformLocation(shaderProgram, "light_pos");

  gl.uniform4f(shaderProgram.light_posUniform, light_pos[0], light_pos[1], light_pos[2], light_pos[3]);
  gl.uniform4f(shaderProgram.ambient_coefUniform, mat_ambient[0], mat_ambient[1], mat_ambient[2], 1.0);
  gl.uniform4f(shaderProgram.diffuse_coefUniform, mat_diffuse[0], mat_diffuse[1], mat_diffuse[2], 1.0);
  gl.uniform4f(shaderProgram.specular_coefUniform, mat_specular[0], mat_specular[1], mat_specular[2], 1.0);
  gl.uniform1f(shaderProgram.shininess_coefUniform, mat_shine[0]);

  gl.uniform4f(shaderProgram.light_ambientUniform, light_ambient[0], light_ambient[1], light_ambient[2], 1.0);
  gl.uniform4f(shaderProgram.light_diffuseUniform, light_diffuse[0], light_diffuse[1], light_diffuse[2], 1.0);
  gl.uniform4f(shaderProgram.light_specularUniform, light_specular[0], light_specular[1], light_specular[2], 1.0);


  gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, teapotVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, teapotVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexTextureCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexTexCoordsAttribute, teapotVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);


  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotVertexIndexBuffer);

  setMatrixUniforms(); // pass the modelview mattrix and projection matrix to the shader
  gl.uniform1i(shaderProgram.use_textureUniform, use_texture);

  gl.activeTexture(gl.TEXTURE0); // set texture unit 0 to use
  gl.bindTexture(gl.TEXTURE_2D, scene.textures[0]); // bind the texture object to the texture unit
  gl.uniform1i(shaderProgram.textureUniform, 0); // pass the texture unit to the shader

  gl.activeTexture(gl.TEXTURE1); // set texture unit 1 to use
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, scene.textures[1]); // bind the texture object to the texture unit
  gl.uniform1i(shaderProgram.cube_map_textureUniform, 1); // pass the texture unit to the shader

  if (draw_type == 1) gl.drawArrays(gl.LINE_LOOP, 0, teapotVertexPositionBuffer.numItems);
  else if (draw_type == 0) gl.drawArrays(gl.POINTS, 0, teapotVertexPositionBuffer.numItems);
  else if (draw_type == 2) gl.drawElements(gl.TRIANGLES, teapotVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

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

  drawScene();
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

  //initJSON("Objects/plane.json");
  scene = new Geometry();
  scene.initJSON("Objects/plane.json");
  scene.initTexture("Textures/earth.png", false);
  scene.initTexture("Textures/brick.png", true);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  document.addEventListener('mousedown', onDocumentMouseDown, false);

  drawScene();
}

function BG(red, green, blue) {
  gl.clearColor(red, green, blue, 1.0);
  drawScene();
}

function redraw() {
  Z_angle = 0;
  drawScene();
}

function geometry(type) {
  draw_type = type;
  drawScene();
}

function texture(value) {
  use_texture = value;
  drawScene();
}
