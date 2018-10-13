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

  varying vec3 v_normal;
  varying vec3 v_pos;

  void main(void) {
    vec3 normal = normalize(v_normal);
    vec3 lightDir = normalize(vec3(light_pos) - v_pos);
    vec3 reflectDir = reflect(-lightDir, v_normal);
    vec3 viewDir = normalize(-v_pos);

    float lambertian = max(dot(lightDir, normal), 0.0);
    float spec = 0.0;

    if (lambertian > 0.0) {
       float specAngle = max(dot(reflectDir, viewDir), 0.0);
       spec = pow(specAngle, 4.0);
    }

    vec4 ambient = ambient_coef * light_ambient;
    vec4 diffuse = diffuse_coef * light_diffuse;
    vec4 specular = specular_coef * light_specular;
    vec4 color = ambient + lambertian * diffuse + spec * specular;
    gl_FragColor = color;
  }
`;
