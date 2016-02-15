//////////////////
/* Start Jan 19 */
//////////////////

// Contains nothing at the moment, we will fill this in class.
function drawCircle() {

  // document refers to the linking html file
  var canvas = document.getElementById("gl-canvas");
  // Create drawable environment on canvas.
  var gl = WebGLUtils.setupWebGL(canvas);
  // Cheacks for null
  if (!gl) {
    alert("WebGL is not available.");
  }

  // Defines the clipping space. args - bottom x,y and height and width. origin is bottom left of canvas.
  gl.viewport(0, 0, 512, 512);
  // Canvas coordinates go from (0,0) to (512, 512)
  // clipspace coordinates go from (-1,-1) to (1, 1)
  // Simple conversion betweem the two coordinate systems.
  // Conversion (x, y) -> (2(x-xs)/W-1, 2(y-ys)/H-1)
  // We will work in clipspace

  // In webgl colors are converted from 0-255 to 0-1 (ratios)
  gl.clearColor(1.0, 0, 0, 1.0);
  // Different buffer bits. depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Time to draw a triangle.
  // 3 vertices connected by 3 lines.

  //////////////////
  /* Start Jan 21 */
  //////////////////

  // We need 3 points with the specified line connections.
  // We are going to use vectors to denote points.
  // MV.js has vector functions for us.
  // ex - var point0 = vec2(0, 0);
  var arrayOfPointsForCircle = [];
  var xstart = -1;
  var xend = 1;
  var n = 1024;
  var i = 0;
  var xstep = (xend - xstart) / (n-1);

  var x, y, myPoint;
  for (i = 0; i < n; i++) {
    x = xstart + xstep*i;
    y = Math.sqrt(1.0 - x*x);
    myPoint = vec2(x, y);
    arrayOfPointsForCircle.push(myPoint)
  }
  for (i = 0; i < n; i++) {
    x = xstart + xstep*i;
    y = Math.sqrt(1.0 - x*x);
    myPoint = vec2(x, -y);
    arrayOfPointsForCircle.push(myPoint)
  }

  /* or
    var arrayOfPointsForTriangle = [];
    arrayOfPointsForTriangle.push(point0);
    etc acts like stack/queue
  */

  // Instantiate a buffer
  var bufferId = gl.createBuffer();
  // Bind that buffer to buffer target array. Informs gpu of buffer type.
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
  // Fills buffer with data. Converts our vectors to data more suitable for gpu use.
  // Args - target buffer, our converted vectors, draw type.
  gl.bufferData(gl.ARRAY_BUFFER, flatten(arrayOfPointsForCircle), gl.STATIC_DRAW);
  /* draw types:
    STATIC_DRAW - Data written once to buffer use many times.
    STREAM_DRAW - Data written once to buffer use few times.
    DYNAMIC_DRAW - Data written many times to buffer used many times.
  */

  // Shaders are scripts that preform operations on our vertices.
  // Shader - alters imformation
  // Fragment - are pixels fit to a shape
  // Shaders are being written in html file as scripts.
  // vertex shader transformation on all vertices here.
  // Fragment shader transformation on all pixels

  // Sends each executable to the gpu.
  // This javascript is run on cpu, but graphics are done on gpu.
  // It's a seperate program.
  var myShaderProgram = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(myShaderProgram);

  // Gets shader info
  // Args - shader program, var name
  var myPosition = gl.getAttribLocation(myShaderProgram, "myPosition");
  // array ponter
  // args - array, coordinate nimber, type of data, normalization(only for fixed point data), byte offset, offset of first array value(usually 0).
  gl.vertexAttribPointer(myPosition, 2, gl.FLOAT, false, 0, 0);
  // Let myPosition access data.
  gl.enableVertexAttribArray(myPosition);

  // args - shape type, starting point offset (usually 0), number of vertices.
  // To draw other shapes we split the polygon into triangles.
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 2*n);
}
