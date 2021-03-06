// The vertex shader
var vertexShaderSrc = `
  precision mediump float;
  precision mediump int;

  attribute vec3 aVertexPosition;
  attribute vec3 aVertexNormal;
  attribute vec3 aVertexTangent;
  attribute vec2 aVertexTexCoords;

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
  uniform sampler2D myNormal;

  varying vec4 v_pos;  //vertex position in eye space
  varying vec3 v_normal;  // vertex normal
  varying vec3 v_light;
  varying vec3 v_view;
  varying highp vec2 FtexCoord;


  void main(void) {

    // transform light pos from local to eye space
    vec4 light_pos_in_eye = light_pos;

    // transform normal from local to eye space: normal matrix is the inverse transpose of the modelview matrix
    v_normal = normalize(vec3(uNMatrix * vec4(aVertexNormal, 0.0)));

    // tangent vector calculation
    vec3 v_tangent = normalize(vec3(uNMatrix * vec4(aVertexTangent, 0.0)));

    // binormal calculation
    vec3 binormal = normalize(cross(v_normal, v_tangent));

    // tangent space matrix
    mat3 toObjectLocal = mat3(
      v_tangent.x, binormal.x, v_normal.x,
      v_tangent.y, binormal.y, v_normal.y,
      v_tangent.z, binormal.z, v_normal.z
    );

    // transform the vertex position to eye space
    v_pos = uVMatrix * uMMatrix * vec4(aVertexPosition, 1.0);

    // light direction calculation
    v_light = normalize(toObjectLocal * vec3(light_pos_in_eye - v_pos));

    // view direction calculation
    v_view = toObjectLocal * vec3(normalize(-v_pos));

    // texture coordinates pass
    FtexCoord = aVertexTexCoords;

    // vertex position pass
    gl_Position = uPMatrix * uVMatrix * uMMatrix * vec4(aVertexPosition, 1.0);
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
  uniform sampler2D myNormal;

  varying vec4 v_pos;
  varying vec3 v_normal;
  varying vec3 v_light;
  varying vec3 v_view;
  varying highp vec2 FtexCoord;

  vec4 phongShading(vec3 normal, vec4 light_pos, vec4 v_pos, vec4 diffuse_coef, vec3 lightDir, vec3 viewDir) {
    vec3 reflectDir = reflect(-lightDir, normal);

    float lambertian = max(dot(lightDir, normal), 0.0);
    float spec = 0.0;

    if (lambertian > 0.0) {
       float specAngle = max(dot(reflectDir, viewDir), 0.0);
       spec = pow(specAngle, mat_shininess);
    }

    vec4 ambient = ambient_coef * light_ambient;
    vec4 diffuse = diffuse_coef * light_diffuse;
    vec4 specular = specular_coef * light_specular;
    vec4 color = ambient + lambertian * diffuse + spec * specular;

    return color;
  }

  void main(void) {
    if ( use_texture == 1 ) {
      vec4 texcolor = texture2D(myTexture, FtexCoord);
      gl_FragColor = texcolor;
    } else if (use_texture == 2) {
      vec3 view_vector = normalize(vec3(vec4(0,0,0,1) - v_pos));
      vec3 ref = normalize(reflect(-view_vector, v_normal));  // in eye space
      ref = vec3(uV2WMatrix * vec4(ref,0));   // convert to world space
      vec4 env_color = textureCube(cubeMap, ref);
      gl_FragColor = env_color;
    } else if (use_texture == 3) { // Bump map
      vec3 normal = 2.0 * texture2D(myNormal, FtexCoord).rgb - 1.0;
      normal = normalize (normal);
      vec4 material = texture2D(myTexture, FtexCoord);
      gl_FragColor = phongShading(normal, light_pos, v_pos, material, v_light, v_view);
    } else { // Phong lighting
      vec3 normal = normalize(v_normal);
      vec3 lightDir = normalize(vec3(light_pos - v_pos));
      vec3 viewDir = normalize(vec3(-v_pos));
      gl_FragColor = phongShading(normal, light_pos, v_pos, diffuse_coef, lightDir, viewDir);
    }
}
`;
