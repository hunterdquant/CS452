// Global so other functions can access.
var myShaderProgram;
var theta;
var gl;
var keepRunning;
var x, y;
var displacementLoc;
function drawSquare() {
    theta = 0.0;
    keepRunning = 1;
    x = y = 0;
    var canvas=document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);

    if (!gl) { alert( "WebGL is not available" ); }

    gl.viewport( 0, 0, 512, 512 );

    gl.clearColor( 1.0, 0.0, 0.0, 1.0 );

    var pointA = vec2( -.1, .1 );
    var pointB = vec2( .1 , .1 );
    var pointC = vec2( .1 ,-.1 );
    var pointD = vec2( -.1,-.1 );

    var arrayOfPointsForSquare =
    [pointA,pointB,pointC,pointD];

    arrayOfPointsForSquare.push( pointA );
    arrayOfPointsForSquare.push( pointB );
    arrayOfPointsForSquare.push( pointC );
    arrayOfPointsForSquare.push( pointD );

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(arrayOfPointsForSquare), gl.STATIC_DRAW );

    myShaderProgram = initShaders( gl,"vertex-shader", "fragment-shader" );
    gl.useProgram( myShaderProgram );
    var myPosition = gl.getAttribLocation( myShaderProgram, "myPosition" );
    gl.vertexAttribPointer( myPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( myPosition );

    setInterval(render, 0.1);
}

function render() {
  gl.clear( gl.COLOR_BUFFER_BIT );
  gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );
  var thetaLoc = gl.getUniformLocation(myShaderProgram, "theta");
  gl.uniform1f(thetaLoc, theta);
  theta += 0.01 * keepRunning;
}

function functionStartStop() {
  keepRunning = (keepRunning === 1) ? 0 : 1;
}

function myMouseWasClicked(event) {
  var clickx = event.offsetX;
  var clicky = event.offsetY;
  x = 2*clickx/512.0 - 1;
  y = -(2*clicky/512.0 - 1);
  displacementLoc =  gl.getUniformLocation(myShaderProgram, "displacement");
  gl.uniform2f(displacementLoc, x, y);
}

function myKeyWasPressed(event) {
  if (event.keyCode == 65) {
    x = x - 0.01;
  } else if (event.keyCode == 68) {
    x = x + 0.01;
  }
  if (event.keyCode == 83) {
    y = y - 0.01;
  } else if (event.keyCode == 87) {
    y = y + 0.01;
  }

  displacementLoc =  gl.getUniformLocation(myShaderProgram, "displacement");
  gl.uniform2f(displacementLoc, x, y);
}
