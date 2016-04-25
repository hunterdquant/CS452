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
var Porth;
var P;

// Viewer location.
var e;
// Look-at point.
var a;
// Up direction.
var vup;

// Projection bounds
var pl, pr, pt, pb, pn, pf;

var indexBuffer;
var verticesBuffer;
var normalsBuffer;
var texCoordBuffer;

var cubeMap;
var boxTextures;
var images;
var sphereTexture;

// Directional light with its direction, color, and on state.
// diffuse only.
var lightDirection;
var directionColor;
var directionOn;

var radius = 2;
var latBands = 64;
var longBands = 64;

var ellipsoid;
var sphere;
var star;
var box;
var shards;

var isMouseDown;
var mouseX;
var mouseY;

var sceneRotation;
var sceneRotationInv;
var sceneRotationInvTrans;
var sceneAlpha;
var sceneBeta;
var scene;

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

  sceneAlpha = 0.0;
  sceneBeta = 0.0;

  scene = "one";

  setModelView();
  setProjection();
  setUpLighting();
  createGeometry();
  createBuffers();
  initTextures();

  renderScene1();
}

function setModelView() {
  // viewer point, look-at point, up direction.
  e = vec3(0.0, 0.0, 8.0);
  a = vec3(0.0, 0.0, 0.0);
  vup = vec3(0.0, 1.0, 0.0);

  calcMAndMinv();
}

function setProjection() {

  // Set bounds for projection.
  viewerDist = length(subtract(e, a));
  near = viewerDist - 6;
  far = viewerDist + 64;

  // Perspecive projection bounds.
  perTop = near * Math.tan(Math.PI / 4);
  perBottom = -perTop;
  perRight = perTop;
  perLeft = -perRight;

  getPerspective();
}

function setUpLighting() {
  // Point light source position.
  p0 = vec3(1.0, 1.0, 1.0);
  // Point light source intensity.
  Ia = vec3(0.5, 0.8, 0.5);
  Id = vec3(0.4, 0.8, 0.3);
  Is = vec3(1.0, 1.0, 1.0);

  // Point light source reflectance coefficients.
  ka = vec3(0.5, 0.5, 0.6);
  kd = vec3(0.8, 0.6, 0.6);
  ks = vec3(1.0, 1.0, 1.0);

  // Shine value and specular state.
  alpha = 8.0;

  // Direction and color value for the diffuse directional light.
  lightDirection = vec3(0.0, 0.0, 1.0);
  directionColor = vec3(0.5, 0.7, 0.7);
  directionOn = true;
}


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
  sphere.program = initShaders(gl, "ellipsoid-vertex-shader", "ellipsoid-fragment-shader");
  sphere.vertDim = 3;
  sphere.numElems = sphereInds.length;

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
}

function createBuffers() {

  indexBuffer = gl.createBuffer();
  verticesBuffer = gl.createBuffer();
  normalsBuffer = gl.createBuffer();
  texCoordBuffer = gl.createBuffer();
}

function drawBox() {

  gl.useProgram(box.program);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(box.indexList), gl.STATIC_DRAW);

  // Insert your code here
  var MLoc = gl.getUniformLocation(box.program, "M");
  gl.uniformMatrix4fv(MLoc, false, M);

  var SRotLoc = gl.getUniformLocation(box.program, "SRot");
  gl.uniformMatrix4fv(SRotLoc, false, flatten(sceneRotation));

  var MinvTransLoc = gl.getUniformLocation(box.program, "MinvTrans");
  gl.uniformMatrix4fv(MinvTransLoc, false, MinvTrans);

  var MinvLoc = gl.getUniformLocation(box.program, "Minv");
  gl.uniformMatrix4fv(MinvLoc, false, Minv);

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

  // Insert your code here
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

  var SRotInvTransLoc = gl.getUniformLocation(ellipsoid.program, "SRotInvTrans");
  gl.uniformMatrix4fv(SRotInvTransLoc, false, flatten(sceneRotationInvTrans));

  PLoc = gl.getUniformLocation(ellipsoid.program, "P");
  gl.uniformMatrix4fv(PLoc, false, P);

  alphaLoc = gl.getUniformLocation(ellipsoid.program, "alpha");
  gl.uniform1f(alphaLoc, alpha);

  cubeTexMapLoc = gl.getUniformLocation(ellipsoid.program, "cubeTexMap");
  gl.uniform1i(cubeTexMapLoc, 0);

  gl.drawElements(gl.TRIANGLES, ellipsoid.numElems, gl.UNSIGNED_SHORT, 0);
}

