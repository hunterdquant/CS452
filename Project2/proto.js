// Name: Hunter Quant

// GL
var gl;
var canvas;

// A matrix representing the model view transformation transpoed and inverse.
// for lighting calculations.
var MinvTrans;
// A matrix representing a model view transformation.
var M;
var Minv;

// Matrices representing a orthogonal and perspective projection.
var P;

// Viewer location.
var e;
// Look-at point.
var a;
// Up direction.
var vup;

// Projection bounds.
var pl, pr, pt, pb, pn, pf;

// various buffers.
var indexBuffer;
var verticesBuffer;
var normalsBuffer;
var texCoordBuffer;

//Texture and images.
var cubeMap;
var boxTextures;
var images;
var sphereTexture;

// Directional light with its direction and color.
// diffuse only.
var lightDirection1, directionColor1, lightDirection2, directionColor2;

// Sphere information.
var radius = 2;
var latBands = 64;
var longBands = 64;

// Objects to be rendered.
var ellipsoid;
var sphere;
var star;
var box;
var shards;

// Mouse event states.
var isMouseDown;
var mouseX;
var mouseY;

// Scene transformations.
var sceneRotation;
var sceneRotationInv;

// Scene name (one, two, three)
var scene;

// Scale and scale states.
var scale;
var scaleDown;
var scaleUp;

/* global and main instatiation */
function initGL() {
  canvas = document.getElementById("gl-canvas");
  canvas.width = window.innerHeight;
  canvas.height = window.innerHeight;
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  gl.enable(gl.DEPTH_TEST);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  boxTextures = [];

  isMouseDown = false;
  mouseX = null;
  mouseY = null;
  sceneRotation = mat4(
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0
  );
  sceneRotationInv = mat4(
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0
  );
  sceneRotationInvTrans = mat4(
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0
  );

  scale = 1.0;
  scene = "one";
  shards = [];

  setModelView();
  setProjection();
  setUpLighting();
  createGeometry();
  createBuffers();
  initTextures();
  renderScene();
}

/* Sets model view and viewer location */
function setModelView() {
  // viewer point, look-at point, up direction.
  e = vec3(0.0, 0.0, 8.0);
  a = vec3(0.0, 0.0, 0.0);
  vup = vec3(0.0, 1.0, 0.0);

  calcMAndMinv();
}

/* sets the perspective projection */
function setProjection() {

  // Set bounds for projection.
  viewerDist = length(subtract(e, a));
  pn = viewerDist - 6;
  pf = viewerDist + 64;

  // Perspecive projection bounds.
  pt = pn * Math.tan(Math.PI / 4);
  pb = -pt;
  pr = pt;
  pl = -pr;

  getPerspective();
}

/* sets the values for the lighting */
function setUpLighting() {

  // Direction and color value for the diffuse directional light.
  lightDirection1 = vec3(-1.0, 0.0, 0.0);
  directionColor1 = vec3(0.149, 0.545, 0.824);

  lightDirection2 = vec3(1.0, 0.0, 0.0);
  directionColor2 = vec3(0.863, 0.196, 0.184);
}

