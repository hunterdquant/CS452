First and Last Name
  Hunter Quant
Date
  02/15/2016

Description of implementation

  Globals will be referenced through description.
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

  The program starts with the initialization of our components: WebGL, canvas, globals, and attributes. Next,
  the program starts its animation by calling the render function with an interval of 1 millisecond. The render function
  has the primary function of drawing the buffer to the screen, but it also handles a few small calculations. In render theta
  and the displacement step values are incremented with each call to render. These small increments yield the animation.
  The final task render preforms is creating a matrix to represent a clockwise rotation by theta and a translation to (x, y).
  The matrix is then assigned to the uniform variable M in the vertex shader to be multiplied with the vector representing that vertex.
  That's all there is to the main program, however certain functions are called by events with html elements.

  There is a total of 3 buttons, which each preform a simple function. The "Toggle Rotation" button simply does as stated. It calls
  a function called toggleRotation, which toggles the truth value of the boolean flag for rotation. The next 2 buttons "Increase Speed"
  and "Decrease Speed" call functions that increase/decrease the stepScale global, thus increasing/decreasing the rate at which they travel.
  There is an onclick event attached to the canvas. The onclick event calls a function called translateToMouse that sets the displacement
  values x, y to the mouse position. Finally, there is a keydown event attached to the html body that calls a function called changeDirection.
  changeDirection changes the sign and value of xStep and yStep globals to change the direction traveled by the shape.
