var vertexShaderSrc = `
  attribute vec3 aVertexPosition;

  void main(void) {
    gl_Position = vec4(aVertexPosition, 1.0);
  }
`;

var fragmentShaderSrc = `
  precision mediump float;

  void main(void) {
    gl_FragColor = vec4(1,0,0,1);
  }
`;
