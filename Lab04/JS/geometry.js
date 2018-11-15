function Scene() {
  this.objects = [];

  this.addObject = function(file, isStatic, baseTexture) {
    var myObject = new Parent();
    this.objects.push(myObject);

    var request = new XMLHttpRequest();
    request.open("GET", file);
    request.onreadystatechange =
      function() {
        if (request.readyState == 4) {
          geometry = JSON.parse(request.responseText);
          this.handleLoadedGeometry(geometry, isStatic, baseTexture, myObject);
        }
      }.bind(this);
    request.send();

    return myObject;
  }

  this.handleLoadedGeometry = function(geometryData, isStatic, baseTexture, geometry) {
    for (var i = 0; i < geometryData.meshes.length; i++) {
      var child = new Geometry(isStatic);
      child.initTexture(baseTexture, false);
      var imageMap = [
        ["Textures/morning_rt.png", gl.TEXTURE_CUBE_MAP_POSITIVE_X],
        ["Textures/morning_lf.png", gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
        ["Textures/morning_up.png", gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
        ["Textures/morning_dn.png", gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
        ["Textures/morning_bk.png", gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
        ["Textures/morning_ft.png", gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]
      ]
      child.initTexture(imageMap, true);
      child.initBuffers(geometryData.meshes[i]);
      geometry.children.push(child);
    }
    geometry.initialize();
  }

  this.rotateObjects = function(diffX) {
    for (var i = 0; i < this.objects.length; i++) {
      this.objects[i].rotateObjects(diffX);
    }
  }

  this.rotateCamera = function(diffX, diffY) {
    for (var i = 0; i < this.objects.length; i++) {
      this.objects[i].rotateCamera(diffX, diffY);
    }
  }

  this.draw = function() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    for (var i = 0; i < this.objects.length; i++) {
      this.objects[i].draw();
    }
  }
}

function Parent() {
  this.children = [];
  this.location = [0, 0, 0];
  this.rotation = [0, 0, 0];
  this.scale = [1, 1, 1];
  this.animation = function(){};

  this.initialize = function() {
    this.move();
    this.twist();
    this.expand();
    this.animate();
  }

  this.setScale = function(scale) {
    this.scale = scale;
    return this;
  }

  this.setAnimation = function(animation) {
    this.animation = animation;
    return this;
  }

  this.setRotation = function(rotation) {
    this.rotation = rotation;
    return this;
  }

  this.setLocation = function(location) {
    this.location = location;
    return this;
  }

  this.rotateObjects = function(diffX) {
    for (var i = 0; i < this.children.length; i++) {
      this.children[i].rotateObjects(diffX);
    }
  }

  this.expand = function() {
    for (var i = 0; i < this.children.length; i++) {
      this.children[i].scale = this.scale;
    }
  }

  this.animate = function() {
    this.animation(this);
  }

  this.twist = function() {
    for (var i = 0; i < this.children.length; i++) {
      this.children[i].rotation = this.rotation;
    }
  }

  this.move = function() {
    for (var i = 0; i < this.children.length; i++) {
      this.children[i].position = this.location;
    }
  }

  this.draw = function() {
    for (var i = 0; i < this.children.length; i++) {
      this.children[i].draw();
    }
  }

  this.rotateCamera = function(diffX, diffY) {
    for (var i = 0; i < this.children.length; i++) {
      this.children[i].camera_angle_x += diffX / 5;
      this.children[i].camera_angle_y += diffY / 5;
    }
  }

  this.rotateObjects = function(diffX) {
    for (var i = 0; i < this.children.length; i++) {
      this.children[i].object_angle += diffX / 5;
    }
  }
}

/**
 * A geometry object.
 */
function Geometry(isStatic) {
  this.initialPosition = [0, 0, 0];
  this.position = this.initialPosition;
  this.initialRotation = [0, 0, 0];
  this.rotation = this.initialRotation;
  this.initialScale = [1, 1, 1];
  this.scale = this.initialScale;
  this.isStatic = isStatic;
  this.textures = [];
  this.vertexIndices = [];
  this.uvIndices = [];
  this.normalIndices = [];
  this.vertices = [];
  this.uvs = [];
  this.normals = [];
  this.xMin;
  this.xMax;
  this.yMin;
  this.yMax;
  this.zMin;
  this.zMax;
  this.vertexBuffer;
  this.normalBuffer;
  this.textureBuffer;
  this.indexBuffer;
  this.mMatrix = mat4.create(); // model matrix
  this.vMatrix = mat4.create(); // view matrix
  this.pMatrix = mat4.create(); // projection matrix
  this.nMatrix = mat4.create(); // normal matrix
  this.v2wMatrix = mat4.create(); // eye space to world space matrix
  this.object_angle = 0.0;
  this.camera_angle_x = 0.0;
  this.camera_angle_y = 0.0;
  this.mat_ambient = [0, 0, 0, 1];
  this.mat_diffuse = [1, 1, 0, 1];
  this.mat_specular = [.9, .9, .9, 1];
  this.mat_shine = [50];
  this.light_ambient = [0, 0, 0, 1];
  this.light_diffuse = [.8, .8, .8, 1];
  this.light_specular = [1, 1, 1, 1];
  this.light_pos = [0, 0, 0, 1]; // eye space position

  /**
   * Draws the geometry.
   */
  this.draw = function() {
    this.transform();
    this.setVertexAttributes();
    this.setElementAttributes();
    this.setLightProperties();
    this.setMaterialProperties();
    this.setMatrixUniforms();
    this.setTextureIndex();
    this.setTextures();
    this.drawByType(draw_type);
  }

  /**
   * Transforms this geometry (currently hardcoded).
   */
  this.transform = function() {
    this.pMatrix = mat4.perspective(60, 1.0, 0.1, 100, this.pMatrix);
    this.vMatrix = mat4.lookAt([1, 1, 1], [-1, -1, -1], [0, -1, 0], this.vMatrix);
    this.vMatrix = mat4.rotateY(this.vMatrix, degToRad(this.camera_angle_x));
    this.vMatrix = mat4.rotateX(this.vMatrix, degToRad(this.camera_angle_y));

    mat4.identity(this.mMatrix);
    this.mMatrix = mat4.translate(this.mMatrix, this.position);
    if (this.isStatic) {
      this.mMatrix = mat4.rotateX(this.mMatrix, this.rotation[0]);
      this.mMatrix = mat4.rotateY(this.mMatrix, this.rotation[1]);
      this.mMatrix = mat4.rotateZ(this.mMatrix, this.rotation[2]);
      this.mMatrix = mat4.scale(this.mMatrix, this.scale);
    } else {
      this.mMatrix = mat4.scale(this.mMatrix, this.scale);
      this.mMatrix = mat4.rotate(this.mMatrix, degToRad(this.object_angle), [0, 1, 1]);
    }

    mat4.identity(this.nMatrix);
    this.nMatrix = mat4.multiply(this.nMatrix, this.vMatrix);
    this.nMatrix = mat4.multiply(this.nMatrix, this.mMatrix);
    this.nMatrix = mat4.inverse(this.nMatrix);
    this.nMatrix = mat4.transpose(this.nMatrix);

    mat4.identity(this.v2wMatrix);
    this.v2wMatrix = mat4.multiply(this.v2wMatrix, this.vMatrix);
    this.v2wMatrix = mat4.transpose(this.v2wMatrix);
  }

  /**
   * Sets the current active texture.
   */
  this.setTextureIndex = function() {
    if (this.isStatic) {
      gl.uniform1i(shaderProgram.use_textureUniform, 1);
    } else {
      gl.uniform1i(shaderProgram.use_textureUniform, use_texture);
    }
  }

  /**
   * A helper method which binds the two textures to the shader.
   */
  this.setTextures = function() {
    this.setTexture(0, this.textures[0], gl.TEXTURE_2D, shaderProgram.textureUniform);
    this.setTexture(1, this.textures[1], gl.TEXTURE_CUBE_MAP, shaderProgram.cube_map_textureUniform);
  }

  /**
   * A helper method which sets and binds a texture.
   *
   * @param {number} index the current texture index
   * @param texture the current texture object
   * @param type the type of texture object
   * @param attribute the shader attribute to be bound to this texture
   */
  this.setTexture = function(index, texture, type, attribute) {
    gl.activeTexture(gl.TEXTURE0 + index); // set texture unit 0 to use
    gl.bindTexture(type, texture); // bind the texture object to the texture unit
    gl.uniform1i(attribute, index); // pass the texture unit to the shader
  }

  /**
   * A reusable helper method which avoids global variables.
   *
   * @param {number} type the type of drawing (i.e. point/line/face)
   */
  this.drawByType = function(type) {
    if (type == 1) {
      gl.drawArrays(gl.LINE_LOOP, 0, this.vertexBuffer.numItems);
    } else if (type == 0) {
      gl.drawArrays(gl.POINTS, 0, this.vertexBuffer.numItems);
    } else if (type == 2) {
      gl.drawElements(gl.TRIANGLES, this.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
  }

  /**
   * A helper method which binds the element array buffer.
   */
  this.setElementAttributes = function() {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
  }

  /**
   * A helper method which sets the three main attributes for this object:
   * 1. Vertices
   * 2. Normals
   * 3. Texture Coordinates
   */
  this.setVertexAttributes = function() {
    this.setVertexAttribute(this.vertexBuffer, shaderProgram.vertexPositionAttribute, this.vertexBuffer.itemSize);
    this.setVertexAttribute(this.normalBuffer, shaderProgram.vertexNormalAttribute, this.normalBuffer.itemSize);
    this.setVertexAttribute(this.textureBuffer, shaderProgram.vertexTexCoordsAttribute, this.textureBuffer.itemSize);
  }

  /**
   * A helper method which abstracts the binding and setting of vertex attributes.
   *
   * @param buffer a buffer object
   * @param attribute the shader attribute
   * @param itemSize the number of items in the buffer
   */
  this.setVertexAttribute = function(buffer, attribute, itemSize) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(
      attribute, // Attribute location
      itemSize, // # of elements per attribute
      gl.FLOAT, // Type of elements
      false,
      0, // Size of individual vertex
      0 // Offset
    );
  }

  /**
   * Sets the light properties of the object (currently hardcoded).
   */
  this.setLightProperties = function() {
    gl.uniform4f(shaderProgram.light_ambientUniform, this.light_ambient[0], this.light_ambient[1], this.light_ambient[2], 1.0);
    gl.uniform4f(shaderProgram.light_diffuseUniform, this.light_diffuse[0], this.light_diffuse[1], this.light_diffuse[2], 1.0);
    gl.uniform4f(shaderProgram.light_specularUniform, this.light_specular[0], this.light_specular[1], this.light_specular[2], 1.0);
  }

  /**
   * Sets the material properties of the object (currently hardcoded).
   */
  this.setMaterialProperties = function() {
    gl.uniform4f(shaderProgram.ambient_coefUniform, this.mat_ambient[0], this.mat_ambient[1], this.mat_ambient[2], this.mat_ambient[3]);
    gl.uniform4f(shaderProgram.diffuse_coefUniform, this.mat_diffuse[0], this.mat_diffuse[1], this.mat_diffuse[2], this.mat_diffuse[3]);
    gl.uniform4f(shaderProgram.specular_coefUniform, this.mat_specular[0], this.mat_specular[1], this.mat_specular[2], this.mat_specular[3]);
    gl.uniform1f(shaderProgram.shininess_coefUniform, this.mat_shine[0]);
  }

  /**
   * Sets the matrix uniforms from all this geometries matrices.
   */
  this.setMatrixUniforms = function() {
    gl.uniformMatrix4fv(shaderProgram.mMatrixUniform, false, this.mMatrix);
    gl.uniformMatrix4fv(shaderProgram.vMatrixUniform, false, this.vMatrix);
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, this.pMatrix);
    gl.uniformMatrix4fv(shaderProgram.nMatrixUniform, false, this.nMatrix);
    gl.uniformMatrix4fv(shaderProgram.v2wMatrixUniform, false, this.v2wMatrix);
  }

  /**
   * Initializes an array buffer.
   *
   * @param buffer the element buffer
   * @param data the data to be bound
   * @param itemSize the number of items
   */
  this.initArrayBuffer = function(buffer, data, itemSize) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    buffer.itemSize = itemSize;
    buffer.numItems = data.length / itemSize;
  }

  /**
   * Initializes the element array buffer.
   *
   * @param buffer the element buffer
   * @param data the data to be bound
   * @param itemSize the number of items
   */
  this.initElementArrayBuffer = function(buffer, data, itemSize) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), gl.STATIC_DRAW);
    buffer.itemsize = itemSize;
    buffer.numItems = data.length / itemSize;
  }

  /**
   * Initializes buffers from geometry.
   *
   * @param {Object} a collection of geometry information
   */
  this.initBuffers = function(geometry) {
    this.vertexIndices = [].concat.apply([], geometry.faces);
    this.vertices = geometry.vertices;
    this.uvs = geometry.texturecoords[0];
    this.normals = geometry.normals;

    this.vertexBuffer = gl.createBuffer(); // 0
    this.initArrayBuffer(this.vertexBuffer, this.vertices, 3);
    this.normalBuffer = gl.createBuffer(); // 1
    this.initArrayBuffer(this.normalBuffer, this.normals, 3);
    this.textureBuffer = gl.createBuffer(); // 2
    this.initArrayBuffer(this.textureBuffer, this.uvs, 2);
    this.indexBuffer = gl.createBuffer();
    this.initElementArrayBuffer(this.indexBuffer, this.vertexIndices, 1);

    this.find_range(this.vertices);
  }

  /**
   * Initializes a texture object
   *
   * @param {Image} image an image url
   * @param {boolean} isCube a boolean to determine if the texture is a cube map
   */
  this.initTexture = function(image, isCube) {
    var texture = gl.createTexture();
    if (isCube) {
      this.bindEmptyTexture(gl.TEXTURE_CUBE_MAP, texture, image);
      for (var i = 0; i < image.length; i++) {
        this.load(image[i][0], image[i][1], texture);
      }
      this.textures.push(texture);
    } else {
      this.bindEmptyTexture(gl.TEXTURE_2D, texture);
      texture.image = new Image();
      texture.image.src = image;
      texture.image.onload = function() {
        this.handleTextureLoaded(texture);
      }.bind(this);
      this.textures.push(texture);
    }
    return texture;
  }

  /**
   * A helper method which binds a 1x1 texture while we wait for
   * the image textures to load.
   *
   * @param {number} a GL enum
   * @param {texture} a GL texture object
   * @param {!Array[number]} a list of GL enums
   */
  this.bindEmptyTexture = function(type, texture, targets) {
    gl.bindTexture(type, texture);
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
    if (type == gl.TEXTURE_CUBE_MAP) {
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      for (var i = 0; i < targets.length; i++) {
        gl.texImage2D(
          targets[i][1],
          level,
          internalFormat,
          width,
          height,
          border,
          srcFormat,
          srcType,
          pixel
        );
      }
    } else {
      gl.texImage2D(
        type,
        level,
        internalFormat,
        width,
        height,
        border,
        srcFormat,
        srcType,
        pixel
      );
    }
  }

  /**
   * A helper method which loads Cube Map textures
   *
   * @param {string} url a path to a texture
   * @param {number} texture face enum (i.e. gl.TEXTURE_CUBE_MAP_POSITIVE_X)
   * @param {texture} texture a GL texture object
   */
  this.load = function(url, target, texture) {
    var img = new Image();
    img.src = url;
    img.onload = function(texture, target, image) {
      return function() {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image );
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
      }
    } (texture, target, img);
  }

  /**
   * Handles loaded 2D texture.
   *
   * @param {Texture} texture a GL texture object
   */
  this.handleTextureLoaded = function(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  /**
   * Determines the range of the model.
   *
   * @param {!Array[number]} positions a list of positions in x, y, z format
   */
  this.find_range = function(positions) {
    this.xMin = this.xMax = positions[0];
    this.yMin = this.yMax = positions[1];
    this.zMin = this.zMax = positions[2];
    for (i = 0; i < positions.length / 3; i++) {
      if (positions[i * 3] < this.xMin) {
        this.xMin = positions[i * 3];
      }
      if (positions[i * 3] > this.xMax) {
        this.xMax = positions[i * 3];
      }

      if (positions[i * 3 + 1] < this.yMin) {
        this.yMin = positions[i * 3 + 1];
      }
      if (positions[i * 3 + 1] > this.yMax) {
        this.yMax = positions[i * 3 + 1];
      }

      if (positions[i * 3 + 2] < this.zMin) {
        this.zMin = positions[i * 3 + 2];
      }
      if (positions[i * 3 + 2] > this.zMax) {
        this.zMax = positions[i * 3 + 2];
      }
    }
  }
}
