// Name: Hunter Quant

// GL
var gl;
// Graphics Shader
var myShaderProgram
// Number of vertices in the shape and the number of polygons.
var numVertices;
var numTriangles;
// A transposed list of vertices.
var flatVertices;
// A list of all vertices.
var vertices;
// Associates vertices with points in a triangle.
var indexList;
// A list of all vertex normals.
var vertNormals;

// A matrix representing the model view transformation transpoed and inverse.
// for lighting calculations.
var MinvTrans;
// A matrix representing a model view transformation.
var M;

// Matrices representing a orthogonal and perspective projection.
var Porth;
var Pper;

// Viewer location.
var e;
// Look-at point.
var a;
// Up direction.
var vup;

// Bounds for a orthogonal projection.
var orthLeft, orthRight, orthTop, orthBottom;
var perLeft, perRight, perTop, perBottom;

// Distance bounds
var near, far;

// Uniform locations that need to be altered.
var PLoc, alphaLoc, IaLoc, IdLoc, IsLoc, kaLoc, kdLoc, ksLoc, p0Loc;

// Point light along with its intensity, reflectance coefficients, and on state.
var p0;
var pointOn;
var Ia, Id, Is;
var ka, kd, ks;

// Shiny factor.
var alpha;
// A boolean for whether specularity is currently on.
var specular;
// A copy of the specular reflectance coefficient for toggling.
var spcularVals;

// Directional light with its direction, color, and on state.
// diffuse only.
var lightDirection;
var directionColor;
var directionOn;

var radius = 2;
var latitudeBands = 30;
var longitudeBands = 30;

function initGL(){
    var canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.enable(gl.DEPTH_TEST);
    gl.viewport( 0, 0, 512, 512 );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    // viewer point, look-at point, up direction.
    e = vec3(1.0, 5.0, 12.0);
    a = vec3(0.0, 0.0, 0.0);
    vup = vec3(0.0, 1.0, 0.0);

    // Set bounds for projections.
    viewerDist = length(subtract(e, a));
    near = viewerDist - 3;
    far = viewerDist + 3;


    // Othographic projection bounds.
    orthLeft = -3;
    orthRight = 3;
    orthTop = 2;
    orthBottom = -2;

    // Perspecive projection bounds.
    perTop = near * Math.tan(Math.PI/4);
    perBottom = -perTop;
    perRight = perTop;
    perLeft = -perRight;

    // Point light source position.
    p0 = vec3(-1.0, 2.0, -1.0);
    pointOn = true;
    // Point light source intensity.
    Ia = vec3(0.5, 0.8, 0.5);
    Id = vec3(0.4, 0.8, 0.3);
    Is = vec3(1.0, 1.0, 1.0);

    // Point light source reflectance coefficients.
    ka = vec3(0.5, 0.5, 0.6);
    kd = vec3(0.8, 0.6, 0.6);
    ks = vec3(1.0, 1.0, 1.0);

    // Shine value and specular state.
    alpha = 1.0;
    specular = true;

    // Direction and color value for the diffuse directional light.
    lightDirection = vec3(0.0, 0.0, -1.0);
    directionColor = vec3(0.5, 0.7, 0.7);
    directionOn = true;

    // Sets the needed matrices.
    calcMAndMinv();
    calcPorthAndPper();

    // Below is all of the accessing of the GPU
    myShaderProgram = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( myShaderProgram );
    vertices = getVertices(); // vertices and faces are defined in object.js
    indexList = getIndices();
    flatVertices = vertices;
    console.log(vertNormals);
    //vertNormals = generateNormals();

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexList), gl.STATIC_DRAW);

    var verticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatVertices), gl.STATIC_DRAW);

    var vertexPosition = gl.getAttribLocation(myShaderProgram,"vertexPosition");
    gl.vertexAttribPointer( vertexPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vertexPosition );

    var normalsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertNormals), gl.STATIC_DRAW);

    var nvPosition = gl.getAttribLocation(myShaderProgram,"nv");
    gl.vertexAttribPointer( nvPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( nvPosition );

    // Insert your code here
    var MLoc = gl.getUniformLocation(myShaderProgram, "M");
    gl.uniformMatrix4fv(MLoc, false, M);

    var MinvTransLoc = gl.getUniformLocation(myShaderProgram, "MinvTrans");
    gl.uniformMatrix4fv(MinvTransLoc, false, MinvTrans);

    PLoc = gl.getUniformLocation(myShaderProgram, "P");
    gl.uniformMatrix4fv(PLoc, false, Porth);
    getNeededLocations();
    enablePointLight();
    enableDirectionalLight();

    alphaLoc = gl.getUniformLocation(myShaderProgram, "alpha");
    gl.uniform1f(alphaLoc, alpha);

    //

    drawObject();
};

