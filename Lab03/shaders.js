// The vertex shader
var vertexShaderSrc = `
  attribute vec3 aVertexPosition;
  attribute vec4 aVertexColor;
  varying vec4 vColor;

  uniform mat4 uMVMatrix;
  uniform mat4 uPMatrix;

  void main(void) {

    gl_PointSize = 10.0;
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);

    vColor = aVertexColor;
  }
`;

// The fragment shader
var fragmentShaderSrc = `
  precision mediump float;

  uniform mat4 uMMatrix;
  uniform mat4 uVMatrix;
  uniform mat4 uPMatrix;
  uniform mat4 uNMatrix;

  uniform vec4 light_pos;
  uniform vec4 ambient_coef;
  uniform vec4 diffuse_coef;
  uniform vec4 specular_coef;
  uniform float mat_shininess;

  uniform vec4 light_ambient;
  uniform vec4 light_diffuse;
  uniform vec4 light_specular;

  varying vec4 eye_pos;
  varying vec3 v_normal;
  varying vec4 vColor;

  void main(void) {
    gl_FragColor = vColor;
  }
`;
