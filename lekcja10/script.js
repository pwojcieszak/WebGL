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

    void main()
    {
        gl_FragColor = vec4(fragColor, 1.0);
    }
`

const mat4 = glMatrix.mat4;


class World {
    #gl;
    #canvas;
    #backgroundColor;
    #program;
    constructor(id, backgroundColor) {
        this.#canvas = document.getElementById(id);
        this.#gl = this.#canvas.getContext("webgl");
        this.#backgroundColor = backgroundColor;
        this.#program = this.#gl.createProgram();

        this.prepareBackGround();
    }

    // Sets up the background color and enables depth testing and face culling
    prepareBackGround() {
        const gl = this.#gl;
        gl.clearColor(...this.#backgroundColor, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
    }

    // Updates the background color and clears the buffers
    set background(backgroundColor) {
        const gl = this.#gl;
        this.#backgroundColor = backgroundColor;
        gl.clearColor(...this.#backgroundColor, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    // Loads a shader based on its type (VERTEX or FRAGMENT)
    loadShader(shaderTxt, type) {
        let shader_type = null;
        const gl = this.#gl;
        if (type == 'VERTEX') {
            shader_type = gl.VERTEX_SHADER;
        }
        else if (type == 'FRAGMENT') {
            shader_type = gl.FRAGMENT_SHADER;
        }
        const shader = gl.createShader(shader_type);
        gl.shaderSource(shader, shaderTxt);
        gl.compileShader(shader);
        gl.attachShader(this.#program, shader);
    }

    // Prepares the shaders by loading the vertex and fragment shaders and linking the program
    prepareShaders() {
        const gl = this.#gl;
        this.loadShader(vertexShaderTxt, 'VERTEX');
        this.loadShader(fragmentShaderTxt, 'FRAGMENT');
        gl.linkProgram(this.#program);
    }

    // Prepares a buffer based on its type and name. It creates a buffer object, binds it to the 
    // appropriate target (ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER), and fills it with data.
    prepareBuffer(type, name) {
        const gl = this.#gl;
        const bufferObject = gl.createBuffer();
        if (name == 'VERTEX' || name == 'COLOR') {
            gl.bindBuffer(gl.ARRAY_BUFFER, bufferObject);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(type), gl.STATIC_DRAW);
        }
        if (name == 'INDICE') {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferObject);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(type), gl.STATIC_DRAW);
        }
    }

    // Prepares the buffers for the vertex positions, colors, and optional indices. It binds the
    // buffers, sets up attribute pointers, and enables vertex attribute arrays.
    loadObject(vertices, colors, indices = null) {
        const gl = this.#gl;
        this.prepareBuffer(vertices, 'VERTEX');
        
        if (indices != null) {
            this.prepareBuffer(indices, 'INDICE');
        }

        const posAttrLocation = gl.getAttribLocation(this.#program, 'vertPosition');
        gl.vertexAttribPointer(
            posAttrLocation,
            3,
            gl.FLOAT,
            gl.FALSE,
            3 * Float32Array.BYTES_PER_ELEMENT,
            0,
        );
        gl.enableVertexAttribArray(posAttrLocation);
        
        this.prepareBuffer(colors, 'COLOR');
        const colorAttrLocation = gl.getAttribLocation(this.#program, 'vertColor');
        gl.vertexAttribPointer(
            colorAttrLocation,
            3,
            gl.FLOAT,
            gl.FALSE,
            3 * Float32Array.BYTES_PER_ELEMENT,
            0 * Float32Array.BYTES_PER_ELEMENT,
        );


        gl.enableVertexAttribArray(colorAttrLocation);
    }
    
    // Sets up the shaders, loads the object data, and runs the rendering loop
    run(vertices, colors, indices = null) {
        const gl = this.#gl;
        const program = this.#program;
        const canvas = this.#canvas;

        this.prepareShaders();
        this.loadObject(vertices, colors, indices);
        gl.useProgram(program);

        const matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
        const matViewUniformLocation = gl.getUniformLocation(program, 'mView');
        const matProjUniformLocation = gl.getUniformLocation(program, 'mProj');

        let worldMatrix = mat4.create();
        let worldMatrix2 = mat4.create();
        let viewMatrix = mat4.create();
        mat4.lookAt(viewMatrix, [0, 0, -8], [0, 0, 0], [0, 1, 0]);
        let projMatrix = mat4.create();
        mat4.perspective(projMatrix, glMatrix.glMatrix.toRadian(45), canvas.width / canvas.clientHeight, 0.1, 1000.0);

        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
        gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
        gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

        let rotationMatrix = new Float32Array(16);
        let translationMatrix = new Float32Array(16);
        let angle = 0;
        const loop = function () {
            angle = performance.now() / 1000 / 8 * 3 * Math.PI;
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            mat4.fromRotation(rotationMatrix, angle, [1, 1, 0]);
            mat4.fromTranslation(translationMatrix, [-1, -1, 0]);
            mat4.mul(worldMatrix, translationMatrix, rotationMatrix);
            gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
            gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

            rotationMatrix = new Float32Array(16);
            translationMatrix = new Float32Array(16);

            mat4.fromRotation(rotationMatrix, angle / 2, [1, 1, 1]);
            mat4.fromTranslation(translationMatrix, [1.2, 1.2, 0]);
            mat4.mul(worldMatrix2, translationMatrix, rotationMatrix);
            gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix2);
            gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
    }
}



let Cube = function () {
    let world = new World('main-canvas', [0.5, 0.4, 0.7]);

    var boxVertices =
        [ // X, Y, Z           R, G, B
            // Top
            -1.0, 1.0, -1.0,
            -1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
            1.0, 1.0, -1.0,

            // Left
            -1.0, 1.0, 1.0,
            -1.0, -1.0, 1.0,
            -1.0, -1.0, -1.0,
            -1.0, 1.0, -1.0,

            // Right
            1.0, 1.0, 1.0,
            1.0, -1.0, 1.0,
            1.0, -1.0, -1.0,
            1.0, 1.0, -1.0,

            // Front
            1.0, 1.0, 1.0,
            1.0, -1.0, 1.0,
            -1.0, -1.0, 1.0,
            -1.0, 1.0, 1.0,

            // Back
            1.0, 1.0, -1.0,
            1.0, -1.0, -1.0,
            -1.0, -1.0, -1.0,
            -1.0, 1.0, -1.0,

            // Bottom
            -1.0, -1.0, -1.0,
            -1.0, -1.0, 1.0,
            1.0, -1.0, 1.0,
            1.0, -1.0, -1.0,
        ];

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

    world.run(boxVertices, colors, boxIndices);
}