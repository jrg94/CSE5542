function Scene() {
  this.objects = [];

  this.initJSON = function(file) {
    var request = new XMLHttpRequest();
    request.open("GET", file);
    request.onreadystatechange =
      function() {
        if (request.readyState == 4) {
          geometry = JSON.parse(request.responseText);
          if (file === "Objects/teapot.json") {
            this.handleLoadedTeapot(geometry);
          } else {
            this.handleLoadedGeometry(geometry)
          }
        }
      }.bind(this);
    request.send();
  }

  this.rotate = function(diffX) {
    for (var i = 0; i < this.objects.length; i++) {
      this.objects[i].z_angle += diffX / 5;
    }
  }

  this.handleLoadedGeometry = function(geometryData) {
    for (var i = 0; i < geometryData.meshes.length; i++) {
      myObject = new Geometry();
      myObject.initTexture("Textures/camo.png", false);
      var imageMap = [
        ["Textures/earth.png", gl.TEXTURE_CUBE_MAP_POSITIVE_X],
        ["Textures/earth.png", gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
        ["Textures/earth.png", gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
        ["Textures/earth.png", gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
        ["Textures/earth.png", gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
        ["Textures/earth.png", gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]
      ]
      myObject.initTexture(imageMap, true);
      myObject.initBuffers(geometryData.meshes[i]);
      this.objects.push(myObject);
    }
    this.draw();
  }

  this.handleLoadedTeapot = function(teapotData) {
    teapotVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotData.vertexPositions), gl.STATIC_DRAW);
    teapotVertexPositionBuffer.itemSize = 3;
    teapotVertexPositionBuffer.numItems = teapotData.vertexPositions.length / 3;

    teapotVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotData.vertexNormals), gl.STATIC_DRAW);
    teapotVertexNormalBuffer.itemSize = 3;
    teapotVertexNormalBuffer.numItems = teapotData.vertexNormals.length / 3;

    teapotVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotData.vertexTextureCoords), gl.STATIC_DRAW);
    teapotVertexTextureCoordBuffer.itemSize = 2;
    teapotVertexTextureCoordBuffer.numItems = teapotData.vertexTextureCoords.length / 2;

    teapotVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(teapotData.indices), gl.STATIC_DRAW);
    teapotVertexIndexBuffer.itemSize = 1;
    teapotVertexIndexBuffer.numItems = teapotData.indices.length;

    this.find_range(teapotData.vertexPositions);

    this.draw();

  }

  this.draw = function() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    for (var i = 0; i < this.objects.length; i++) {
      this.objects[i].draw();
    }
  }
}

