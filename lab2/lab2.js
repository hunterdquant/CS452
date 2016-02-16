/*
  Name: Hunter Quant
  Course: CS452
  Lab: 2
*/

/* Define globals */
var gl;
var shaderProgram;
var arrayOfVertices;
// Rotation value
var theta;
// Displacement values
var x, y;
// Displacement step values
var xStep, yStep;
// Displacement step scale value
var stepScale;
// Rotation flag
var isRotating;
// Base step value
var baseStep;

/* Initializes WebGL and globals */
function init() {

  // Init webgl and specify clipspace.
  var canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {alert("Web gl is not available");}
  gl.viewport(0, 0, 512, 512);
  gl.clearColor(0.6, 0.6, 0.6, 1.0);

  // Set globals to their initial values.
  x = y = 0;
  baseStep = 0.001;
  xStep = baseStep;
  yStep = 0;
  stepScale = 1;
  isRotating = false;
  theta = 0.0;

  // Assign shape vertices.
  arrayOfVertices = getVertices();

  // Create and bind buffer.
  var bufferId = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(arrayOfVertices), gl.STATIC_DRAW);

  // Initialize shaders and start shader program.
  shaderProgram = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(shaderProgram);

  // Enable the vertex shader to access vertex position information.
  var myPosition = gl.getAttribLocation(shaderProgram, "myPosition");
  gl.vertexAttribPointer(myPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(myPosition);

  // Set uniform fragment color.
  var color = gl.getUniformLocation(shaderProgram, "color");
  gl.uniform4f(color, 0.0, 0.9, 0.9, 1.0);

  // Set animation
  setInterval(render, 1);
}

/* Draws buffer contents to the screen and calculates vertex transformations. */
function render() {

  // Increment theta if rotating.
  theta += (isRotating) ? 0.01 : 0;

  // Increment displacement values.
  x += xStep*stepScale;
  y += yStep*stepScale;

  // Matrix to represent a clockwise rotation and a translation to x and y.
  var matrix = [Math.cos(theta), -Math.sin(theta), 0.0,Math.sin(theta), Math.cos(theta), 0.0,x, y, 0.0];

  // Set the uniform matrix.
  var matrixLoc = gl.getUniformLocation(shaderProgram, "M");
  gl.uniformMatrix3fv(matrixLoc, false, matrix);

  // Draw buffer.
  gl.clear( gl.COLOR_BUFFER_BIT );
  gl.drawArrays( gl.TRIANGLE_FAN, 0, arrayOfVertices.length);
}

/* Toggles rotation status */
function toggleRotation() {
  // Simply assign the flag to its opposite.
  isRotating = !isRotating;
}

/* Sets the displacement values to the mouse click location */
function translateToMouse(event) {
  // Get coordinates relative to the canvas.
  var clickLocX = event.offsetX;
  var clickLocY = event.offsetY;
  // Convert to clipspace coordinates.
  x = 2*clickLocX/512.0 - 1;
  y = -(2*clickLocY/512.0 - 1);
}

/* Changes the direction of movement */
function changeDirection(event) {
  if (event.keyCode == 87) {
    xStep = 0.0;
    yStep = baseStep;
  } else if (event.keyCode == 65) {
    xStep = -baseStep;
    yStep = 0.0;
  }
  if (event.keyCode == 83) {
    xStep = 0.0;
    yStep = -baseStep;
  } else if (event.keyCode == 68) {
    xStep = baseStep;
    yStep = 0.0;
  }
}

/* Increases the movement speed */
function increaseSpeed() {
  if (stepScale < 10) {
    stepScale += 0.5;
  }
}

/* Decreases the movement speed */
function decreaseSpeed() {
  if (stepScale > 0) {
    stepScale -= 0.5;
  }
}

/* Returns an array of vertices */
function getVertices() {
  var vertices = [];
  vertices.push(vec2(0.0, 0.0));
  vertices.push(vec2(0.2, 0.0));
  vertices.push(vec2(0.05, 0.05));
  vertices.push(vec2(0.0, 0.2));
  vertices.push(vec2(-0.05, 0.05));
  vertices.push(vec2(-0.2, 0));
  vertices.push(vec2(-0.05, -0.05));
  vertices.push(vec2(0.0, -0.2));
  vertices.push(vec2(0.05, -0.05));
  vertices.push(vec2(0.2, 0.0));
  return vertices;
}
