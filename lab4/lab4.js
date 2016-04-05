// Name: Hunter Quant

var gl;
var myShaderProgram
var numVertices;
var numTriangles;
var flatVertices;
var vertices;
var indexList;
var vertNormals;

var MinvTrans;
var M;
var Porth;
var Pper;

var e;
var a;
var vup;

var orthLeft, orthRight;
var orthTop, orthBottom;
var near, far;

var PLoc, alphaLoc, IaLoc, IdLoc, IsLoc, kaLoc, kdLoc, ksLoc, p0Loc;

// Point light
var p0;
var Ia, Id, Is;
var ka, kd, ks;

var alpha;
var specular;
var spcularVals;

// Directional light
var lightDirection;
var directionColor;



function initGL(){
    var canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.enable(gl.DEPTH_TEST);
    gl.viewport( 0, 0, 512, 512 );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    e = vec3(1.0, 1.0, 12.0);
    a = vec3(0, 0, 0);
    vup = vec3(0, 1, 0);

    viewerDist = length(subtract(e, a));

    near = viewerDist - 3;
    far = viewerDist + 3;

    orthLeft = -3;
    orthRight = 3;
    orthTop = 2;
    orthBottom = -2;

    perTop = near * Math.tan(Math.PI/4);
    perBottom = -perTop;
    perRight = perTop;
    perLeft = -perRight;

    p0 = vec3(1.0, 1.0, 1.0);

    Ia = vec3(0.5, 0.2, 0.5);
    Id = vec3(0.4, 0.8, 0.3);
    Is = vec3(1.0, 1.0, 1.0);

    ka = vec3(0.5, 0.5, 0.2);
    kd = vec3(0.3, 0.3, 0.2);
    ks = specularVals = vec3(1.0, 1.0, 1.0);

    alpha = 0;
    specular = true;

    lightDirection = vec3(0.0, 0.0, -1.0);
    directionColor = vec3(0.0, 0.0, 0.0);

    calcMAndMinv();
    calcPorthAndPper();

    myShaderProgram = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( myShaderProgram );

    numVertices = 1738;
    numTriangles = 3170;
    vertices = getVertices(); // vertices and faces are defined in object.js
    indexList = getFaces();
    flatVertices = flatten(vertices);
    vertNormals = generateNormals();

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexList), gl.STATIC_DRAW);

    var verticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatVertices, gl.STATIC_DRAW);

    var vertexPosition = gl.getAttribLocation(myShaderProgram,"vertexPosition");
    gl.vertexAttribPointer( vertexPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vertexPosition );

    var normalsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertNormals), gl.STATIC_DRAW);

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

    console.log(Ia);
    console.log(Id);
    console.log(Is);
    console.log(ka);
    console.log(kd);
    console.log(ks);
    
    enablePointLight();
    enableDirectionalLight();
    alphaLoc = gl.getUniformLocation(myShaderProgram, "alpha");
    gl.uniform1f(alphaLoc, alpha);

    //

    drawObject();
};

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
    gl.drawElements( gl.TRIANGLES, 3 * numTriangles, gl.UNSIGNED_SHORT, 0 )
}

function calcMAndMinv() {
  var n = normalize(subtract(e, a));
  var u = normalize(cross(vup, n));
  var v = normalize(cross(n, u));

  var camRotInv = mat4(u[0], u[1], u[2], 0,
                    v[0], v[1], v[2], 0,
                    n[0], n[1], n[2], 0,
                    0, 0, 0, 1);
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

function calcPorthAndPper() {
  Porth = [
    2/(orthLeft-orthRight), 0, 0, 0,
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

function update(event) {
  if (event.keyCode == 79) {
    gl.uniformMatrix4fv(PLoc, false, Porth);
  } else if (event.keyCode == 80) {
    gl.uniformMatrix4fv(PLoc, false, Pper);
  }
  drawObject();
}

function toggleSpecular() {
    if (specular) {
      ks = vec3(0.0, 0.0, 0.0);
    } else {
      ks = specularVals;
    }
    specular = !specular;
    var ksLoc = gl.getUniformLocation(myShaderProgram, "ks");
    gl.uniform3f(ksLoc, ks[0], ks[1], ks[2]);
}

function enablePointLight() {
  p0Loc = gl.getUniformLocation(myShaderProgram, "p0");
  gl.uniform3f(p0Loc, p0[0], p0[1], p0[2]);

  IaLoc = gl.getUniformLocation(myShaderProgram, "Ia");
  gl.uniform3f(IaLoc, Ia[0], Ia[1], Ia[2]);

  IdLoc = gl.getUniformLocation(myShaderProgram, "Id");
  gl.uniform3f(IdLoc, Id[0], Id[1], Id[2]);

  IsLoc = gl.getUniformLocation(myShaderProgram, "Is");
  gl.uniform3f(IsLoc, Is[0], Is[1], Is[2]);

  kaLoc = gl.getUniformLocation(myShaderProgram, "ka");
  gl.uniform3f(kaLoc, ka[0], ka[1], ka[2]);

  kdLoc = gl.getUniformLocation(myShaderProgram, "kd");
  gl.uniform3f(kdLoc, kd[0], kd[1], kd[2]);

  ksLoc = gl.getUniformLocation(myShaderProgram, "ks");
  gl.uniform3f(ksLoc, ks[0], ks[1], ks[2]);
}

function enableDirectionalLight() {
  lightDirectionLoc = gl.getUniformLocation(myShaderProgram, "lightDirection");
  gl.uniform3f(lightDirectionLoc, lightDirection[0], lightDirection[1], lightDirection[2]);

  directionColorLoc = gl.getUniformLocation(myShaderProgram, "directionColor");
  gl.uniform3f(directionColorLoc, directionColor[0], directionColor[1], directionColor[2]);
}