/* creates objects for all shapes */
function createGeometry() {
  var sphereInds = getSphereIndices();
  ellipsoid = {};
  getSphereData(true, ellipsoid);
  ellipsoid.indexList = sphereInds;
  ellipsoid.normals = getNormals(ellipsoid.vertices, sphereInds);
  ellipsoid.program = initShaders(gl, "ellipsoid-vertex-shader", "ellipsoid-fragment-shader");
  ellipsoid.vertDim = 3;
  ellipsoid.numElems = sphereInds.length;

  sphere = {};
  getSphereData(false, sphere);
  sphere.indexList = sphereInds;
  sphere.normals = getNormals(sphere.vertices, sphereInds);
  sphere.program = initShaders(gl, "sphere-vertex-shader", "sphere-fragment-shader");
  sphere.vertDim = 3;
  sphere.numElems = sphereInds.length;
  sphere.theta = 0;

  //box bound
  var bb = 32.0;
  box = {
    front: [-bb, -bb, -bb+0.5,
            bb, -bb, -bb+0.5,
            bb, bb, -bb+0.5,
            -bb, bb, -bb+0.5],
    right: [bb-0.5, -bb, -bb,
            bb-0.5, -bb, bb,
            bb-0.5, bb, bb,
            bb-0.5, bb, -bb],
    back: [bb, -bb, bb-0.5,
           -bb, -bb, bb-0.5,
            -bb, bb, bb-0.5,
            bb, bb, bb-0.5],
    left: [-bb+0.5, -bb, bb,
            -bb+0.5, -bb, -bb,
            -bb+0.5, bb, -bb,
            -bb+0.5, bb, bb],
    top: [-bb, bb-0.5, -bb,
          bb, bb-0.5, -bb,
          bb, bb-0.5, bb,
          -bb, bb-0.5, bb],
    bottom: [-bb, -bb+0.5, bb,
              bb, -bb+0.5, bb,
              bb, -bb+0.5, -bb,
              -bb, -bb+0.5, -bb],
    indexList: [0, 1, 2,
                0, 2, 3],
    texCoords: [0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0],
    program: initShaders(gl, "box-vertex-shader", "box-fragment-shader"),
    vertDim: 3,
    numElems: 6
  };
  box.verts = [box.front, box.right, box.back, box.left, box.top, box.bottom];

  star = {};
  star.vertices = getStarVertices();
  star.indexList = getStarIndexList();
  star.normals = getNormals(star.vertices, star.indexList);
  star.program = initShaders(gl, "star-vertex-shader", "star-fragment-shader");
  star.vertDim = 3;
  star.numElems = star.indexList.length;
  star.theta = 0;

  var shardVerts = [0.1, 0.0, 0.0,
                    0.0, 0.0, 0.1,
                    0.0, 0.1, 0.0,

                    0.0, 0.0, 0.1,
                    -0.1, 0.0, 0.0,
                    0.0, 0.1, 0.0,

                    -0.1, 0.0, 0.0,
                    0.0, 0.0, -0.1,
                    0.0, 0.1, 0.0,

                    0.0, 0.0, -0.1,
                    0.1, 0.0, 0.0,
                    0.0, 0.1, 0.0,

                    0.1, 0.0, 0.0,
                    0.0, -0.1, 0.0,
                    0.0, 0.0, 0.1,

                    0.0, 0.0, 0.1,
                    0.0, -0.1, 0.0,
                    -0.1, 0.0, 0.0,

                    -0.1, 0.0, 0.0,
                    0.0, -0.1, 0.0,
                    0.0, 0.0, -0.1,

                    0.0, 0.0, -0.1,
                    0.0, -0.1, 0.0,
                    0.1, 0.0, 0.0];
  var shardInds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
  var shardNorms = getNormals(shardVerts, shardInds);
  var shardProg = initShaders(gl, "shard-vertex-shader", "shard-fragment-shader");
  for (var i = 0; i < 256; i++) {
    var shard = {};
    shard.vertices = shardVerts;
    shard.indexList = shardInds;
    shard.normals = shardNorms;
    shard.program = shardProg;
    shard.vertDim = 3;
    shard.numElems = shardInds.length;
    shard.direction = [(2*Math.random() - 1)/50, (2*Math.random() - 1)/50, (2*Math.random() - 1)/50];
    shard.position = [0.0, 0.0, 0.0];
    shard.theta = 2*Math.random();
    shards.push(shard);
  }
}

/* creates commonly used buffers */
function createBuffers() {

  indexBuffer = gl.createBuffer();
  verticesBuffer = gl.createBuffer();
  normalsBuffer = gl.createBuffer();
  texCoordBuffer = gl.createBuffer();
}

/*draws the box object */
function drawBox() {

  gl.useProgram(box.program);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(box.indexList), gl.STATIC_DRAW);

  var MLoc = gl.getUniformLocation(box.program, "M");
  gl.uniformMatrix4fv(MLoc, false, M);

  var SRotLoc = gl.getUniformLocation(box.program, "SRot");
  gl.uniformMatrix4fv(SRotLoc, false, flatten(sceneRotation));

  PLoc = gl.getUniformLocation(box.program, "P");
  gl.uniformMatrix4fv(PLoc, false, P);

  for (var i = 0; i < 6; i++) {

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(box.verts[i]), gl.STATIC_DRAW);
    var vertexPosition = gl.getAttribLocation(box.program, "vertexPosition");
    gl.vertexAttribPointer(vertexPosition, box.vertDim, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPosition);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, boxTextures[i]);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(box.texCoords), gl.STATIC_DRAW);
    var texCoordLocation = gl.getAttribLocation(box.program, "texCoord");
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLocation);

    gl.drawElements(gl.TRIANGLES, box.numElems, gl.UNSIGNED_SHORT, 0);
  }
}

