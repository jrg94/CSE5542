// The vertex shader
var vertexShaderSrc = `
  precision mediump float;
  attribute vec3 aVertexPosition;
  attribute vec3 aVertexNormal;

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
  precision mediump int;

  uniform mat4 uMMatrix;    // model matrix
  uniform mat4 uVMatrix;    // view matrix
  uniform mat4 uPMatrix;    // projection matrix
  uniform mat4 uNMatrix;    // normal matrix
  uniform mat4 uV2WMatrix;  // eye to world

  uniform vec4 light_pos;
  uniform vec4 ambient_coef;
  uniform vec4 diffuse_coef;
  uniform vec4 specular_coef;
  uniform float mat_shininess;

  uniform vec4 light_ambient;
  uniform vec4 light_diffuse;
  uniform vec4 light_specular;

  uniform int use_texture;
  uniform sampler2D myTexture;
  uniform samplerCube cubeMap;

  varying vec4 eye_pos;
  varying vec3 v_normal;
  varying highp vec2 FtexCoord;
  varying vec4 vColor;

  void main(void) {

    vec4 texcolor;
    vec3 view_vector, ref;
    vec4 env_color = vec4(1,0,0,1);

    if ( use_texture == 1 ) {
      texcolor = texture2D(myTexture, FtexCoord);
      gl_FragColor = texcolor;
      // gl_FragColor = vColor*texcolor;
    } else if (use_texture == 2) {
       view_vector = normalize(vec3(vec4(0,0,0,1)-eye_pos));
       ref = normalize(reflect(-view_vector, v_normal));  // in eye space
       ref = vec3(uV2WMatrix*vec4(ref,0));   // convert to world space
       env_color = textureCube(cubeMap, ref);
       gl_FragColor = env_color;
       // gl_FragColor = vec4(ref, 1.0);
     } else {
       gl_FragColor = vColor;
     }
}
`;