function getVertices() {
    var vertexPositionData = [];
    var normalData = [];
    var textureCoordData = [];
    for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
      var theta = latNumber * Math.PI / latitudeBands;
      var sinTheta = Math.sin(theta);
      var cosTheta = Math.cos(theta);

      for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
        var phi = longNumber * 2 * Math.PI / longitudeBands;
        var sinPhi = Math.sin(phi);
        var cosPhi = Math.cos(phi);

        var x = cosPhi * sinTheta;
        var y = cosTheta;
        var z = sinPhi * sinTheta;
        var u = 1 - (longNumber / longitudeBands);
        var v = 1 - (latNumber / latitudeBands);

        normalData.push(x);
        normalData.push(y);
        normalData.push(z);
        textureCoordData.push(u);
        textureCoordData.push(v);
        vertexPositionData.push(radius * x);
        vertexPositionData.push(radius * y);
        vertexPositionData.push(radius * z);
      }
    }
    vertNormals = normalData;
    return vertexPositionData;

}

function getIndices() {
  var indexData = [];
   for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
     for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
       var first = (latNumber * (longitudeBands + 1)) + longNumber;
       var second = first + longitudeBands + 1;
       indexData.push(first);
       indexData.push(second);
       indexData.push(first + 1);

       indexData.push(second);
       indexData.push(second + 1);
       indexData.push(first + 1);
     }
   }
   return indexData;
}

/* A convoluded function that returns a list of vertex normals.
    Iterates through all the points and caclulates all the face normals around
    it then uses those face normals to create the vertex normal.*/
function generateNormals() {
  var vertNormals = [];
  for (var i = 0; i < vertices.length; i++) {
    var faceNormals = [];
    for (var j = 0; j < indexList.length; j+=3) {
      if (indexList[j] === i || indexList[j+1] === i || indexList[j+2] === i) {
        let fourTimesInd = 4*indexList[j];
        let p0 = vec3(flatVertices[fourTimesInd], flatVertices[fourTimesInd+1], flatVertices[fourTimesInd+2]);
        fourTimesInd = 4*indexList[j+1];
        let p1 = vec3(flatVertices[fourTimesInd], flatVertices[fourTimesInd+1], flatVertices[fourTimesInd+2]);
        fourTimesInd = 4*indexList[j+2];
        let p2 = vec3(flatVertices[fourTimesInd], flatVertices[fourTimesInd+1], flatVertices[fourTimesInd+2]);
        let v1= subtract(p1, p0);
        let v2 = subtract(p2, p0);
        faceNormals.push(cross(v1, v2));
      }
    }
    var vertNormal = vec3(0, 0, 0);
    for (var j = 0; j < faceNormals.length; j++) {
      vertNormal = add(vertNormal, faceNormals[j]);
    }
    vertNormal = normalize(vertNormal);
    vertNormals.push(vertNormal);
  }

  return vertNormals;
}


function drawObject() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    gl.drawElements( gl.TRIANGLES, vertices.length/3, gl.UNSIGNED_SHORT, 0 )
}

/* Sets the matrices used for transformations. */
function calcMAndMinv() {

  // Unit vectors specifying the local coordinate system for the viewer.
  var n = normalize(subtract(e, a));
  var u = normalize(cross(vup, n));
  var v = normalize(cross(n, u));

  // The inverse rotation matrix.
  var camRotInv = mat4(u[0], u[1], u[2], 0,
                    v[0], v[1], v[2], 0,
                    n[0], n[1], n[2], 0,
                    0, 0, 0, 1);

  // The inverse translation matrix.
  var camTransInv = mat4(1, 0, 0, -e[0],
                         0, 1, 0, -e[1],
                         0, 0, 1, -e[2],
                         0, 0, 0, 1);

  M = flatten(mult(camRotInv, camTransInv));
  MinvTrans = [
    u[0], v[0], n[0], e[0],
    u[1], v[1], n[1], e[1],
    u[2], v[2], n[2], e[2],
    0, 0, 0, 1
  ];
}

