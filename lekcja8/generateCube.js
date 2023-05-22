const mat4 = glMatrix.mat4;

const vertexShaderTxt = `
    precision mediump float;

    attribute vec3 vertPosition;
    attribute vec3 vertColor;

    varying vec3 fragColor;

    uniform mat4 mWorld;
    uniform mat4 mView;
    uniform mat4 mProj;

    void main()
    {
        fragColor = vertColor;
        gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);
    }
`

const fragmentShaderTxt = `
    precision mediump float;

    varying vec3 fragColor;
    void main(){
        gl_FragColor = vec4(fragColor, 1.0);
    }
`
const canvas = document.getElementById("main-canvas");
    const gl = canvas.getContext("webgl");

    if(!gl){
        alert("no webgl");
    }

const Cube = function (length) {
    
    gl.clearColor(0.5, 0.3, 0.9, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexShaderTxt);
    gl.shaderSource(fragmentShader, fragmentShaderTxt);

    gl.compileShader(vertexShader);
    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        console.log(gl.getShaderInfoLog(vertexShader));
    }
    gl.compileShader(fragmentShader);
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
        console.log(gl.getShaderInfoLog(fragmentShader));
    }

    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);

    gl.validateProgram(program);

    let colors = [
        // R, G, B
        0.5, 0.5, 0.5,
        0.5, 0.5, 0.5,
        0.5, 0.5, 0.5,
        0.5, 0.5, 0.5,
    
        0.75, 0.25, 0.5,
        0.75, 0.25, 0.5,
        0.75, 0.25, 0.5,
        0.75, 0.25, 0.5,
    
        0.25, 0.25, 0.75,
        0.25, 0.25, 0.75,
        0.25, 0.25, 0.75,
        0.25, 0.25, 0.75,
    
        1.0, 0.0, 0.15,
        1.0, 0.0, 0.15,
        1.0, 0.0, 0.15,
        1.0, 0.0, 0.15,
    
        0.0, 1.0, 0.15,
        0.0, 1.0, 0.15,
        0.0, 1.0, 0.15,
        0.0, 1.0, 0.15,
    
        0.5, 0.5, 1.0,
        0.5, 0.5, 1.0,
        0.5, 0.5, 1.0,
        0.5, 0.5, 1.0,
    ]

	var boxIndices =
	[
		// Top
		0, 1, 2,
		0, 2, 3,

		// Left
		5, 4, 6,
		6, 4, 7,

		// Right
		8, 9, 10,
		8, 10, 11,

		// Front
		13, 12, 14,
		15, 14, 12,

		// Back
		16, 17, 18,
		16, 18, 19,

		// Bottom
		21, 20, 22,
		22, 20, 23
	];

    var boxVertices = generateCubeVertices(length, colors);

    const boxVertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxVertices), gl.STATIC_DRAW);

    const cubeVertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexBufferObject);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndices), gl.STATIC_DRAW);

    const posAttrLocation = gl.getAttribLocation(program, 'vertPosition');
    const colorAttrLocation = gl.getAttribLocation(program, 'vertColor');
    gl.vertexAttribPointer(
        posAttrLocation,
        3,
        gl.FLOAT,
        gl.FALSE,
        6 * Float32Array.BYTES_PER_ELEMENT,
        0,
    );

    gl.vertexAttribPointer(
        colorAttrLocation,
        3,
        gl.FLOAT,
        gl.FALSE,
        6 * Float32Array.BYTES_PER_ELEMENT,
        3 * Float32Array.BYTES_PER_ELEMENT,
    );

    gl.enableVertexAttribArray(posAttrLocation);
    gl.enableVertexAttribArray(colorAttrLocation);

    gl.useProgram(program);


    const matWorldUnifromLocation = gl.getUniformLocation(program, 'mWorld');
    const matViewUnifromLocation = gl.getUniformLocation(program, 'mView');
    const matProjUnifromLocation = gl.getUniformLocation(program, 'mProj');

    let worldMatrix = mat4.create();
    let viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, [0,0,-8], [0,0,0], [0,1,0]);
    let projMatrix = mat4.create();
    mat4.perspective(projMatrix, glMatrix.glMatrix.toRadian(45), canvas.clientWidth/canvas.clientHeight, 0.1, 1000.0);
    
    gl.uniformMatrix4fv(matWorldUnifromLocation, gl.FALSE, worldMatrix);
    gl.uniformMatrix4fv(matViewUnifromLocation, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(matProjUnifromLocation, gl.FALSE, projMatrix);

    let identityMatrix = mat4.create();
    let angle = 0;
    const loop = function() {
        angle = performance.now() / 1000 / 8 * 2 * Math.PI;

        mat4.rotate(worldMatrix, identityMatrix, angle, [2,1,0]);
        gl.uniformMatrix4fv(matWorldUnifromLocation, gl.FALSE, worldMatrix);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

}

function generateCubeVertices(sideLength, vertexColors) {
    const halfLength = sideLength / 2;
  
    const vertices = [
      // Top
      -halfLength, halfLength, -halfLength,
      -halfLength, halfLength, halfLength,
      halfLength, halfLength, halfLength,
      halfLength, halfLength, -halfLength,
  
      // Left
      -halfLength, halfLength, halfLength,
      -halfLength, -halfLength, halfLength,
      -halfLength, -halfLength, -halfLength,
      -halfLength, halfLength, -halfLength,
  
      // Right
      halfLength, halfLength, halfLength,
      halfLength, -halfLength, halfLength,
      halfLength, -halfLength, -halfLength,
      halfLength, halfLength, -halfLength,
  
      // Front
      halfLength, halfLength, halfLength,
      halfLength, -halfLength, halfLength,
      -halfLength, -halfLength, halfLength,
      -halfLength, halfLength, halfLength,
  
      // Back
      halfLength, halfLength, -halfLength,
      halfLength, -halfLength, -halfLength,
      -halfLength, -halfLength, -halfLength,
      -halfLength, halfLength, -halfLength,

       // Bottom
       -halfLength, -halfLength, -halfLength,
       -halfLength, -halfLength, halfLength,
       halfLength, -halfLength, halfLength,
       halfLength, -halfLength, -halfLength, 
    ];
  
    const vertexCount = vertices.length / 3;
  
    const coloredVertices = [];
  
    for (let i = 0; i < vertexCount; i++) {
      coloredVertices.push(
        vertices[i * 3],
        vertices[i * 3 + 1],
        vertices[i * 3 + 2],
        vertexColors[i * 3],
        vertexColors[i * 3 + 1],
        vertexColors[i * 3 + 2],
      );
    }
  
    return coloredVertices;
}

  
