function Geometry() {
  this.textures = [];
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

    drawScene();

  }

  this.handleLoadedGeometry = function(geometryData) {
    var geometry = geometryData.geometries[4].data

    console.log(geometry);

    var indices = [];
    var uvs = [];
    var normals = [];
    var i = 0;
    while (i < geometry.faces.length) {
      if (geometry.faces[i] == 42) {
        indices.push(...geometry.faces.slice(i + 1, i + 4));
        uvs.push(...geometry.faces.slice(i + 5, i + 8));
        normals.push(...geometry.faces.slice(i + 8, i + 11));
        i += 11;
      } else if (geometry.faces[i] == 43){
        indices.push(...geometry.faces.slice(i + 1, i + 4));
        indices.push(...geometry.faces.slice(i + 2, i + 5));
        uvs.push(...geometry.faces.slice(i + 6, i + 9));
        uvs.push(...geometry.faces.slice(i + 7, i + 10));
        normals.push(...geometry.faces.slice(i + 10, i + 13));
        normals.push(...geometry.faces.slice(i + 11, i + 14));
        i += 14;
      } else {
        console.log("NOT 42 | 43");
      }
    }

    console.log(indices);
    console.log(uvs);
    console.log(normals);

    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.vertices), gl.STATIC_DRAW);
    this.vertexBuffer.itemSize = 3;
    this.vertexBuffer.numItems = geometry.vertices.length / 3;

    this.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    this.normalBuffer.itemSize = 3;
    this.normalBuffer.numItems = normals.length / 3;

    this.textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
    this.textureBuffer.itemSize = 2;
    this.textureBuffer.numItems = uvs.length / 2;

    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    this.indexBuffer.itemSize = 1;
    this.indexBuffer.numItems = indices.length;

    this.find_range(geometry.vertices);

    drawScene();
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
    //gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.REPEAT);
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
    console.log("*****xmin = " + this.xMin + "xmax = " + this.xMax);
    console.log("*****ymin = " + this.yMin + "ymax = " + this.yMax);
    console.log("*****zmin = " + this.zMin + "zmax = " + this.zMax);
  }
}
