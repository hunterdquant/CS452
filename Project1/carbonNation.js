/*
  Name: Hunter Quant
  Course: CS452
  Lab: 2
*/

/* Define globals */
var gl;
var shaderProgram;
var arrayOfVertices;
var flatz;
var bubbles;
var keyMapping;
var scoreText;
var timeText;
var time;
var timeRemaining;
var playing

/* Initializes WebGL and globals */
function init() {

  scoreText = document.getElementById("score");
  timeText = document.getElementById("time");
  score = 0;
  time = 60000;

  // Init webgl and specify clipspace.
  var canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {alert("Web gl is not available");}
  gl.viewport(0, 0, 512, 512);
  gl.clearColor(0.9, 0.3, 0.3, 1.0);

  playing = false;
  initFlatz();
  bubbles = [];
  keyMapping = {};

  initBuffer();
  // Initialize shaders and start shader program.
  shaderProgram = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(shaderProgram);

  gameLoop();
}

function timer(time) {
  var start = Date.now();
  return function() {
      return time - (Date.now() - start);
  }
}

/* Draws buffer contents to the screen and calculates vertex transformations. */
function gameLoop() {
  gl.clear( gl.COLOR_BUFFER_BIT );
  if (playing) {
    checkGameTime();
    updateKeyInfo();
    var radius = Math.random();
    if (radius < 0.1)
      generatebubble(radius);
    drawFlatz();
    drawBubblesAndCheckCollision();
  }
  requestAnimFrame(gameLoop);
}

function startNew() {
  score = 0;
  time = 60000;
  initFlatz();
  bubbles = [];
  keyMapping = {};
  scoreText.innerHTML = "Score: 0";
  timeText.innerHTML = "time: 0.0";
  timeRemaining = timer(time);
  playing = true;
}

function checkGameTime() {
  var timeLeft = timeRemaining();
  timeText.innerHTML = "Time Remaining: " + timeLeft/1000;
  if (timeLeft <= 0) {
    timeText.innerHTML = "Time Remaining: " + 0;
    playing = false;
  }
}

function updateScore(bubble) {
  score += (1000*bubble.getRadius());
  scoreText.innerHTML = "Score: " + Math.floor(score);
}

function generatebubble(r) {
  var v = [];
  var n = 16;
  var step = 2*Math.PI/n;
  for (var i = 0; i < n; i++) {
    v.push(vec2(r*Math.cos(i*step), r*Math.sin(i*step)));
  }
  var bubble = {
    vertices: v,
    radius: r,
    x: (Math.random() > .5) ? -1*Math.random() : Math.random(),
    y: -1.25,
    step: r/10,
    popped: false,
    framesTillGone: 50,
    blueValue: Math.random()*0.5 + 0.5,
    greenValue: Math.random()
  };
  bubble.getRadius = function () {
    return 2*Math.PI*this.radius*this.radius;
  }
  bubbles.push(bubble);
}

function initFlatz() {
  flatz = {};
  flatz.theta = 0.0;
  flatz.x = 0;
  flatz.y = 0;
  flatz.body = getFlatzBodyVertices();
  flatz.legs = getFlatzlegVertices();
  flatz.foot = getFlatzFootVertices();
}

function initBuffer() {
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
}

function drawBubblesAndCheckCollision() {
  var color = gl.getUniformLocation(shaderProgram, "color");
  for (var i = bubbles.length - 1; i >= 0; i--) {
    var bubble = bubbles[i];
    if (bubble.y > 1.25) {
      bubbles.splice(i, 1);
      continue;
    }
    if (!bubble.popped && Math.abs(bubble.x - flatz.x) <= bubble.radius + 0.05 && Math.abs(bubble.y - flatz.y) <= bubble.radius + 0.016) {
      updateScore(bubble);
      bubble.popped = true;
    }
    bubble.y += bubble.step;
    var matrix = [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, bubble.x, bubble.y, 1.0];
    var matrixLoc = gl.getUniformLocation(shaderProgram, "M");
    gl.uniformMatrix3fv(matrixLoc, false, matrix);
    gl.uniform4f(color, 0.0, bubble.greenValue, bubble.blueValue, 1.0);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(bubble.vertices), gl.STATIC_DRAW);
    if (bubble.popped) {

      gl.lineWidth(2);
      gl.drawArrays( gl.LINES, 0, bubble.vertices.length);
      bubble.framesTillGone--;
      if (bubble.framesTillGone <= 0) {
        bubbles.splice(i, 1);
      }
    } else {
      gl.drawArrays( gl.TRIANGLE_FAN, 0, bubble.vertices.length);
    }
  }
}

