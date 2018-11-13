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
    for (var i = 0; i < geometryData.geometries.length; i++) {
      myObject = new Geometry();
      myObject.initTexture("Textures/earth.png", false);
      myObject.initTexture("Textures/brick.png", true);
      myObject.initBuffers(geometryData.geometries[i].data);
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
    for (var i = 0; i < this.objects.length; i++) {
      this.objects[i].draw();
    }
  }
}

function Geometry() {
  this.textures = [];
  this.indices = [];
  this.vertices;
  this.uvs;
  this.normals;
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

  this.transform = function() {
    this.pMatrix = mat4.perspective(60, 1.0, 0.1, 100, this.pMatrix); // set up the projection matrix

    this.vMatrix = mat4.lookAt([0, 0, 5], [0, 0, 0], [0, 1, 0], this.vMatrix); // set up the view matrix, multiply into the modelview matrix

    mat4.identity(this.mMatrix);

    this.mMatrix = mat4.translate(this.mMatrix, [0, 0, -75]);

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
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (this.vertexBuffer == null || this.normalBuffer == null || this.indexBuffer == null) {
      return;
    }

    var light_ambient = [0, 0, 0, 1];
    var light_diffuse = [.8, .8, .8, 1];
    var light_specular = [1, 1, 1, 1];
    var light_pos = [0, 0, 0, 1]; // eye space position

    var mat_ambient = [0, 0, 0, 1];
    var mat_diffuse = [1, 1, 0, 1];
    var mat_specular = [.9, .9, .9, 1];
    var mat_shine = [50];

    this.transform();

    shaderProgram.light_posUniform = gl.getUniformLocation(shaderProgram, "light_pos");

    gl.uniform4f(shaderProgram.light_posUniform, light_pos[0], light_pos[1], light_pos[2], light_pos[3]);
    gl.uniform4f(shaderProgram.ambient_coefUniform, mat_ambient[0], mat_ambient[1], mat_ambient[2], 1.0);
    gl.uniform4f(shaderProgram.diffuse_coefUniform, mat_diffuse[0], mat_diffuse[1], mat_diffuse[2], 1.0);
    gl.uniform4f(shaderProgram.specular_coefUniform, mat_specular[0], mat_specular[1], mat_specular[2], 1.0);
    gl.uniform1f(shaderProgram.shininess_coefUniform, mat_shine[0]);

    gl.uniform4f(shaderProgram.light_ambientUniform, light_ambient[0], light_ambient[1], light_ambient[2], 1.0);
    gl.uniform4f(shaderProgram.light_diffuseUniform, light_diffuse[0], light_diffuse[1], light_diffuse[2], 1.0);
    gl.uniform4f(shaderProgram.light_specularUniform, light_specular[0], light_specular[1], light_specular[2], 1.0);


    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, this.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexTexCoordsAttribute, this.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);


    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    this.setMatrixUniforms(); // pass the modelview mattrix and projection matrix to the shader
    gl.uniform1i(shaderProgram.use_textureUniform, use_texture);

    gl.activeTexture(gl.TEXTURE0); // set texture unit 0 to use
    gl.bindTexture(gl.TEXTURE_2D, this.textures[0]); // bind the texture object to the texture unit
    gl.uniform1i(shaderProgram.textureUniform, 0); // pass the texture unit to the shader

    gl.activeTexture(gl.TEXTURE1); // set texture unit 1 to use
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.textures[1]); // bind the texture object to the texture unit
    gl.uniform1i(shaderProgram.cube_map_textureUniform, 1); // pass the texture unit to the shader

    if (draw_type == 1) gl.drawArrays(gl.LINE_LOOP, 0, this.vertexBuffer.numItems);
    else if (draw_type == 0) gl.drawArrays(gl.POINTS, 0, this.vertexBuffer.numItems);
    else if (draw_type == 2) gl.drawElements(gl.TRIANGLES, this.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
  }

  this.setMatrixUniforms = function() {
    gl.uniformMatrix4fv(shaderProgram.mMatrixUniform, false, this.mMatrix);
    gl.uniformMatrix4fv(shaderProgram.vMatrixUniform, false, this.vMatrix);
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, this.pMatrix);
    gl.uniformMatrix4fv(shaderProgram.nMatrixUniform, false, this.nMatrix);
    gl.uniformMatrix4fv(shaderProgram.v2wMatrixUniform, false, this.v2wMatrix);
  }

  this.initBuffers = function(geometry) {
    this.vertices = geometry.vertices.slice();
    this.getThreeJSIndices(geometry);
    this.uvs = this.buildItemsFromIndex(this.indices[2], geometry.uvs[0]);
    this.normals = this.buildItemsFromIndex(this.indices[1], geometry.normals);

    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
    this.vertexBuffer.itemSize = 3;
    this.vertexBuffer.numItems = this.vertices.length / 3;

    this.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);
    this.normalBuffer.itemSize = 3;
    this.normalBuffer.numItems = this.normals.length / 3;

    this.textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvs), gl.STATIC_DRAW);
    this.textureBuffer.itemSize = 2;
    this.textureBuffer.numItems = this.uvs.length / 2;

    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices[0]), gl.STATIC_DRAW);
    this.indexBuffer.itemSize = 1;
    this.indexBuffer.numItems = this.indices[0].length;

    this.find_range(this.vertices);
    console.log(this);
  }

  this.getThreeJSIndices = function(geometry) {
    var vertIndices = [];
    var uvIndices = [];
    var normalIndices = [];
    var i = 0;
    while (i < geometry.faces.length) {
      if (geometry.faces[i] == 42) {
        vertIndices.push(...geometry.faces.slice(i + 1, i + 4));
        uvIndices.push(...geometry.faces.slice(i + 5, i + 8));
        normalIndices.push(...geometry.faces.slice(i + 8, i + 11));
        i += 11;
      } else if (geometry.faces[i] == 43) {
        vertIndices.push(...geometry.faces.slice(i + 1, i + 4));
        vertIndices.push(...geometry.faces.slice(i + 2, i + 5));
        uvIndices.push(...geometry.faces.slice(i + 6, i + 9));
        uvIndices.push(...geometry.faces.slice(i + 7, i + 10));
        normalIndices.push(...geometry.faces.slice(i + 10, i + 13));
        normalIndices.push(...geometry.faces.slice(i + 11, i + 14));
        i += 14;
      } else if (geometry.faces[i] = 34) {
        vertIndices.push(...geometry.faces.slice(i + 1, i + 4));
        normalIndices.push(...geometry.faces.slice(i + 5, i + 8));
        i += 8;
      } else {
        console.log("NOT 42 | 43");
        i = geometry.faces.length;
      }
    }
    console.log("RUN");
    this.indices = [vertIndices, normalIndices, uvIndices];
  }

  this.buildItemsFromIndex = function(index, collection) {
    var items = [];
    for (var i = 0; i < index.length; i++) {
      items.push(collection[index[i]]);
    }
    if (items.length == 0) {
      items = new Array(this.indices[0].length);
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
    var texture = gl.createTexture();
    texture.image = new Image();
    if (isCube) {
      texture.image.onload = function() {
        this.handleCubemapTextureLoaded(texture);
      }.bind(this);
    } else {
      texture.image.onload = function() {
        this.handleTextureLoaded(texture);
      }.bind(this);
    }
    texture.image.src = image;
    this.textures.push(texture);
  }

  this.handleCubemapTextureLoaded = function(texture) {
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
      texture.image);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
      texture.image);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
      texture.image);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
      texture.image);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
      texture.image);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
      texture.image);
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
