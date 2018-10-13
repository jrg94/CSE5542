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

  varying vec4 eye_pos;  //vertex position in eye space
  varying vec3 v_normal;  // vertex normal
  varying vec4 vColor;

  void main(void) {

    // transform light pos from local to eye space
    vec4 light_pos_in_eye = light_pos;

    // transform normal from local to eye space: normal matrix is the inverse transpose of the modelview matrix
    v_normal =normalize(vec3(uNMatrix*vec4(aVertexNormal,1.0)));

    // transform the vertex position to eye space
    eye_pos = uVMatrix*uMMatrix*vec4(aVertexPosition, 1.0);

    // light vector L = l-p
    vec3 light_vector = normalize(vec3(light_pos_in_eye - eye_pos));

    // eye vector V = e-p, where e is (0,0,0)
    vec3 eye_vector = normalize(-vec3(eye_pos));

    // halfway vector (L+V)
    vec3 halfv = normalize(light_vector+eye_vector);

    vec4 ambient = ambient_coef * light_ambient;
    float ndotl = max(dot(v_normal, light_vector), 0.0);

    vec4 diffuse = diffuse_coef * light_diffuse * ndotl;

    vec3 R = normalize(2.0 * ndotl * v_normal - eye_vector);
    float rdotv = max(dot(R, eye_vector), 0.0);

    vec4 specular;
    if (ndotl > 0.0) {
      specular = specular_coef * light_specular * pow(rdotv, mat_shininess);
    } else {
      specular = vec4(0, 0, 0, 1);
    }

    gl_Position = uPMatrix * uVMatrix * uMMatrix * vec4(aVertexPosition, 1.0);

    vColor = ambient + diffuse + specular;
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
