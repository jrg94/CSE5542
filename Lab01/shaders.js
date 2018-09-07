var vertexShaderSrc = `
  attribute vec3 aVertexPosition;
  attribute vec4 aVertexColor;
  varying vec4 vColor;

  void main(void) {
    gl_Position = vec4(aVertexPosition, 1.0);
    vColor = aVertexColor;
  }
`;

var fragmentShaderSrc = `
  precision mediump float;
  verying vec4 vColor;

  void main(void) {
    gl_FragColor = vColor;
  }
`;