/* draws the ellipsoid object */
function drawEllipsoid() {

  gl.useProgram(ellipsoid.program);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ellipsoid.indexList), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ellipsoid.vertices), gl.STATIC_DRAW);
  var vertexPosition = gl.getAttribLocation(ellipsoid.program, "vertexPosition");
  gl.vertexAttribPointer(vertexPosition, ellipsoid.vertDim, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vertexPosition);

  gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(ellipsoid.normals)), gl.STATIC_DRAW);
  var nvPosition = gl.getAttribLocation(ellipsoid.program, "nv");
  gl.vertexAttribPointer(nvPosition, ellipsoid.vertDim, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(nvPosition);

  var MLoc = gl.getUniformLocation(ellipsoid.program, "M");
  gl.uniformMatrix4fv(MLoc, false, M);

  var SRotLoc = gl.getUniformLocation(ellipsoid.program, "SRot");
  gl.uniformMatrix4fv(SRotLoc, false, flatten(sceneRotation));

  var MinvTransLoc = gl.getUniformLocation(ellipsoid.program, "MinvTrans");
  gl.uniformMatrix4fv(MinvTransLoc, false, MinvTrans);

  var MinvLoc = gl.getUniformLocation(ellipsoid.program, "Minv");
  gl.uniformMatrix4fv(MinvLoc, false, Minv);

  var SRotInvLoc = gl.getUniformLocation(ellipsoid.program, "SRotInv");
  gl.uniformMatrix4fv(SRotInvLoc, false, flatten(sceneRotationInv));

  var scaleLoc = gl.getUniformLocation(ellipsoid.program, "s");
  gl.uniform1f(scaleLoc, scale);

  var PLoc = gl.getUniformLocation(ellipsoid.program, "P");
  gl.uniformMatrix4fv(PLoc, false, P);

  var cubeTexMapLoc = gl.getUniformLocation(ellipsoid.program, "cubeTexMap");
  gl.uniform1i(cubeTexMapLoc, 0);

  gl.drawElements(gl.TRIANGLES, ellipsoid.numElems, gl.UNSIGNED_SHORT, 0);
}

/* draws the sphere object */
function drawSphere() {

  gl.useProgram(sphere.program);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphere.indexList), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.vertices), gl.STATIC_DRAW);
  var vertexPosition = gl.getAttribLocation(sphere.program, "vertexPosition");
  gl.vertexAttribPointer(vertexPosition, sphere.vertDim, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vertexPosition);

  gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(sphere.normals)), gl.STATIC_DRAW);
  var nvPosition = gl.getAttribLocation(sphere.program, "nv");
  gl.vertexAttribPointer(nvPosition, sphere.vertDim, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(nvPosition);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, sphereTexture);
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.texCoords), gl.STATIC_DRAW);
  var texCoordLocation = gl.getAttribLocation(sphere.program, "texCoord");
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(texCoordLocation);

  var MLoc = gl.getUniformLocation(sphere.program, "M");
  gl.uniformMatrix4fv(MLoc, false, M);

  var SRotLoc = gl.getUniformLocation(sphere.program, "SRot");
  gl.uniformMatrix4fv(SRotLoc, false, flatten(sceneRotation));

  var MinvTransLoc = gl.getUniformLocation(sphere.program, "MinvTrans");
  gl.uniformMatrix4fv(MinvTransLoc, false, MinvTrans);

  var PLoc = gl.getUniformLocation(sphere.program, "P");
  gl.uniformMatrix4fv(PLoc, false, P);

  var thetaLoc = gl.getUniformLocation(sphere.program, "theta");
  gl.uniform1f(thetaLoc, sphere.theta);

  var scaleLoc = gl.getUniformLocation(sphere.program, "s");
  gl.uniform1f(scaleLoc, scale);

  var lightDirection1Loc = gl.getUniformLocation(sphere.program, "lightDirection1");
  gl.uniform3f(lightDirection1Loc, lightDirection1[0], lightDirection1[1], lightDirection1[2]);
  var directionColor1Loc = gl.getUniformLocation(sphere.program, "directionColor1");
  gl.uniform3f(directionColor1Loc, directionColor1[0], directionColor1[1], directionColor1[2]);
  var lightDirection2Loc = gl.getUniformLocation(sphere.program, "lightDirection2");
  gl.uniform3f(lightDirection2Loc, lightDirection2[0], lightDirection2[1], lightDirection2[2])
  var directionColor2Loc = gl.getUniformLocation(sphere.program, "directionColor2");
  gl.uniform3f(directionColor2Loc, directionColor2[0], directionColor2[1], directionColor2[2])

  gl.drawElements(gl.TRIANGLES, sphere.numElems, gl.UNSIGNED_SHORT, 0);
}

