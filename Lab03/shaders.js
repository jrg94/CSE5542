// The vertex shader
var vertexShaderSrc = `
  precision mediump float;
  attribute vec3 aVertexPosition;
  attribute vec3 aVertexNormal;
  attribute vec4 aVertexColor;

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
  varying vec3 v_pos;

  void main(void) {
    gl_Position = uPMatrix * uVMatrix * uMMatrix * vec4(aVertexPosition, 1.0);
    vec4 v_pos4 = uVMatrix * uMMatrix * vec4(aVertexPosition, 1.0);
    v_pos = vec3(v_pos4) / v_pos4.w;
    v_normal = vec3(uNMatrix * vec4(aVertexNormal, 0.0));
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
