First and Last Name
  Hunter Quant
Date
  02/24/2016

Description of implementation

  Globals will be referenced through description.
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

  The program starts with the initialization of our components: WebGL, canvas, globals, and attributes. The attributes are
  vertexColor and vertexPosition both of which are assigned using buffered data from the arrays containing the vertex colors
  and positions. The vertex colors in the XZ-plane are different shades of cyan and the vertex colors on the Y-axis are
  black and white. The shape is a 4 point star similar to my last lab, but each vertex in the XZ-plane is connected to 2 points
  on the Y-axis. The indices for the triangles are retrieved from a function and assigned to the glabal indexList. After
  everything is initialized the render function is called.

  The render function refreshes the image whenever a new frame is available. The tasks preformed in this function are the following.
  Matrices are assigned for their specific functions and set as uniform 4x4 matrices in the vertex shader. If the rotation flags are
  true then the rotation values will be updated. Finally, render draws all the triangles specified in the index list using drawElements().

  After the uniform variables are assigned and drawElements is called, the vertex shader will preform matrix transformations with the
  uniform matrices. The order of transformation is scale, rotate around z, rotate around y, rotate around x, then translate. The
  order of these transformations computationally are performed from right to left as follows.

    vf = MTrans*MRotX*MRotY*MRotZ*MScale*vi

  The reason for scaling first is because it appeared to preserve the shapes appearance a little better. The scaling is done in the
  XY-plane. The reason for doing the rotations in that order is just preference. I typically think of a rotation around Z first, so that's
  what I decided. The Y and X rotations are applied that way simply because of OCD. Finally, the translation is done last to have the Shape
  rotate about the point it is translated to.

  The controls for this are located on the html document and will be displayed next to the canvas. The implementations of the keys and buttons
  are trivial.

  <h2>HOW TO PLAY</h2>
  <ul>
    <li>Use WASD to translate the shape position in the XY-plane.</li>
    <li>The z, x, and c keys rotate around the z, y, x axes respectively.</li>
    <li>The directional arrows scale the shape in the XY-plane</li>
    <li>There is three buttons that toggle rotation around a specifc axis.</li>
    <li>There is two buttons that start and stop automatic rotation.</li>
    <li>There is a button to reset the shape to its default position and values.</li>
  </ul>