/* draws the star object */
function drawStar() {

  gl.useProgram(star.program);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(star.indexList), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(star.vertices), gl.STATIC_DRAW);
  var vertexPosition = gl.getAttribLocation(star.program, "vertexPosition");
  gl.vertexAttribPointer(vertexPosition, star.vertDim, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vertexPosition);

  gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(star.normals)), gl.STATIC_DRAW);
  var nvPosition = gl.getAttribLocation(star.program, "nv");
  gl.vertexAttribPointer(nvPosition, star.vertDim, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(nvPosition);

  var MLoc = gl.getUniformLocation(star.program, "M");
  gl.uniformMatrix4fv(MLoc, false, M);

  var SRotLoc = gl.getUniformLocation(star.program, "SRot");
  gl.uniformMatrix4fv(SRotLoc, false, flatten(sceneRotation));

  var MinvTransLoc = gl.getUniformLocation(star.program, "MinvTrans");
  gl.uniformMatrix4fv(MinvTransLoc, false, MinvTrans);

  var PLoc = gl.getUniformLocation(star.program, "P");
  gl.uniformMatrix4fv(PLoc, false, P);

  var thetaLoc = gl.getUniformLocation(star.program, "theta");
  gl.uniform1f(thetaLoc, star.theta);

  var scaleLoc = gl.getUniformLocation(star.program, "s");
  gl.uniform1f(scaleLoc, scale);

  var lightDirection1Loc = gl.getUniformLocation(star.program, "lightDirection1");
  gl.uniform3f(lightDirection1Loc, lightDirection1[0], lightDirection1[1], lightDirection1[2]);
  var directionColor1Loc = gl.getUniformLocation(star.program, "directionColor1");
  gl.uniform3f(directionColor1Loc, directionColor1[0], directionColor1[1], directionColor1[2]);
  var lightDirection2Loc = gl.getUniformLocation(star.program, "lightDirection2");
  gl.uniform3f(lightDirection2Loc, lightDirection2[0], lightDirection2[1], lightDirection2[2])
  var directionColor2Loc = gl.getUniformLocation(star.program, "directionColor2");
  gl.uniform3f(directionColor2Loc, directionColor2[0], directionColor2[1], directionColor2[2])

  gl.drawElements(gl.TRIANGLES, star.numElems, gl.UNSIGNED_SHORT, 0);
}

/* draws the passed star object */
function drawShard(shard) {
  gl.useProgram(shard.program);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(shard.indexList), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shard.vertices), gl.STATIC_DRAW);
  var vertexPosition = gl.getAttribLocation(shard.program, "vertexPosition");
  gl.vertexAttribPointer(vertexPosition, shard.vertDim, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vertexPosition);

  gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(shard.normals)), gl.STATIC_DRAW);
  var nvPosition = gl.getAttribLocation(shard.program, "nv");
  gl.vertexAttribPointer(nvPosition, shard.vertDim, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(nvPosition);

  var MLoc = gl.getUniformLocation(shard.program, "M");
  gl.uniformMatrix4fv(MLoc, false, M);

  var SRotLoc = gl.getUniformLocation(shard.program, "SRot");
  gl.uniformMatrix4fv(SRotLoc, false, flatten(sceneRotation));

  var MinvTransLoc = gl.getUniformLocation(shard.program, "MinvTrans");
  gl.uniformMatrix4fv(MinvTransLoc, false, MinvTrans);

  var PLoc = gl.getUniformLocation(shard.program, "P");
  gl.uniformMatrix4fv(PLoc, false, P);

  var thetaLoc = gl.getUniformLocation(shard.program, "theta");
  gl.uniform1f(thetaLoc, shard.theta);

  var posLoc = gl.getUniformLocation(shard.program, "pos");
  gl.uniform3f(posLoc, shard.position[0], shard.position[1], shard.position[2]);

  var lightDirection1Loc = gl.getUniformLocation(shard.program, "lightDirection1");
  gl.uniform3f(lightDirection1Loc, lightDirection1[0], lightDirection1[1], lightDirection1[2]);
  var directionColor1Loc = gl.getUniformLocation(shard.program, "directionColor1");
  gl.uniform3f(directionColor1Loc, directionColor1[0], directionColor1[1], directionColor1[2]);
  var lightDirection2Loc = gl.getUniformLocation(shard.program, "lightDirection2");
  gl.uniform3f(lightDirection2Loc, lightDirection2[0], lightDirection2[1], lightDirection2[2])
  var directionColor2Loc = gl.getUniformLocation(shard.program, "directionColor2");
  gl.uniform3f(directionColor2Loc, directionColor2[0], directionColor2[1], directionColor2[2])

  gl.drawElements(gl.TRIANGLES, shard.numElems, gl.UNSIGNED_SHORT, 0);
}

