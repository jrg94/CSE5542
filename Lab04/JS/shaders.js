// The vertex shader
var vertexShaderSrc = `
  precision mediump float;
  precision mediump int;

  attribute vec3 aVertexPosition;
  attribute vec3 aVertexNormal;
  attribute vec2 aVertexTexCoords;
  attribute vec3 aVertexColor;

  uniform mat4 uMMatrix;
  uniform mat4 uVMatrix;
  uniform mat4 uPMatrix;
  uniform mat4 uNMatrix;
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

  varying vec4 eye_pos;  //vertex position in eye space
  varying vec3 v_normal;  // vertex normal
  varying highp vec2 FtexCoord;
  varying vec4 vColor;


  void main(void) {

    // transform light pos from local to eye space
    // vec4 light_pos_in_eye = uVMatrix * uMMatrix * light_pos;
    vec4 light_pos_in_eye = light_pos;

    // transform normal from local to eye space: normal matrix is the inverse transpose of the modelview matrix
    v_normal =normalize(vec3(uNMatrix*vec4(aVertexNormal,0.0)));

    // transform the vertex position to eye space
    eye_pos = uVMatrix*uMMatrix*vec4(aVertexPosition, 1.0);

    // light vector L = l-p
    vec3 light_vector = normalize(vec3(light_pos_in_eye - eye_pos));

    // eye vector V = e-p, where e is (0,0,0)
    vec3 eye_vector = normalize(-vec3(eye_pos));

    vec4 ambient = ambient_coef * light_ambient;
    float ndotl = max(dot(v_normal, light_vector), 0.0);

    vec4 diffuse = diffuse_coef * light_diffuse* ndotl;

    //      both lines below are okay. One is to use the reflect function the other is to compute by yourself
    //      vec3 R= normalize(vec3(reflect(-light_vector, v_normal)));
    vec3 R = normalize(2.0 * ndotl *v_normal-light_vector);
    float rdotv = max(dot(R, eye_vector), 0.0);


    vec4 specular;
    if (ndotl > 0.0) {
      specular = specular_coef* light_specular*pow(rdotv, mat_shininess);
    } else {
      specular = vec4(0,0,0,1);
    }

    vColor = ambient+diffuse+specular;

    FtexCoord = aVertexTexCoords;

    gl_Position = uPMatrix*uVMatrix*uMMatrix*vec4(aVertexPosition, 1.0);

    //      vColor = vec4(use_texture, use_texture, 0, 1.0);
    //      vColor = vec4(aVertexTexCoords, 1.0, 1.0);
    //      vColor = vec4(aVertexColor,1.0);
    //      vColor = vec4(aVertexNormal, 1.0);
    //      vColor = vec4(v_normal, 1.0);

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