/* Sets the projection matrices. */
function calcPorthAndPper() {
  Porth = [
    2/(orthRight-orthLeft), 0, 0, 0,
    0, 2/(orthTop-orthBottom), 0, 0,
    0, 0, -2/(far-near), 0,
    -(orthLeft+orthRight)/(orthLeft-orthRight), -(orthTop+orthBottom)/(orthTop-orthBottom), -(far+near)/(far-near), 1
  ];

  Pper = [
    near/perRight, 0, 0, 0,
    0, near/perTop, 0, 0,
    0, 0, -(far+near)/(far-near), -1,
    0, 0, -(2*far*near)/(far-near), 0
  ];
}

/* Updates the object after changing projection type. */
function update(event) {
  if (event.keyCode == 79) {
    gl.uniformMatrix4fv(PLoc, false, Porth);
    drawObject();
  } else if (event.keyCode == 80) {
    gl.uniformMatrix4fv(PLoc, false, Pper);
    drawObject();
  }
}

/* Toggles the specular projection */
function toggleSpecular() {
    if (specular) {
      gl.uniform3f(ksLoc, 0.0, 0.0, 0.0);
    } else {
      gl.uniform3f(ksLoc, ks[0], ks[1], ks[2]);
    }
    specular = !specular;
    drawObject();
}

/* Retrieves uniform locations */
function getNeededLocations() {
  p0Loc = gl.getUniformLocation(myShaderProgram, "p0");
  IaLoc = gl.getUniformLocation(myShaderProgram, "Ia");
  IdLoc = gl.getUniformLocation(myShaderProgram, "Id");
  IsLoc = gl.getUniformLocation(myShaderProgram, "Is");
  kaLoc = gl.getUniformLocation(myShaderProgram, "ka");
  kdLoc = gl.getUniformLocation(myShaderProgram, "kd");
  ksLoc = gl.getUniformLocation(myShaderProgram, "ks");
}

/* Enables the point light */
function enablePointLight() {
  gl.uniform3f(p0Loc, p0[0], p0[1], p0[2]);
  gl.uniform3f(IaLoc, Ia[0], Ia[1], Ia[2]);
  gl.uniform3f(IdLoc, Id[0], Id[1], Id[2]);
  gl.uniform3f(IsLoc, Is[0], Is[1], Is[2]);
  gl.uniform3f(kaLoc, ka[0], ka[1], ka[2]);
  gl.uniform3f(kdLoc, kd[0], kd[1], kd[2]);
  gl.uniform3f(ksLoc, ks[0], ks[1], ks[2]);
}

/* Disables the point light */
function disablePointLight() {
  gl.uniform3f(kaLoc, 0.0, 0.0, 0.0);
  gl.uniform3f(kdLoc, 0.0, 0.0, 0.0);
  gl.uniform3f(ksLoc, 0.0, 0.0, 0.0);
}

/* Enables directional light */
function enableDirectionalLight() {
  lightDirectionLoc = gl.getUniformLocation(myShaderProgram, "lightDirection");
  gl.uniform3f(lightDirectionLoc, lightDirection[0], lightDirection[1], lightDirection[2]);

  directionColorLoc = gl.getUniformLocation(myShaderProgram, "directionColor");
  gl.uniform3f(directionColorLoc, directionColor[0], directionColor[1], directionColor[2]);
}

/* Disables directional light */
function disableDirectionalLight() {
  gl.uniform3f(directionColorLoc, 0.0, 0.0, 0.0);
}

/* Toggles the point light */
function togglePointLight() {
  if (pointOn) {
    disablePointLight();
  } else {
    enablePointLight();
  }
  pointOn = !pointOn;
  drawObject();
}

/* Toggles the directional light */
function toggleDirectionalLight() {
  if (directionOn) {
    disableDirectionalLight();
  } else {
    enableDirectionalLight();
  }
  directionOn = !directionOn;
  drawObject();
}