/* sets data for the passed object */
function getSphereData(isEllipse, sphere) {

  sphere.vertices = [];
  if (!isEllipse) {
    sphere.texCoords = [];
  }
  for (var latNumber = 0; latNumber <= latBands; latNumber++) {
    var theta = latNumber * Math.PI / latBands;
    var sinTheta = Math.sin(theta);
    var cosTheta = Math.cos(theta);

    for (var longNumber = 0; longNumber <= longBands; longNumber++) {
      var phi = longNumber * 2 * Math.PI / longBands;
      var sinPhi = Math.sin(phi);
      var cosPhi = Math.cos(phi);

      var x = cosPhi * sinTheta;
      var y = cosTheta;
      var z = sinPhi * sinTheta;
      if (!isEllipse) {
        sphere.texCoords.push(1 - (longNumber / longBands));
        sphere.texCoords.push(1 - (latNumber / latBands));
      }
      sphere.vertices.push(radius * x);
      if (isEllipse) {
        sphere.vertices.push(2 * radius * y);
      } else {
        sphere.vertices.push(radius * y);
      }
      sphere.vertices.push(radius * z);
    }
  }
}

/* credit to learningwebgl.com lesson 11, because I wouldn't have thought of getting
  indices like this.

  Gets the indices for longitudinal sphere */
function getSphereIndices() {
  var indices = [];
  for (var latNumber = 0; latNumber < latBands; latNumber++) {
    for (var longNumber = 0; longNumber < longBands; longNumber++) {
      var first = (latNumber * (longBands + 1)) + longNumber;
      var second = first + longBands + 1;
      indices.push(first);
      indices.push(second);
      indices.push(first + 1);
      indices.push(second);
      indices.push(second + 1);
      indices.push(first + 1);
    }
  }
  return indices;
}

/* A convoluded function that returns a list of vertex normals.
    Iterates through all the points and caclulates all the face normals around
    it then uses those face normals to create the vertex normal.*/
function getNormals(vertices, indexList) {
  var vertNormals = [];
  for (var i = 0; i < vertices.length; i++) {
    var faceNormals = [];
    for (var j = 0; j < indexList.length; j += 3) {
      if (indexList[j] === i || indexList[j + 1] === i || indexList[j + 2] === i) {
        var threeTimesInd = 3 * indexList[j];
        var p0 = vec3(vertices[threeTimesInd], vertices[threeTimesInd + 1], vertices[threeTimesInd + 2]);
        threeTimesInd = 3 * indexList[j + 1];
        var p1 = vec3(vertices[threeTimesInd], vertices[threeTimesInd + 1], vertices[threeTimesInd + 2]);
        threeTimesInd = 3 * indexList[j + 2];
        var p2 = vec3(vertices[threeTimesInd], vertices[threeTimesInd + 1], vertices[threeTimesInd + 2]);
        var v1 = subtract(p1, p0);
        var v2 = subtract(p2, p0);
        faceNormals.push(cross(v1, v2));
      }
    }
    var vertNormal = vec3(0, 0, 0);
    for (j = 0; j < faceNormals.length; j++) {
      vertNormal = add(vertNormal, faceNormals[j]);
    }
    vertNormal = normalize(vertNormal);
    vertNormals.push(vertNormal);
  }

  return vertNormals;
}

