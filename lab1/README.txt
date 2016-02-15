First and Last Name
  Hunter Quant
Date
  02/01/2016

Description of your implementation of Lab1 Assignment

    lab1.js is a WebGL program that draws the following shapes to a canvas: octagon, ellipse, and cardioid.

    The program starts by initializing the canvas and WebGL utilities.

    The next step calculates all the vertices for the previously specified shapes.

    n ::= The number off vertices for the shape.
    a, b, c, d = 1 unless otherwise specified.
    theta = 2pi/n

    The octagon is calculated using x = acos(theta) + b and y = csin(theta) + d.
    This equation is used n times, in this case n = 8, to give the each of the 8 vertices. The next shape is the ellipse which is
    calculated similar to that of the octagon, but with c = 1/2 and n = 128. The cardioid is calculated with the equation
    x = acos(theta)(1-cos(theta)) + b  and y = csin(theta)(1-cos(theta)) + d. The equation is used n times where n = 128.

    After calculating the vertices for shapes the program creates a buffer to provide the gpu with vertex information.
    The buffer is created and bound to type array and filled with the vertex array data.

    The shaders are contained in the lab1.html file and have a few variables to transforms the vertices. vertex-shader has the
    myPosition attribute to obtain vertex position information from the gpu. vertex-shader also has a uniform variable scale, which
    scales the magnitude of all vertices by the specified factor. fragment-shader has the uniform vec4 variable color, which is used
    to specify the color of each fragment. Back to lab1.js. The shader programs are initialized and ran on the gpu.

    Now the program assigns the uniform values located in the shaders. The vertex-shader is given access to the vertex information
    from the gpu to be assigned to myPosition.

    Finally, each of the shapes will be drawn to the canvas. The octagon is drawn using LINE_LOOP and it's specified color.
    The other 2 shapes are drawn using TRIANGLE_FAN and their specified color.