function Geometry() {
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
  this.z_angle = 0.0;
  this.mat_ambient = [0, 0, 0, 1];
  this.mat_diffuse = [1, 1, 0, 1];
  this.mat_specular = [.9, .9, .9, 1];
  this.mat_shine = [50];
  this.light_ambient = [0, 0, 0, 1];
  this.light_diffuse = [.8, .8, .8, 1];
  this.light_specular = [1, 1, 1, 1];
  this.light_pos = [0, 0, 0, 1]; // eye space position

  this.transform = function() {
    this.pMatrix = mat4.perspective(60, 1.0, 0.1, 100, this.pMatrix); // set up the projection matrix
    this.vMatrix = mat4.lookAt([0, 0, 5], [0, 0, 0], [0, 1, 0], this.vMatrix); // set up the view matrix, multiply into the modelview matrix

    mat4.identity(this.mMatrix);
    //this.mMatrix = mat4.translate(this.mMatrix, [0, 0, -75]);
    this.mMatrix = mat4.translate(this.mMatrix, [0, 0, -10]);
    this.mMatrix = mat4.scale(this.mMatrix, [1 / 50, 1 / 50, 1 / 50]);
    this.mMatrix = mat4.rotate(this.mMatrix, degToRad(this.z_angle), [0, 1, 1]); // now set up the model matrix

    mat4.identity(this.nMatrix);
    this.nMatrix = mat4.multiply(this.nMatrix, this.vMatrix);
    this.nMatrix = mat4.multiply(this.nMatrix, this.mMatrix);
    this.nMatrix = mat4.inverse(this.nMatrix);
    this.nMatrix = mat4.transpose(this.nMatrix);

    mat4.identity(this.v2wMatrix);
    this.v2wMatrix = mat4.multiply(this.v2wMatrix, this.vMatrix);
    this.v2wMatrix = mat4.transpose(this.v2wMatrix);
  }

  this.draw = function() {
    if (this.vertexBuffer == null || this.normalBuffer == null || this.indexBuffer == null) {
      return;
    }

    this.transform();

    gl.uniform4f(shaderProgram.light_ambientUniform, this.light_ambient[0], this.light_ambient[1], this.light_ambient[2], 1.0);
    gl.uniform4f(shaderProgram.light_diffuseUniform, this.light_diffuse[0], this.light_diffuse[1], this.light_diffuse[2], 1.0);
    gl.uniform4f(shaderProgram.light_specularUniform, this.light_specular[0], this.light_specular[1], this.light_specular[2], 1.0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(
      shaderProgram.vertexPositionAttribute, // Attribute location
      this.vertexBuffer.itemSize, // # of elements per attribute
      gl.FLOAT, // Type of elements
      false,
      0, // Size of individual vertex
      0 // Offset
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.vertexAttribPointer(
      shaderProgram.vertexNormalAttribute,
      this.normalBuffer.itemSize,
      gl.FLOAT,
      false,
      0,
      0
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
    gl.vertexAttribPointer(
      shaderProgram.vertexTexCoordsAttribute,
      this.textureBuffer.itemSize,
      gl.FLOAT,
      false,
      0,
      0
    );

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    this.setMaterialProperties();
    this.setMatrixUniforms(); // pass the modelview mattrix and projection matrix to the shader
    gl.uniform1i(shaderProgram.use_textureUniform, use_texture);

    gl.activeTexture(gl.TEXTURE0); // set texture unit 0 to use
    gl.bindTexture(gl.TEXTURE_2D, this.textures[0]); // bind the texture object to the texture unit
    gl.uniform1i(shaderProgram.textureUniform, 0); // pass the texture unit to the shader

    gl.activeTexture(gl.TEXTURE1); // set texture unit 1 to use
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.textures[1]); // bind the texture object to the texture unit
    gl.uniform1i(shaderProgram.cube_map_textureUniform, 1); // pass the texture unit to the shader

    if (draw_type == 1) {
      gl.drawArrays(gl.LINE_LOOP, 0, this.vertexBuffer.numItems);
    } else if (draw_type == 0) {
      gl.drawArrays(gl.POINTS, 0, this.vertexBuffer.numItems);
    } else if (draw_type == 2) {
      gl.drawElements(gl.TRIANGLES, this.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
  }

  this.setMaterialProperties = function() {
    gl.uniform4f(shaderProgram.ambient_coefUniform, this.mat_ambient[0], this.mat_ambient[1], this.mat_ambient[2], this.mat_ambient[3]);
    gl.uniform4f(shaderProgram.diffuse_coefUniform, this.mat_diffuse[0], this.mat_diffuse[1], this.mat_diffuse[2], this.mat_diffuse[3]);
    gl.uniform4f(shaderProgram.specular_coefUniform, this.mat_specular[0], this.mat_specular[1], this.mat_specular[2], this.mat_specular[3]);
    gl.uniform1f(shaderProgram.shininess_coefUniform, this.mat_shine[0]);
  }

  this.setMatrixUniforms = function() {
    gl.uniformMatrix4fv(shaderProgram.mMatrixUniform, false, this.mMatrix);
    gl.uniformMatrix4fv(shaderProgram.vMatrixUniform, false, this.vMatrix);
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, this.pMatrix);
    gl.uniformMatrix4fv(shaderProgram.nMatrixUniform, false, this.nMatrix);
    gl.uniformMatrix4fv(shaderProgram.v2wMatrixUniform, false, this.v2wMatrix);
  }

  this.initArrayBuffer = function(buffer, data, itemSize) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    buffer.itemSize = itemSize;
    buffer.numItems = data.length / itemSize;
  }

  this.initElementArrayBuffer = function(buffer, data, itemSize) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), gl.STATIC_DRAW);
    buffer.itemsize = itemSize;
    buffer.numItems = data.length / itemSize;
  }

  /**
   * Initializes buffers from geometry.
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

  this.mapIndices = function(tempIndices) {
    var outIndices = [];
    for (var i = 0; i < tempIndices.length; i++) {
      outIndices.push(tempIndices[i] * 3)
      outIndices.push(tempIndices[i] * 3 + 1)
      outIndices.push(tempIndices[i] * 3 + 2)
    }
    return outIndices;
  }

  this.getThreeJSIndices = function(geometry) {
    var vertIndices = [];
    var uvIndices = [];
    var normalIndices = [];
    var i = 0;
    var numFaces = 0;
    while (i < geometry.faces.length) {
      if (geometry.faces[i] == 42) {
        vertIndices.push(...geometry.faces.slice(i + 1, i + 4));
        uvIndices.push(...geometry.faces.slice(i + 5, i + 8));
        normalIndices.push(...geometry.faces.slice(i + 8, i + 11));
        i += 11;
      } else if (geometry.faces[i] == 43) {
        vertIndices.push(...geometry.faces.slice(i + 1, i + 4));
        vertIndices.push(...geometry.faces.slice(i + 3, i + 5));
        vertIndices.push(...geometry.faces.slice(i + 1, i + 2));
        uvIndices.push(...geometry.faces.slice(i + 6, i + 9));
        uvIndices.push(...geometry.faces.slice(i + 8, i + 10));
        uvIndices.push(...geometry.faces.slice(i + 6, i + 7));
        normalIndices.push(...geometry.faces.slice(i + 10, i + 13));
        normalIndices.push(...geometry.faces.slice(i + 12, i + 14));
        normalIndices.push(...geometry.faces.slice(i + 10, i + 11));
        i += 14;
      } else if (geometry.faces[i] = 34) {
        vertIndices.push(geometry.faces.slice(i + 1, i + 4));
        normalIndices.push(geometry.faces.slice(i + 5, i + 8));
        i += 8;
      } else {
        console.log("NOT 42 | 43");
        i = geometry.faces.length;
      }
      numFaces++;
    }

    this.vertexIndices = vertIndices;
    this.normalIndices = normalIndices;
    this.uvIndices = uvIndices;
  }

  this.buildItemsFromIndex = function(index, collection, itemSize) {
    var items = new Array(2 * (this.vertices.length / 3));
    for (var i = 0; i < index.length; i++) {
      var currIndex = index[i];
      var mapping = collection[currIndex];
      for (var j = 0; j < itemSize; j++) {
        items[currIndex + j] = mapping;
      }
    }
    if (items.length == 0) {
      items = new Array(this.vertexIndices.length);
      items.fill(0);
    }
    return items;
  }

  /**
   * Initializes a texture object
   *
   * @param {Image} image an image url
   * @param {boolean} isCube a boolean to determine if the texture is a cube map
   */
  this.initTexture = function(image, isCube) {
    if (isCube) {
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      for (var i = 0; i < image.length; i++) {
        this.load(image[i][0], image[i][1], texture);
      }
      this.textures.push(texture);
    } else {
      var texture = gl.createTexture();
      texture.image = new Image();
      texture.image.onload = function() {
        this.handleTextureLoaded(texture);
      }.bind(this);
      texture.image.src = image;
      this.textures.push(texture);
    }
  }

  this.load = function(url, target, texture) {
    var img = new Image();
    img.onload = function(texture, target, image) {
      return function() {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image );
      }
    } (texture, target, img);
    img.src = url;
  }

  this.handleTextureLoaded = function(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

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