/* initializes the textures */
function initTextures() {
    images = [
    document.getElementById("front"),
    document.getElementById("right"),
    document.getElementById("back"),
    document.getElementById("left"),
    document.getElementById("top"),
    document.getElementById("bottom")];

  boxTextures = [];

  cubeMap = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[0]);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[1]);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[2]);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[3]);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[4]);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[5]);


  sphereTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, sphereTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById("sun"));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  for (var i = 0; i < 6; i++) {
    textureImage = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureImage);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[i]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    boxTextures.push(textureImage);
  }
}

/* main scene logic loop */
function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  if (scene === "one") {
    if (scaleDown) {
      scale -= 0.005;
      if (scale <= 0) {
        scene = "two";
        scaleDown = false;
        scaleUp = true;
      }
    }
    drawBox();
    drawEllipsoid();
  } else if (scene === "two") {
    if (scaleUp) {
      scale += 0.005;
      if (scale >= 1) {
        scaleUp = false;
        scaleDown = true;
      }
    } else if (scaleDown) {
      scale -= 0.005;
      if (scale <= 0) {
        scaleUp = true;
        scaleDown = false;
        scene = "three";
      }
    }
    for (var i = 0; i < shards.length; i++) {
      updateShard(shards[i]);
      drawShard(shards[i]);
    }
  } else if (scene === "three") {
    if (scaleUp) {
      scale += 0.005;
      if (scale >= 1) {
        scaleDown = false;
        scaleUp = false;
      }
    }
    updateSceneThree();
    drawSphere();
    drawStar();
  }
  requestAnimFrame(renderScene)
}

/* updates the shard object */
function updateShard(shard){
  shard.theta += 0.05;
  if (scaleUp) {
    shard.position[0] += shard.direction[0];
    shard.position[1] += shard.direction[1];
    shard.position[2] += shard.direction[2];
  } else if (scaleDown) {
    shard.position[0] -= shard.direction[0];
    shard.position[1] -= shard.direction[1];
    shard.position[2] -= shard.direction[2];
  }
}

/* updates objects in scene three */
function updateSceneThree() {
  sphere.theta += 0.01;
  star.theta += 0.02;
}

/* calculates the modelview and modelview inverse for the moved viewer */
function calcMAndMinv() {

  // Unit vectors specifying the local coordinate system for the viewer.
  var n = normalize(subtract(e, a));
  var u = normalize(cross(vup, n));
  var v = normalize(cross(n, u));

  // The inverse rotation matrix.
  var camRotInv = mat4(u[0], u[1], u[2], 0,
    v[0], v[1], v[2], 0,
    n[0], n[1], n[2], 0,
    0, 0, 0, 1);

  // The inverse translation matrix.
  var camTransInv = mat4(1, 0, 0, -e[0],
    0, 1, 0, -e[1],
    0, 0, 1, -e[2],
    0, 0, 0, 1);

  M = flatten(mult(camRotInv, camTransInv));
  MinvTrans = [
    u[0], v[0], n[0], e[0],
    u[1], v[1], n[1], e[1],
    u[2], v[2], n[2], e[2],
    0, 0, 0, 1
  ];

  Minv = [
    u[0], u[1], u[2], 0,
    v[0], v[1], v[2], 0,
    n[0], n[1], n[2], 0,
    e[0], e[1], e[2], 0
  ];
}

/* sets the perspective projection */
function getPerspective() {
  P = [
    pn / pr, 0, 0, 0,
    0, pn / pt, 0, 0,
    0, 0, -(pf + pn) / (pf - pn), -1,
    0, 0, -(2 * pf * pn) / (pf - pn), 0
  ];
}

/* handles mouse down */
function onMouseDown(event) {
  isMouseDown = true;
  mouseX = event.clientX;
  mouseY = event.clientY;
}

/* handles mouse up*/
function onMouseUp(event) {
  isMouseDown = false;
}

