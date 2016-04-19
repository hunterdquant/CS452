// Name: Hunter Quant

// GL
var gl;
var canvas;

// A matrix representing the model view transformation transpoed and inverse.
// for lighting calculations.
var MinvTrans;
// A matrix representing a model view transformation.
var M;

// Matrices representing a orthogonal and perspective projection.
var Porth;
var P;

// Viewer location.
var e;
// Look-at point.
var a;
// Up direction.
var vup;

var perLeft, perRight, perTop, perBottom;

// Distance bounds
var near, far;

var indexBuffer;
var verticesBuffer;
var normalsBuffer;
var texCoordBuffer;

// Uniform locations that need to be altered.
var PLoc, alphaLoc, IaLoc, IdLoc, IsLoc, kaLoc, kdLoc, ksLoc, p0Loc;

// Point light along with its intensity, reflectance coefficients, and on state.
var p0;
var Ia, Id, Is;
var ka, kd, ks;

// Shiny factor.
var alpha;

// Directional light with its direction, color, and on state.
// diffuse only.
var lightDirection;
var directionColor;
var directionOn;

var radius = 1;
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
var sceneAlpha;
var sceneBeta;

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

  isMouseDown = false;
  mouseX = null;
  mouseY = null;
  sceneRotation = mat4(
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0
  );
  sceneAlpha = 0.0;
  sceneBeta = 0.0;

  setModelView();
  setProjection();
  setUpLighting();
  createGeometry();
  createBuffers();
  initTextures();

  renderObjects();
};

function setModelView() {
  // viewer point, look-at point, up direction.
  e = vec3(0.0, 0.0, 3.0);
  a = vec3(0.0, 0.0, 0.0);
  vup = vec3(0.0, 1.0, 0.0);

  calcMAndMinv();
}

function setProjection() {

  // Set bounds for projection.
  viewerDist = length(subtract(e, a));
  near = viewerDist - 2;
  far = viewerDist + 2;

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
  var ellipsoidVerts = getSphereVertices(true);
  var sphereInds = getSphereIndices();
  ellipsoid = {
    vertices: ellipsoidVerts,
    indexList: sphereInds,
    normals: getNormals(ellipsoidVerts, sphereInds),
    program: initShaders(gl, "ellipsoid-vertex-shader", "ellipsoid-fragment-shader"),
    vertDim: 3,
    numElems: sphereInds.length
  }

  box = {
    front: [-2.0, -2.0, -2.0,
            2.0, -2.0, -2.0,
            2.0, 2.0, -2.0,
            -2.0, 2.0, -2.0],
    back: [2.0, -2.0, 2.0,
           -2.0, -2.0, 2.0,
            -2.0, 2.0, 2.0,
            2.0, 2.0, 2.0],
    left: [-2.0, -2.0, 2.0,
            -2.0, -2.0, -2.0,
            -2.0, 2.0, -2.0,
            -2.0, 2.0, 2.0],
    right: [2.0, -2.0, -2.0,
            2.0, -2.0, 2.0,
            2.0, 2.0, 2.0,
            2.0, 2.0, -2.0],
    top: [-2.0, 2.0, -2.0,
          2.0, 2.0, -2.0,
          2.0, 2.0, 2.0,
          -2.0, 2.0, 2.0],
    bottom: [-2.0, -2.0, 2.0,
              2.0, -2.0, 2.0,
              2.0, -2.0, -2.0,
              -2.0, -2.0, -2.0],
    indexList: [0, 1, 2,
                0, 2, 3],
    texCoords: [0.0, 0.0,
                0.0, 1.0,
                1.0, 1.0,
                1.0, 0.0],
    program: initShaders(gl, "box-vertex-shader", "box-fragment-shader"),
    vertDim: 3,
    numElems: 6
  }
}

function createBuffers() {

  indexBuffer = gl.createBuffer();
  verticesBuffer = gl.createBuffer();
  normalsBuffer = gl.createBuffer();
  texCoordBuffer = gl.createBuffer();
}

function drawBox() {
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(box.texCoords), gl.STATIC_DRAW);

  var texCoordLocation = gl.getAttribLocation(shaderProgram, "texCoord");
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(texCoordLocation);

  gl.useProgram(box.program);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(box.indexList), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(box.vertices), gl.STATIC_DRAW);
  var vertexPosition = gl.getAttribLocation(box.program, "vertexPosition");
  gl.vertexAttribPointer(vertexPosition, box.vertDim, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vertexPosition);

  gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(box.normals)), gl.STATIC_DRAW);
  var nvPosition = gl.getAttribLocation(box.program, "nv");
  gl.vertexAttribPointer(nvPosition, box.vertDim, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(nvPosition);

  // Insert your code here
  var MLoc = gl.getUniformLocation(box.program, "M");
  gl.uniformMatrix4fv(MLoc, false, M);

  var SRotLoc = gl.getUniformLocation(box.program, "SRot");
  gl.uniformMatrix4fv(SRotLoc, false, flatten(sceneRotation));

  var MinvTransLoc = gl.getUniformLocation(box.program, "MinvTrans");
  gl.uniformMatrix4fv(MinvTransLoc, false, MinvTrans);

  PLoc = gl.getUniformLocation(box.program, "P");
  gl.uniformMatrix4fv(PLoc, false, P);

  gl.drawElements(gl.TRIANGLES, box.numElems, gl.UNSIGNED_SHORT, 0);
}

