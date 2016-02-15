/*
  Name: Hunter Quant
  Course: CS452
  Lab: 1
*/

/* Draws 3 shapes to the html canvas */
function drawShapes() {
  // Access the html canvas.
  var canvas = document.getElementById("gl-canvas");
  // Init WebGL
  var gl = WebGLUtils.setupWebGL(canvas);
  // Inform the user if WebGL could not be accessed.
  if (!gl) {
    alert("WebGL is not available.");
  }

  // Define the clipping space.
  gl.viewport(0, 0, 720, 720);
  // Assign the desired clipspace color and update.
  gl.clearColor(.4, .4, .8, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Holds the vertices to be drawn.
  var arrayOfVertices = [];
  // Variables to specify the number of vertices for each shap.
  var nOctogon = 8;
  var nEllipseAndCardioid = 128;
  // Call the add function for each shape.
  arrayOfVertices = addOctogonVertices(arrayOfVertices, nOctogon, -1, 1);
  arrayOfVertices = addEllipseVertices(arrayOfVertices, nEllipseAndCardioid, -1, -1);
  arrayOfVertices = addCardioidVertices(arrayOfVertices, nEllipseAndCardioid, 2.25, 0);

  // Intialize the buffer.
  var bufferId = gl.createBuffer();
  // Bind the buffer the type ARRAY_BUFFER.
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
  // Fill the buffer with the flattened version of the vertex array.
  gl.bufferData(gl.ARRAY_BUFFER, flatten(arrayOfVertices), gl.STATIC_DRAW);

  // Initialize both shader programs.
  var shaderProgram = initShaders(gl, "vertex-shader", "fragment-shader");
  // Start the shader program.
  gl.useProgram(shaderProgram);

  // Uniform variable to scale the vertices.
  var scale = gl.getUniformLocation(shaderProgram, "scale");
  gl.uniform1f(scale, .5);
  // Uniform variable to specify the fragment color for a set of vertices.
  var color = gl.getUniformLocation(shaderProgram, "color");

  // Enable the vertex shader to access vertex position information.
  var myPosition = gl.getAttribLocation(shaderProgram, "myPosition");
  gl.vertexAttribPointer(myPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(myPosition);

  // Sets the line width for LINE_LOOP.
  gl.lineWidth(5);

  // Draw an octogon with the desired color (not filled).
  gl.uniform4f(color, 0.5, 0.9, 0.5, 1.0);
  gl.drawArrays(gl.LINE_LOOP, 0, nOctogon);
  // Draw an ellipse with the desired color.
  gl.uniform4f(color, 1.0, 0.5, 0.6, 1.0);
  gl.drawArrays(gl.TRIANGLE_FAN, nOctogon, nEllipseAndCardioid);
  // Change scale value for the next shape.
  gl.uniform1f(scale, 0.35);
  // Draw a cardioid with the desired color.
  gl.uniform4f(color, 0.0, 1.0, 1.0, 1.0);
  gl.drawArrays(gl.TRIANGLE_FAN, nOctogon + nEllipseAndCardioid, nEllipseAndCardioid);
}

/*
  Adds vertices to the passed array for an octogon.

  args - arrayOfVertices: The array to add the vertices to.
       - n: The number of vertices to add.
       - xOffset: The x value to offset each vertex.
       - yOffset: The y value to offset each vertex.
*/
function addOctogonVertices(arrayOfVertices, n, xOffset, yOffset) {
  var step = 2 * Math.PI / n;
  for (var i = 0; i < n; i++) {
    arrayOfVertices.push(vec2(Math.cos(i * step) + xOffset, Math.sin(i * step) + yOffset))
  }
  return arrayOfVertices;
}

/*
  Adds vertices to the passed array for a cardioid.

  args - arrayOfVertices: The array to add the vertices to.
       - n: The number of vertices to add.
       - xOffset: The x value to offset each vertex.
       - yOffset: The y value to offset each vertex.
*/
function addCardioidVertices(arrayOfVertices, n, xOffset, yOffset) {
  var step = 2 * Math.PI / n;
  for (var i = 0; i < n; i++) {
    arrayOfVertices.push(vec2(Math.cos(i * step) * (1 - Math.cos(i * step)) + xOffset, Math.sin(i * step) * (1 - Math.cos(i * step)) + yOffset));
  }
  return arrayOfVertices;
}

/*
  Adds vertices to the passed array for an ellipse.

  args - arrayOfVertices: The array to add the vertices to.
       - n: The number of vertices to add.
       - xOffset: The x value to offset each vertex.
       - yOffset: The y value to offset each vertex.
*/
function addEllipseVertices(arrayOfVertices, n, xOffset, yOffset) {
  var step = 2 * Math.PI / n;
  for (var i = 0; i < n; i++) {
    arrayOfVertices.push(vec2(Math.cos(i * step) + xOffset, Math.sin(i * step) / 2 + yOffset))
  }
  return arrayOfVertices;
}
