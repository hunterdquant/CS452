/*
  Name: Hunter Quant
  Course: CS452
  Lab: 3
*/

/* Define globals */
// Web gl
var gl;
// Shaders
var shaderProgram;
// Shape Vertices
var arrayOfVertices;
// Vertex colors
var arrayOfVertextColors;
// Indices for triangle vertices
var indexList;
// Rotation values x, y, z
var gamma, beta, alpha;
// Displacement values
var xDisp, yDisp;
// Scale values x, y
var xScale, yScale;
// Rotation flags
var isRotatingX, isRotatingY, isRotatingZ;

/* Initializes WebGL and globals */
function init() {

  // Init webgl and specify clipspace.
  var canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {alert("Web gl is not available");}
  gl.viewport(0, 0, 512, 512);
  gl.clearColor(0.6, 0.6, 0.6, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Set globals to their initial values.
  xDisp = yDisp = 0;
  xScale = yScale = 1.0;
  scaleStep = 0.01;
  dispStep = 0.01;
  rotationStep = 0.1;
  isRotatingX = isRotatingY = isRotatingZ = false;
  gamma = beta = alpha = 0.0;

  // Assign shape vertices.
  arrayOfVertices = getVertices();
  arrayOfVertextColors = getVertexColors();
  indexList = getIndexList();


  // Initialize shaders and start shader program.
  shaderProgram = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(shaderProgram);

  var indexBuffer  = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indexList), gl.STATIC_DRAW);

  var vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(arrayOfVertextColors), gl.STATIC_DRAW);

  var vertexColorLocation = gl.getAttribLocation(shaderProgram, "vertexColor");
  gl.vertexAttribPointer(vertexColorLocation, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vertexColorLocation);

  // Create and bind buffer.
  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(arrayOfVertices), gl.STATIC_DRAW);

  // Enable the vertex shader to access vertex position information.
  var vertexPositionLocation = gl.getAttribLocation(shaderProgram, "vertexPosition");
  gl.vertexAttribPointer(vertexPositionLocation, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vertexPositionLocation);

  render();
}

/* Draws buffer contents to the screen and calculates vertex transformations. */
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  var vertexCount = indexList.length;
  // Matrix to represent a clockwise rotation and a translation to x and y.
  var matrixScale = [xScale, 0, 0, 0, 0, yScale, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  var matrixRotZ = [Math.cos(gamma), -Math.sin(gamma), 0, 0, Math.sin(gamma), Math.cos(gamma), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  var matrixRotY = [Math.cos(beta), 0, -Math.sin(beta), 0, 0, 1, 0, 0, Math.sin(beta), 0, Math.cos(beta), 0, 0, 0, 0, 1];
  var matrixRotX = [1, 0, 0, 0, 0, Math.cos(alpha), -Math.sin(alpha), 0, 0, Math.sin(alpha), Math.cos(alpha), 0, 0, 0, 0, 1];
  var matrixTranslate = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, xDisp, yDisp, 0, 1];

  gamma += isRotatingZ ? 0.015 : 0;
  beta += isRotatingY ? 0.015 : 0;
  alpha += isRotatingX ? 0.015 : 0;


  // Set the uniform matrices.
  var matrixScaleLoc = gl.getUniformLocation(shaderProgram, "MScale");
  gl.uniformMatrix4fv(matrixScaleLoc, false, matrixScale);
  var matrixRotZLoc = gl.getUniformLocation(shaderProgram, "MRotZ");
  gl.uniformMatrix4fv(matrixRotZLoc, false, matrixRotZ);
  var matrixRotYLoc = gl.getUniformLocation(shaderProgram, "MRotY");
  gl.uniformMatrix4fv(matrixRotYLoc, false, matrixRotY);
  var matrixRotXLoc = gl.getUniformLocation(shaderProgram, "MRotX");
  gl.uniformMatrix4fv(matrixRotXLoc, false, matrixRotX);
  var matrixTransLoc = gl.getUniformLocation(shaderProgram, "MTrans");
  gl.uniformMatrix4fv(matrixTransLoc, false, matrixTranslate);

  gl.drawElements( gl.TRIANGLES, vertexCount, gl.UNSIGNED_BYTE, 0);
  requestAnimFrame(render);
}

