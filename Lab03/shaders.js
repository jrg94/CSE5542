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
  varying vec4 vColor;

  void main(void) {
    gl_FragColor = vColor;
  }
`;
