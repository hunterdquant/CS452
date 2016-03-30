// Name:

var gl;
var numVertices;
var numTriangles;
var flatVertices;
var vertices;
var indexList;
var vertNormals;

var Minv;
var M;
var Porth;
var Pper;

var e;
var a;
var vup;

var left, right;
var top_, bottom;
var near, far;

var PLoc;

var Lp0, Lp1;

var Ia0, Id0, Is0;
var Ia1, Id1, Is1;

var ka0, kd0, ks0;
var ka1, kd1, ks1;

var alpha;



function initGL(){
    var canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.enable(gl.DEPTH_TEST);
    gl.viewport( 0, 0, 512, 512 );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    e = vec3(3, 3, -8);
    a = vec3(0, 0, 0);
    vup = vec3(0, 1, 0);

    viewerDist = length(subtract(e, a));
    left = -3;
    right = 3;
    near = viewerDist - 3;
    far = viewerDist + 3;
    top_ = 2;
    bottom = -2;

    Lp0 = vec3(0, 3, 0);
    Lp1 = vec3(0, 0, -3);

    Ia0 = vec3(0.5, 0.5, 0.5);
    Id0 = vec3(0.5, 0.55, 0.8);
    Is0 = vec3(0.5, 0.7, 0.7);

    Ia1 = vec3(0.77,0.77, 0.77);
    Id1 = vec3(0.77, 0.7, 0.9);
    Is1 = vec3(0.7,0.77, 0.77);

    ka0 = vec3(.3, .3, 1);
    kd0 = vec3(.3, .3, .8);
    ks0 = vec3(.1, .3, .8);

    ka1 = vec3(.7, .7, 1);
    kd1 = vec3(.6, .6, .1);
    ks1 = vec3(.1, .1, .1);

    alpha = 16;

    calcMAndMinv();
    calcPorthAndPper();

    var myShaderProgram = initShaders( gl, "vertex-shader", "fragment-shader" );
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

    PLoc = gl.getUniformLocation(myShaderProgram, "P");
    gl.uniformMatrix4fv(PLoc, false, Porth);

    var Lp0Loc = gl.getUniformLocation(myShaderProgram, "Lp0");
    gl.uniform3f(Lp0Loc, Lp0[0], Lp0[1], Lp0[2]);

    var Lp1Loc = gl.getUniformLocation(myShaderProgram, "Lp1");
    gl.uniform3f(Lp1Loc, Lp1[0], Lp1[1], Lp1[2]);

    var Ia0Loc = gl.getUniformLocation(myShaderProgram, "Ia0");
    gl.uniform3f(Ia0Loc, Ia0[0], Ia0[1], Ia0[2]);

    var Ia1Loc = gl.getUniformLocation(myShaderProgram, "Ia1");
    gl.uniform3f(Ia1Loc, Ia1[0],Ia1[1], Ia1[2]);

    var Id0Loc = gl.getUniformLocation(myShaderProgram, "Id0");
    gl.uniform3f(Id0Loc, Id0[0], Id0[1], Id0[2]);

    var Id1Loc = gl.getUniformLocation(myShaderProgram, "Id1");
    gl.uniform3f(Id1Loc, Id1[0], Id1[1], Id1[2]);

    var Is0Loc = gl.getUniformLocation(myShaderProgram, "Is0");
    gl.uniform3f(Is0Loc, Is0[0], Is0[1], Is0[2]);

    var Is1Loc = gl.getUniformLocation(myShaderProgram, "Is1");
    gl.uniform3f(Is1Loc, Is1[0], Is1[1], Is1[2]);

    var ka0Loc = gl.getUniformLocation(myShaderProgram, "ka0");
    gl.uniform3f(ka0Loc, ka0[0], ka0[1], ka0[2]);

    var ka1Loc = gl.getUniformLocation(myShaderProgram, "ka1");
    gl.uniform3f(ka1Loc, ka1[0], ka1[1], ka1[2]);

    var kd0Loc = gl.getUniformLocation(myShaderProgram, "kd0");
    gl.uniform3f(kd0Loc, kd0[0], kd0[1], kd0[2]);

    var kd1Loc = gl.getUniformLocation(myShaderProgram, "kd1");
    gl.uniform3f(kd1Loc, kd1[0], kd1[1], kd1[2]);

    var ks0Loc = gl.getUniformLocation(myShaderProgram, "ks0");
    gl.uniform3f(ks0Loc, ks0[0], ks0[1], ks0[2]);

    var ks1Loc = gl.getUniformLocation(myShaderProgram, "ks1");
    gl.uniform3f(ks1Loc, ks1[0], ks1[1], ks1[2]);

    var alphaLoc = gl.getUniformLocation(myShaderProgram, "alpha");
    gl.uniform1f(alphaLoc, false, alpha);
    //

    drawObject();
};

function generateNormals() {
  var vertNormals = [];
  for (var i = 0; i < vertices.length; i++) {
    var faceNormals = [];
    for (var j = 0; j < indexList.length; j+=3) {
      if (indexList[j] === i || indexList[j+1] === i || indexList[j+2] === i) {
        var fourTimesInd = 4*indexList[j];
        var p0 = vec3(flatVertices[fourTimesInd], flatVertices[fourTimesInd+1], flatVertices[fourTimesInd+2]);
        fourTimesInd = 4*indexList[j+1];
        var p1 = vec3(flatVertices[fourTimesInd], flatVertices[fourTimesInd+1], flatVertices[fourTimesInd+2]);
        fourTimesInd = 4*indexList[j+2];
        var p2 = vec3(flatVertices[fourTimesInd], flatVertices[fourTimesInd+1], flatVertices[fourTimesInd+2]);
        var v1 = subtract(p1, p0);
        var v2 = subtract(p2, p0);
        faceNormals.push(cross(v1, v2));
      }
    }
    var vertNormal = vec3(0, 0, 0);
    for (var j = 0; j < faceNormals.length; j++) {
      vertNormal = add(vertNormal, faceNormals[j]);
    }
    vertNormal[0] /= faceNormals.length;
    vertNormal[1] /= faceNormals.length;
    vertNormal[2] /= faceNormals.length;
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

  var camRot = mat4(u[0], v[0], n[0], 0,
                    u[1], v[1], n[1], 0,
                    u[2], v[2], n[2], 0,
                    0, 0, 0, 1);
  var camTrans = mat4(1, 0, 0, e[0],
                      0, 1, 0, e[1],
                      0, 0, 1, e[2],
                      0, 0, 0, 1);
  var camTransInv = mat4(1, 0, 0, -e[0],
                         0, 1, 0, -e[1],
                         0, 0, 1, -e[2],
                         0, 0, 0, 1);
  M = flatten(mult(transpose(camRot), camTransInv));
  Minv = flatten(mult(camTrans, camRot));
}

function calcPorthAndPper() {
  Porth = [
    2/(left-right), 0, 0, 0,
    0, 2/(top_-bottom), 0, 0,
    0, 0, -2/(far-near), 0,
    -(left+right)/(left-right), -(top_+bottom)/(top_-bottom), -(far+near)/(far-near), 1
  ];

  Pper = [
    2*near/(right-left), 0, 0, 0,
    0, 2*near/(top_-bottom), 0, 0,
    (right+left)/(right-left), (top_+bottom)/(top_-bottom), -(far+near)/(far-near), -1,
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