/* Returns an array of vertices */
function getVertices() {
  var vertices = [];
  vertices.push(vec4(0.0, -0.5, 0.0, 1.0));
  vertices.push(vec4(0.0, 0.5, 0.0, 1.0));
  vertices.push(vec4(0.5, 0.0, 0.0, 1.0));
  vertices.push(vec4(0.75, 0.0, -0.75, 1.0));
  vertices.push(vec4(0.0, 0.0, -0.5, 1.0));
  vertices.push(vec4(-0.75, 0.0, -0.75, 1.0));
  vertices.push(vec4(-0.5, 0.0, 0.0, 1.0));
  vertices.push(vec4(-0.75, 0.0, 0.75, 1.0));
  vertices.push(vec4(0.0, 0.0, 0.5, 1.0));
  vertices.push(vec4(0.75, 0.0, 0.75, 1.0));
  return vertices;
}

function getVertexColors() {
  var vertices = [];
  vertices.push(vec4(1.0, 1.0, 1.0, 1.0));
  vertices.push(vec4(0.0, 0.0, 0.0, 1.0));
  vertices.push(vec4(0.0, 0.1, 0.1, 1.0));
  vertices.push(vec4(0.0, 0.2, 0.2, 1.0));
  vertices.push(vec4(0.0, 0.3, 0.3, 1.0));
  vertices.push(vec4(0.0, 0.4, 0.4, 1.0));
  vertices.push(vec4(0.0, 0.5, 0.5, 1.0));
  vertices.push(vec4(0.0, 0.6, 0.6, 1.0));
  vertices.push(vec4(0.0, 0.7, 0.7, 1.0));
  vertices.push(vec4(0.0, 0.8, 0.8, 1.0));
  return vertices;
}

function getIndexList() {
  var indices = [2, 3, 1,
                 3, 4, 1,
                 4, 5, 1,
                 5, 6, 1,
                 6, 7, 1,
                 7, 8, 1,
                 8, 9, 1,
                 9, 2, 1,
                 2, 9, 0,
                 9, 8, 0,
                 8, 7, 0,
                 7, 6, 0,
                 6, 5, 0,
                 5, 4, 0,
                 4, 3, 0,
                 3, 2, 0];
  return indices;
}

function keyPressed(event) {
  /* Translations */
  if (event.keyCode == 87) {
    yDisp += 0.05;
  }
  if (event.keyCode == 65) {
    xDisp  -= 0.05;
  }
  if (event.keyCode == 83) {
    yDisp -= 0.05;
  }
  if (event.keyCode == 68) {
    xDisp += 0.05;
  }
  /* End translation */
  /* Rotations */
  if (event.keyCode == 90) {
    gamma += 0.05;
  }
  if (event.keyCode == 88) {
    beta +=  0.05;
  }
  if (event.keyCode == 67) {
    alpha += 0.05;
  }


  /* End rotations */
  /* Scaling */
  if (event.keyCode == 37) {
    xScale -= (xScale - 0.05 < 0) ? 0 : 0.05;
  }
  if (event.keyCode == 38) {
    yScale += 0.05;
  }
  if (event.keyCode == 39) {
    xScale += 0.05;
  }
  if (event.keyCode == 40) {
    yScale -= (yScale - 0.05 < 0) ? 0 : 0.05;
  }
  /* End scaling */
}

function toggleZRotation() {
  isRotatingZ = !isRotatingZ;
}

function toggleYRotation() {
  isRotatingY = !isRotatingY;
}

function toggleXRotation() {
  isRotatingX = !isRotatingX;
}

function startRotation() {
  isRotatingZ = true;
  isRotatingY = true;
  isRotatingX = true;
}

function stopRotation() {
  isRotatingZ = false;
  isRotatingY = false;
  isRotatingX = false;
}

function reset() {
  gamma = beta =  alpha = 0;
  xDisp = yDisp = 0;
  xScale = yScale = 1;
}
