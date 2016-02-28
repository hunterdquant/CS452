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
var flatzTheta;
// Displacement values
var flatzX, flatzY;
// Displacement step values
var xStep, yStep;
// Displacement step scale value
var stepScale;
// Rotation flag
var isRotating;
// Base step value
var baseStep;

var keyMapping;

/* Initializes WebGL and globals */
function init() {

  // Init webgl and specify clipspace.
  var canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {alert("Web gl is not available");}
  gl.viewport(0, 0, 512, 512);
  gl.clearColor(0.9, 0.3, 0.3, 1.0);

  // Set globals to their initial values.
  flatzX = flatzY = 0;
  baseStep = 0.001;
  xStep = baseStep;
  yStep = 0;
  stepScale = 1;
  isRotating = false;
  flatzTheta = 0.0;
  keyMapping = {};

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
  updateKeyInfo();
  // Matrix to represent a clockwise rotation and a translation to x and y.
  var matrix = [Math.cos(flatzTheta), -Math.sin(flatzTheta), 0.0,Math.sin(flatzTheta), Math.cos(flatzTheta), 0.0,flatzX, flatzY, 0.0];

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

function updateKeyInfo() {
  if (keyMapping[38] || keyMapping[87]) {
    flatzTheta = 0;
    if (flatzY < 1)
      flatzY += 0.005;
  }
  if (keyMapping[40] || keyMapping[83]) {
    flatzTheta = Math.PI;
    if (flatzY > -1)
      flatzY -= 0.005;
  }
  if (keyMapping[39] || keyMapping[68]) {
    flatzTheta = -Math.PI/2;
    if (flatzX < 1)
      flatzX += 0.005;
  }
  if (keyMapping[37] || keyMapping[65]) {
    flatzTheta = Math.PI/2;
    if (flatzX > -1)
      flatzX -= 0.005;
  }
  if ((keyMapping[38] || keyMapping[87]) && (keyMapping[39] || keyMapping[68]))
    flatzTheta = Math.PI/4;
  if ((keyMapping[38] || keyMapping[87]) && (keyMapping[37] || keyMapping[65]))
    flatzTheta = -Math.PI/4;
  if ((keyMapping[40] || keyMapping[83]) && (keyMapping[39] || keyMapping[68]))
    flatzTheta = 3*Math.PI/4;
  if ((keyMapping[40] || keyMapping[83]) && (keyMapping[37] || keyMapping[65]))
    flatzTheta = -3*Math.PI/4;
}

/* Changes the direction of movement */
function keyDown(evemt) {
  var key = event.keyCode;
  if (key === 38 || key === 39 || key === 40 || key === 37 ||
      key === 87 || key === 83 || key === 65 || key === 68)
    keyMapping[key] = true;
}

function keyUp(evemt) {
  var key = event.keyCode;
  if (key === 38 || key === 39 || key === 40 || key === 37 ||
      key === 87 || key === 83 || key === 65 || key === 68)
      keyMapping[key] = false;
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
  vertices.push(vec2(0.05, -0.016));
  vertices.push(vec2(0.05, 0.016));
  vertices.push(vec2(-0.05, 0.016));
  vertices.push(vec2(-0.05, -0.016));

  return vertices;
}