function drawsphere() {

  gl.useProgram(sphere.program);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);

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

  // Insert your code here
  var MLoc = gl.getUniformLocation(sphere.program, "M");
  gl.uniformMatrix4fv(MLoc, false, M);

  var SRotLoc = gl.getUniformLocation(sphere.program, "SRot");
  gl.uniformMatrix4fv(SRotLoc, false, flatten(sceneRotation));

  var MinvTransLoc = gl.getUniformLocation(sphere.program, "MinvTrans");
  gl.uniformMatrix4fv(MinvTransLoc, false, MinvTrans);

  var MinvLoc = gl.getUniformLocation(sphere.program, "Minv");
  gl.uniformMatrix4fv(MinvLoc, false, Minv);

  var SRotInvLoc = gl.getUniformLocation(sphere.program, "SRotInv");
  gl.uniformMatrix4fv(SRotInvLoc, false, flatten(sceneRotationInv));

  var SRotInvTransLoc = gl.getUniformLocation(sphere.program, "SRotInvTrans");
  gl.uniformMatrix4fv(SRotInvTransLoc, false, flatten(sceneRotationInvTrans));

  PLoc = gl.getUniformLocation(sphere.program, "P");
  gl.uniformMatrix4fv(PLoc, false, P);

  gl.drawElements(gl.TRIANGLES, sphere.numElems, gl.UNSIGNED_SHORT, 0);
}

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
        let threeTimesInd = 3 * indexList[j];
        let p0 = vec3(vertices[threeTimesInd], vertices[threeTimesInd + 1], vertices[threeTimesInd + 2]);
        threeTimesInd = 3 * indexList[j + 1];
        let p1 = vec3(vertices[threeTimesInd], vertices[threeTimesInd + 1], vertices[threeTimesInd + 2]);
        threeTimesInd = 3 * indexList[j + 2];
        let p2 = vec3(vertices[threeTimesInd], vertices[threeTimesInd + 1], vertices[threeTimesInd + 2]);
        let v1 = subtract(p1, p0);
        let v2 = subtract(p2, p0);
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

  for (var i = 0; i < 6; i++) {
    textureImage = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureImage);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[i]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    boxTextures.push(textureImage);
  }

  sphereTexture = gl.createTexture();
}

function renderScene1() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  drawBox();
  drawEllipsoid();
  if (scene === "one") {
    requestAnimFrame(renderScene1);
  }
}

function renderScene2() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  drawEllipsoid();
  if (scene === "two") {
    requestAnimFrame(renderScene2);
  }
}

function renderScene3() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  drawBox();
  drawEllipsoid();
  if (scene === "three") {
    requestAnimFrame(renderScene3);
  }
}

/* Sets the matrices used for transformations. */
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

/* Sets the projection matrices. */
function getPerspective() {
  P = [
    near / perRight, 0, 0, 0,
    0, near / perTop, 0, 0,
    0, 0, -(far + near) / (far - near), -1,
    0, 0, -(2 * far * near) / (far - near), 0
  ];
}

function onMouseDown(event) {
  isMouseDown = true;
  mouseX = event.clientX;
  mouseY = event.clientY;
}

function onMouseUp(event) {
  isMouseDown = false;
}

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
    sceneRotationInvTrans = transpose(sceneRotationInv);
    mouseX = x;
    mouseY = y;
  }
}

function changeScene(event) {
  scene = "two";
  renderScene2();
}