/* handles mouse drag and updates the scene rotation */
function onMouseDrag(event) {
  if (isMouseDown) {
    var x = event.clientX;
    var y = event.clientY;

    var changeX = (x - mouseX)*Math.PI/canvas.width;
    var changeY = (mouseY - y)*Math.PI/canvas.height;

    var s = Math.sin(changeX);
    var c = Math.cos(changeX);
    var yRot = mat4(c, 0.0, s, 0.0,
                    0.0, 1.0, 0.0, 0.0,
                    -s, 0.0, c, 0.0,
                    0.0, 0.0, 0.0, 1.0);
    var yRotInv = mat4(c, 0.0, -s, 0.0,
                    0.0, 1.0, 0.0, 0.0,
                    s, 0.0, c, 0.0,
                    0.0, 0.0, 0.0, 1.0);



    s = Math.sin(changeY);
    c = Math.cos(changeY);
    var xRot = mat4(1.0, 0.0, 0.0, 0.0,
                    0.0, c,s, 0.0,
                    0.0, -s, c, 0.0,
                    0.0, 0.0, 0.0, 1.0);

    var xRotInv = mat4(1.0, 0.0, 0.0, 0.0,
                0.0, c, -s, 0.0,
                0.0, s, c, 0.0,
                0.0, 0.0, 0.0, 1.0);


    sceneRotation = mult(mult(yRot, xRot), sceneRotation);
    sceneRotationInv = mult(sceneRotationInv, mult(xRotInv, yRotInv));
    mouseX = x;
    mouseY = y;
  }
}

/* changes scene on key press */
function changeScene(event) {
  scaleDown = true;
}

/* returns the vertices for the star */
function getStarVertices() {
  var vertices = [
                  //front-left-top
                  -0.75, 0.0, 0.75,
                  0.0, 0.0, 0.5,
                  0.0, 0.5, 0.0,
                  //front-right-top
                  0.0, 0.0, 0.5,
                  0.75, 0.0, 0.75,
                  0.0, 0.5, 0.0,
                  //right-left-top
                  0.75, 0.0, 0.75,
                  0.5, 0.0, 0.0,
                  0.0, 0.5, 0.0,
                  //right-right-top
                  0.5, 0.0, 0.0,
                  0.75, 0.0, -0.75,
                  0.0, 0.5, 0.0,
                  //back-left-top
                  0.75, 0.0, -0.75,
                  0.0, 0.0, -0.5,
                  0.0, 0.5, 0.0,
                  //back-right-top
                  0.0, 0.0, -0.5,
                  -0.75, 0.0, -0.75,
                  0.0, 0.5, 0.0,
                  //left-left-top
                  -0.75, 0.0, -0.75,
                  -0.5, 0.0, 0.0,
                  0.0, 0.5, 0.0,
                  //left-right-top
                  -0.5, 0.0, 0.0,
                  -0.75, 0.0, 0.75,
                  0.0, 0.5, 0.0,

                  //front-left-bottom
                  -0.75, 0.0, 0.75,
                  0.0, -0.5, 0.0,
                  0.0, 0.0, 0.5,
                  //front-right-bottom
                  0.0, -0.5, 0.0,
                  0.75, 0.0, 0.75,
                  0.0, 0.0, 0.5,
                  //right-left-bottom
                  0.75, 0.0, 0.75,
                  0.0, -0.5, 0.0,
                  0.5, 0.0, 0.0,
                  //right-right-bottom
                  0.0, -0.5, 0.0,
                  0.75, 0.0, -0.75,
                  0.5, 0.0, 0.0,
                  //back-left-bottom
                  0.75, 0.0, -0.75,
                  0.0, -0.5, 0.0,
                  0.0, 0.0, -0.5,
                  //back-right-bottom
                  0.0, -0.5, 0.0,
                  -0.75, 0.0, -0.75,
                  0.0, 0.0, -0.5,
                  //left-left-bottom
                  -0.75, 0.0, -0.75,
                  0.0, -0.5, 0.0,
                  -0.5, 0.0, 0.0,
                  //left-right-bottom
                  0.0, -0.5, 0.0,
                  -0.75, 0.0, 0.75,
                  -0.5, 0.0, 0.0
                ];
  return vertices;
}

/* returns the index list for the star */
function getStarIndexList() {
  var indices = [0, 1, 2, //flt
                 3, 4, 5, //frt
                 6, 7, 8, //rlt
                 9, 10, 11, //rrt
                 12, 13, 14, //blt
                 15, 16, 17, //brt
                 18, 19, 20, //llt
                 21, 22, 23, //lrt
                 24, 25, 26, //flb
                 27, 28, 29, //frb
                 30, 31, 32, //rlb
                 33, 34, 35, //rrb
                 36, 37, 38, //blb
                 39, 40, 41, //brb
                 42, 43, 44, //llb
                 45, 46, 47 //lrb
               ];
  return indices;
}
