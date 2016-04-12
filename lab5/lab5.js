/*
  Name: Hunter Quant
  Course: CS452
  Lab: 5
*/

/* Define globals */
// Web gl
var gl;
// Shaders
var shaderProgram;
// Shape Vertices
var arrayOfVertices;
// Vertex colors
var arrayOfTexCoords;
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

var matrixScaleLoc;
var matrixRotZLoc;
var matrixRotYLoc;
var matrixRotXLoc;
var matrixTransLoc;

var textureImage;
var image;

/* Initializes WebGL and globals */
function init() {

  // Init webgl and specify clipspace.
  var canvas = document.getElementById("gl-canvas");
  image = document.getElementById("texture");
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
  arrayOfTexCoords = getTexCoords();
  indexList = getIndexList();

  // Initialize shaders and start shader program.
  shaderProgram = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(shaderProgram);

  textureImage = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, textureImage);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  var indexBuffer  = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indexList), gl.STATIC_DRAW);

  // Create and bind buffer.
  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrayOfVertices), gl.STATIC_DRAW);

  // Enable the vertex shader to access vertex position information.
  var vertexPositionLocation = gl.getAttribLocation(shaderProgram, "vertexPosition");
  gl.vertexAttribPointer(vertexPositionLocation, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vertexPositionLocation);

  var texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrayOfTexCoords), gl.STATIC_DRAW);

  var texCoordLocation = gl.getAttribLocation(shaderProgram, "texCoord");
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(texCoordLocation);

  matrixScaleLoc = gl.getUniformLocation(shaderProgram, "MScale");
  matrixRotZLoc = gl.getUniformLocation(shaderProgram, "MRotZ");
  matrixRotYLoc = gl.getUniformLocation(shaderProgram, "MRotY");
  matrixRotXLoc = gl.getUniformLocation(shaderProgram, "MRotX");
  matrixTransLoc = gl.getUniformLocation(shaderProgram, "MTrans");

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
  gl.uniformMatrix4fv(matrixScaleLoc, false, matrixScale);
  gl.uniformMatrix4fv(matrixRotZLoc, false, matrixRotZ);
  gl.uniformMatrix4fv(matrixRotYLoc, false, matrixRotY);
  gl.uniformMatrix4fv(matrixRotXLoc, false, matrixRotX);
  gl.uniformMatrix4fv(matrixTransLoc, false, matrixTranslate);

  gl.drawElements( gl.TRIANGLES, vertexCount, gl.UNSIGNED_BYTE, 0);
  requestAnimFrame(render);
}

/* Returns an array of vertices */
function getVertices() {
  var vertices = [
                  //front-left-top
                  -0.75, 0.0, 0.75, 1.0,
                  0.0, 0.0, 0.5, 1.0,
                  0.0, 0.5, 0.0, 1.0,
                  //front-right-top
                  0.0, 0.0, 0.5, 1.0,
                  0.75, 0.0, 0.75, 1.0,
                  0.0, 0.5, 0.0, 1.0,
                  //right-left-top
                  0.75, 0.0, 0.75, 1.0,
                  0.5, 0.0, 0.0, 1.0,
                  0.0, 0.5, 0.0, 1.0,
                  //right-right-top
                  0.5, 0.0, 0.0, 1.0,
                  0.75, 0.0, -0.75, 1.0,
                  0.0, 0.5, 0.0, 1.0,
                  //back-left-top
                  0.75, 0.0, -0.75, 1.0,
                  0.0, 0.0, -0.5, 1.0,
                  0.0, 0.5, 0.0, 1.0,
                  //back-right-top
                  0.0, 0.0, -0.5, 1.0,
                  -0.75, 0.0, -0.75, 1.0,
                  0.0, 0.5, 0.0, 1.0,
                  //left-left-top
                  -0.75, 0.0, -0.75, 1.0,
                  -0.5, 0.0, 0.0, 1.0,
                  0.0, 0.5, 0.0, 1.0,
                  //left-right-top
                  -0.5, 0.0, 0.0, 1.0,
                  -0.75, 0.0, 0.75, 1.0,
                  0.0, 0.5, 0.0, 1.0,

                  //front-left-bottom
                  -0.75, 0.0, 0.75, 1.0,
                  0.0, -0.5, 0.0, 1.0,
                  0.0, 0.0, 0.5, 1.0,
                  //front-right-bottom
                  0.0, -0.5, 0.0, 1.0,
                  0.75, 0.0, 0.75, 1.0,
                  0.0, 0.0, 0.5, 1.0,
                  //right-left-bottom
                  0.75, 0.0, 0.75, 1.0,
                  0.0, -0.5, 0.0, 1.0,
                  0.5, 0.0, 0.0, 1.0,
                  //right-right-bottom
                  0.0, -0.5, 0.0, 1.0,
                  0.75, 0.0, -0.75, 1.0,
                  0.5, 0.0, 0.0, 1.0,
                  //back-left-bottom
                  0.75, 0.0, -0.75, 1.0,
                  0.0, -0.5, 0.0, 1.0,
                  0.0, 0.0, -0.5, 1.0,
                  //back-right-bottom
                  0.0, -0.5, 0.0, 1.0,
                  -0.75, 0.0, -0.75, 1.0,
                  0.0, 0.0, -0.5, 1.0,
                  //left-left-bottom
                  -0.75, 0.0, -0.75, 1.0,
                  0.0, -0.5, 0.0, 1.0,
                  -0.5, 0.0, 0.0, 1.0,
                  //left-right-bottom
                  0.0, -0.5, 0.0, 1.0,
                  -0.75, 0.0, 0.75, 1.0,
                  -0.5, 0.0, 0.0, 1.0
                ];
  return vertices;
}

function getTexCoords() {
  var coords = [
                //flt
                0.0, 0.5,
                0.41, 0.41,
                0.5, 0.5,
                //frt
                0.5, 0.0,
                0.5, 0.5,
                0.41, 0.41,
                //rlt
                0.0, 0.5,
                0.41, 0.41,
                0.5, 0.5,
                //rrt
                0.5, 0.0,
                0.5, 0.5,
                0.41, 0.41,
                //blt
                0.0, 0.5,
                0.41, 0.41,
                0.5, 0.5,
                //brt
                0.5, 0.0,
                0.5, 0.5,
                0.41, 0.41,
                //llt
                0.0, 0.5,
                0.41, 0.41,
                0.5, 0.5,
                //lrt
                0.5, 0.0,
                0.5, 0.5,
                0.41, 0.41,
                //flb
                0.5, 0.0,
                0.5, 0.5,
                0.41, 0.41,
                //frb
                0.0, 0.5,
                0.41, 0.41,
                0.5, 0.5,
                //rlb
                0.5, 0.0,
                0.5, 0.5,
                0.41, 0.41,
                //rrb
                0.0, 0.5,
                0.41, 0.41,
                0.5, 0.5,
                //blb
                0.5, 0.0,
                0.5, 0.5,
                0.41, 0.41,
                //brb
                0.0, 0.5,
                0.41, 0.41,
                0.5, 0.5,
                //llb
                0.5, 0.0,
                0.5, 0.5,
                0.41, 0.41,
                //lrb
                0.0, 0.5,
                0.41, 0.41,
                0.5, 0.5
  ];
  return coords;
}

function getIndexList() {
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