function drawEllipsoid() {

  gl.useProgram(ellipsoid.program);

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

  PLoc = gl.getUniformLocation(ellipsoid.program, "P");
  gl.uniformMatrix4fv(PLoc, false, P);
  getNeededLocations();
  enablePointLight();
  enableDirectionalLight();

  alphaLoc = gl.getUniformLocation(ellipsoid.program, "alpha");
  gl.uniform1f(alphaLoc, alpha);


  cubeTexMapLoc = gl.getUniformLocation(ellipsoid.program, "cubeTexMap");
  gl.uniform1i(cubeTexMapLoc, 0);

  gl.drawElements(gl.TRIANGLES, ellipsoid.numElems, gl.UNSIGNED_SHORT, 0);
}

function getSphereVertices(isEllipse) {

  var vertPositions = [];
  var texCoords = [];
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
        texCoords.push(1 - (longNumber / longBands));
        texCoords.push(1 - (latNumber / latBands));
      }
      vertPositions.push(radius * x);
      if (isEllipse) {
        vertPositions.push(2 * radius * y);
      } else {
        vertPositions.push(radius * y);
      }
      vertPositions.push(radius * z);
    }
  }
  return vertPositions;
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
    for (var j = 0; j < faceNormals.length; j++) {
      vertNormal = add(vertNormal, faceNormals[j]);
    }
    vertNormal = normalize(vertNormal);
    vertNormals.push(vertNormal);
  }

  return vertNormals;
}

function initTextures() {
  var frontImage = document.getElementById("front");
  var rightImage = document.getElementById("right");
  var backImage = document.getElementById("back");
  var leftImage = document.getElementById("left");
  var topImage = document.getElementById("top");
  var bottomImage = document.getElementById("bottom");

  var cubeMap = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, rightImage);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, leftImage);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, topImage);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, bottomImage);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, frontImage);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, backImage);
}

function renderObjects() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  drawEllipsoid();
  requestAnimFrame(renderObjects);
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

/* Retrieves uniform locations */
function getNeededLocations() {
  p0Loc = gl.getUniformLocation(ellipsoid.program, "p0");
  IaLoc = gl.getUniformLocation(ellipsoid.program, "Ia");
  IdLoc = gl.getUniformLocation(ellipsoid.program, "Id");
  IsLoc = gl.getUniformLocation(ellipsoid.program, "Is");
  kaLoc = gl.getUniformLocation(ellipsoid.program, "ka");
  kdLoc = gl.getUniformLocation(ellipsoid.program, "kd");
  ksLoc = gl.getUniformLocation(ellipsoid.program, "ks");
}

/* Enables the point light */
function enablePointLight() {
  gl.uniform3f(p0Loc, p0[0], p0[1], p0[2]);
  gl.uniform3f(IaLoc, Ia[0], Ia[1], Ia[2]);
  gl.uniform3f(IdLoc, Id[0], Id[1], Id[2]);
  gl.uniform3f(IsLoc, Is[0], Is[1], Is[2]);
  gl.uniform3f(kaLoc, ka[0], ka[1], ka[2]);
  gl.uniform3f(kdLoc, kd[0], kd[1], kd[2]);
  gl.uniform3f(ksLoc, ks[0], ks[1], ks[2]);
}

/* Disables the point light */
function disablePointLight() {
  gl.uniform3f(kaLoc, 0.0, 0.0, 0.0);
  gl.uniform3f(kdLoc, 0.0, 0.0, 0.0);
  gl.uniform3f(ksLoc, 0.0, 0.0, 0.0);
}

/* Enables directional light */
function enableDirectionalLight() {
  lightDirectionLoc = gl.getUniformLocation(ellipsoid.program, "lightDirection");
  gl.uniform3f(lightDirectionLoc, lightDirection[0], lightDirection[1], lightDirection[2]);

  directionColorLoc = gl.getUniformLocation(ellipsoid.program, "directionColor");
  gl.uniform3f(directionColorLoc, directionColor[0], directionColor[1], directionColor[2]);
}

/* Disables directional light */
function disableDirectionalLight() {
  gl.uniform3f(directionColorLoc, 0.0, 0.0, 0.0);
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
    var changeY = (y - mouseY)*Math.PI/canvas.height;

    var s = Math.sin(changeX);
    var c = Math.cos(changeX);
    var yRot = mat4(c, 0.0, s, 0.0,
                    0.0, 1.0, 0.0, 0.0,
                    -s, 0.0, c, 0.0,
                    0.0, 0.0, 0.0, 1.0);


    s = Math.sin(changeY);
    c = Math.cos(changeY);
    var xRot = mat4(1.0, 0.0, 0.0, 0.0,
                    0.0, c, s, 0.0,
                    0.0, -s, c, 0.0,
                    0.0, 0.0, 0.0, 1.0);


    sceneRotation = mult(mult(yRot, xRot), sceneRotation);

    mouseX = x;
    mouseY = y;
  }
}