function drawFlatz() {
  var matrix = [Math.cos(flatz.theta), -Math.sin(flatz.theta), 0.0,Math.sin(flatz.theta), Math.cos(flatz.theta), 0.0,flatz.x, flatz.y, 0.0];
  var matrixLoc = gl.getUniformLocation(shaderProgram, "M");
  gl.uniformMatrix3fv(matrixLoc, false, matrix);

  var myPosition = gl.getAttribLocation(shaderProgram, "myPosition");
  gl.vertexAttribPointer(myPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(myPosition);

  gl.bufferData(gl.ARRAY_BUFFER, flatten(flatz.body), gl.STATIC_DRAW);
  var color = gl.getUniformLocation(shaderProgram, "color");
  gl.uniform4f(color, 0.0, 0.9, 0.9, 1.0);
  gl.drawArrays( gl.TRIANGLE_FAN, 0, flatz.body.length);


  gl.lineWidth(4);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(flatz.legs), gl.STATIC_DRAW);
  gl.drawArrays( gl.LINES, 0, flatz.legs.length);

  gl.bufferData(gl.ARRAY_BUFFER, flatten(flatz.foot), gl.STATIC_DRAW);
  var color = gl.getUniformLocation(shaderProgram, "color");
  gl.uniform4f(color, 0.9, 0.9, 0.9, 1.0);
  gl.drawArrays( gl.TRIANGLE_FAN, 0, flatz.foot.length);
}

function updateKeyInfo() {
  if (keyMapping[38] || keyMapping[87]) {
    flatz.theta = 0;
    if (flatz.y < 1)
      flatz.y += 0.015;
  }
  if (keyMapping[40] || keyMapping[83]) {
    flatz.theta = Math.PI;
    if (flatz.y > -1)
      flatz.y -= 0.015;
  }
  if (keyMapping[39] || keyMapping[68]) {
    flatz.theta = Math.PI/2;
    if (flatz.x < 1)
      flatz.x += 0.015;
  }
  if (keyMapping[37] || keyMapping[65]) {
    flatz.theta = -Math.PI/2;
    if (flatz.x > -1)
      flatz.x -= 0.015;
  }
  if ((keyMapping[38] || keyMapping[87]) && (keyMapping[39] || keyMapping[68]))
    flatz.theta = Math.PI/4;
  if ((keyMapping[38] || keyMapping[87]) && (keyMapping[37] || keyMapping[65]))
    flatz.theta = -Math.PI/4;
  if ((keyMapping[40] || keyMapping[83]) && (keyMapping[39] || keyMapping[68]))
    flatz.theta = 3*Math.PI/4;
  if ((keyMapping[40] || keyMapping[83]) && (keyMapping[37] || keyMapping[65]))
    flatz.theta = -3*Math.PI/4;
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

/* Returns an array of vertices */
function getFlatzBodyVertices() {
  var vertices = [];
  vertices.push(vec2(0.05, -0.016));
  vertices.push(vec2(0.05, 0.016));
  vertices.push(vec2(-0.05, 0.016));
  vertices.push(vec2(-0.05, -0.016));
  return vertices;
}
function getFlatzlegVertices() {
  var vertices = [];
  vertices.push(vec2(0.025, -0.04));
  vertices.push(vec2(0.025, -0.016));
  vertices.push(vec2(-0.025, -0.016));
  vertices.push(vec2(-0.025, -0.04));
  return vertices;
}
function getFlatzFootVertices() {
  var vertices = [];
  vertices.push(vec2(0.05, -0.04));
  vertices.push(vec2(0.05, -0.056));
  vertices.push(vec2(-0.05, -0.04));
  vertices.push(vec2(-0.05, -0.056));
  return vertices;
}
