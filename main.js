// WebGL initialization
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');


const contrastSlider = document.getElementById("contrast-slider");
const brightnessSlider = document.getElementById("brightness-slider");
const grayscaleCheckbox = document.getElementById("Grayscale");
const sepiaCheckbox = document.getElementById("Sepia");
const backgroundRadio = document.getElementById("background");
const alphaBlendedRadio = document.getElementById("alpha-blended");
const smoothCheckbox = document.getElementById("smooth");
const sharpenCheckbox = document.getElementById("sharpen");
const gradientCheckbox = document.getElementById("gradient");
const laplacianCheckbox = document.getElementById("laplacian");


const resetButton = document.getElementById("resetScene");

const radioButtons = document.querySelectorAll('input[type="radio"]');
const checkboxes = document.querySelectorAll('input[type="checkbox"]');

var kernel = [];

for(let i = 0;i<=4;i++){
    var k = mat3.create();
    mat3.identity(k);
    if(i == 0){
        k[0][0] = 0.0; k[0][1] = 0.0; k[0][2] = 0.0;
        k[1][0] = 0.0; k[1][1] = 1.0; k[1][2] = 0.0;
        k[2][0] = 0.0; k[2][1] = 0.0; k[2][2] = 0.0;
    }
    else if(i == 1){
        k[0][0] = 1.0; k[0][1] = 1.0; k[0][2] = 1.0;
        k[1][0] = 1.0; k[1][1] = 1.0; k[1][2] = 1.0;
        k[2][0] = 1.0; k[2][1] = 1.0; k[2][2] = 1.0;
    }
    else if(i == 2){
        k[0][0] = 0.0; k[0][1] = -1.0; k[0][2] = 0.0;
        k[1][0] = -1.0; k[1][1] = 5.0; k[1][2] = -1.0;
        k[2][0] = 0.0; k[2][1] = -1.0; k[2][2] = 0.0;
    }
    else if(i == 3){
        k[0][0] = 0.0; k[0][1] = 0.0; k[0][2] = 0.0;
        k[1][0] = 0.0; k[1][1] = 2.0; k[1][2] = 0.0;
        k[2][0] = 0.0; k[2][1] = 0.0; k[2][2] = 0.0;
    }
    else if(i == 4){
        k[0][0] = 0.0; k[0][1] = -1.0; k[0][2] = 0.0;
        k[1][0] = -1.0; k[1][1] = 4.0; k[1][2] = -1.0;
        k[2][0] = 0.0; k[2][1] = -1.0; k[2][2] = 0.0;
    }
    kernel.push(k);
    console.log(kernel[i]);
}

// Corresponding variables in your JavaScript
let contrastValue = 0.5;
let brightnessValue = 0.0;
let isGrayscale = false;
let isSepia = false;
let isSmooth = false;
let isSharpen = false;
let isGradient = false;
let isLaplacian = false;
let selectedMode = "background"; // Default mode





if (!gl) {
    console.error('WebGL is not supported in your browser');
}

// Shader sources
const vertexShaderSource = `
    attribute vec2 a_position;
    varying vec2 v_texCoord;
    
    
    void main() {
        gl_Position = vec4(a_position, 0, 1);
        v_texCoord = (a_position + 1.0) / 2.0;
    }
`;

const fragmentShaderSource = `
    precision highp float;
    uniform sampler2D u_foreground;
    uniform sampler2D u_background;
    varying vec2 v_texCoord;
    uniform float alpha;
    uniform float contrast;
    uniform float brightness;
    
    uniform vec2 shape;

    vec2 newLoc;

    uniform mat3 kernel;

    uniform float greyOrSepia;

    void main() {
        vec4 fgColor = texture2D(u_foreground, vec2(v_texCoord.x, 1.0-v_texCoord.y));
        vec4 bgColor = vec4(vec3(0.0), 1.0);
        if(kernel[1][1] != 2.0){
            for(int i = 0;i<3;i++){
                for(int j = 0;j<3;j++){
                    if(((v_texCoord.x + float(i-1)/shape.x >0.0 || v_texCoord.x + float(i-1)/shape.x == 0.0)&& v_texCoord.x + float(i-1)/shape.x<1.0)  ){
                        if(((1.0-v_texCoord.y + float(j-1)/shape.y >0.0 || 1.0-v_texCoord.y + float(i-1)/shape.y == 0.0)&& 1.0-v_texCoord.y + float(i-1)/shape.y<1.0)){
                            bgColor += texture2D(u_background, vec2(v_texCoord.x + float(i-1)/shape.x, 1.0-v_texCoord.y + float(j-1)/shape.y)) * kernel[i][j];
                        }
                    }

                    
                }
            }
        }
        else{
            if(   ( ( (v_texCoord.x - 1.0/shape.x) >0.0 || v_texCoord.x - 1.0/shape.x == 0.0 )&&(v_texCoord.x + 1.0/shape.x <1.0))   ){
                if( ( ( (1.0-v_texCoord.y - 1.0/shape.y) >0.0 || 1.0-v_texCoord.y - 1.0/shape.y == 0.0 )&&(1.0-v_texCoord.y + 1.0/shape.y <1.0)) ){
                    vec2 up = vec2(v_texCoord.x, 1.0-v_texCoord.y-1.0/shape.y);
                    vec2 down = vec2(v_texCoord.x, 1.0-v_texCoord.y+1.0/shape.y);
                    vec2 right = vec2(v_texCoord.x+1.0/shape.x, 1.0-v_texCoord.y);
                    vec2 left = vec2(v_texCoord.x-1.0/shape.x, 1.0-v_texCoord.y);
                    
                    vec4 dy = (texture2D(u_background, up) - texture2D(u_background, down));
                    vec4 dx = (texture2D(u_background, right) - texture2D(u_background, left));

                    bgColor = sqrt(dx*dx + dy*dy);
                    bgColor.a = 1.0;
                    
                }
            }
        }


        vec4 tempCol = fgColor*(alpha) + bgColor*(1.0-alpha);

        if(greyOrSepia == 0.0){
            gl_FragColor = tempCol;
        }
        else if(greyOrSepia == 1.0){
            float tr = 0.393*tempCol.r + 0.769*tempCol.g + 0.189*tempCol.b;
            float tg = 0.349*tempCol.r + 0.686*tempCol.g + 0.168*tempCol.b;
            float tb = 0.272*tempCol.r + 0.534*tempCol.g + 0.131*tempCol.b;

            gl_FragColor = vec4(tr, tg, tb, 1.0);
        }

        else if(greyOrSepia == -1.0){
            gl_FragColor = vec4(    vec3( dot( tempCol.rgb  ,  vec3(0.2126, 0.7153, 0.0722) ) )   , 1.0);
        }
        vec3 col =  (contrast+0.5)*(gl_FragColor.rgb - vec3(0.5)) ;
        if(col.x<-0.5)col.x = -0.5;
        else if(col.x>0.5)col.x = 0.5;

        if(col.y<-0.5)col.y = -0.5;
        else if(col.y>0.5)col.y = 0.5;

        if(col.z<-0.5)col.z = -0.5;
        else if(col.z>0.5)col.z = 0.5;
        gl_FragColor.rgb = vec3(0.5) + col + brightness;


    }
`;

// Compile shaders and create program
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

// Find attribute and uniform locations
const positionLocation = gl.getAttribLocation(program, 'a_position');
const foregroundLocation = gl.getUniformLocation(program, 'u_foreground');
const backgroundLocation = gl.getUniformLocation(program, 'u_background');
const alphaLocation = gl.getUniformLocation(program, "alpha");
const greyOrSepiaLocation = gl.getUniformLocation(program, "greyOrSepia");
const contrastLocation = gl.getUniformLocation(program, "contrast");
const brightnessLocation = gl.getUniformLocation(program, "brightness");
const shapeLocation = gl.getUniformLocation(program, "shape");
const kernelLocation = gl.getUniformLocation(program, "kernel");

// Create buffer for a square
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

// Create texture objects
const foregroundTexture = createTexture(gl);
const backgroundTexture = createTexture(gl);

// Handle file uploads
document.getElementById('foregroundImage').addEventListener('change', handleForegroundUpload);
document.getElementById('backgroundImage').addEventListener('change', handleBackgroundUpload);

function handleForegroundUpload(event) {
    loadTexture(gl, foregroundTexture, event.target.files[0], foregroundLocation);
}

function handleBackgroundUpload(event) {
    loadTexture(gl, backgroundTexture, event.target.files[0], backgroundLocation);
}

// Render function
function render() {

    canvas.width = 400; // Set the initial canvas size
    canvas.height = 400;    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, foregroundTexture);
    gl.uniform1i(foregroundLocation, 0);

    if(selectedMode == "background"){
        
        gl.uniform1f(alphaLocation, 0.0);
    }
    else{
        
        gl.uniform1f(alphaLocation, 0.4);

    }
    var to_send = 0.0;
    if(1.0*isSepia - 1.0*isGrayscale == 1.0){
        to_send = 1.0;
    }
    else if(1.0*isSepia - 1.0*isGrayscale == -1.0){
        to_send = -1.0;
    }
    console.log("to_send ", to_send, isSepia ,isGrayscale);
    gl.uniform1f(greyOrSepiaLocation, to_send);

    gl.uniform1f(contrastLocation, contrastValue);
    gl.uniform1f(brightnessLocation, brightnessValue);
    gl.uniform2f(shapeLocation, canvas.width*1.0, canvas.height*1.0);
    console.log("process ", isSmooth + 2*isSharpen + 3*isGradient + 4*isLaplacian);
    if(isSmooth){
        gl.uniformMatrix3fv(kernelLocation, false, [
            1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
            1.0, 1.0, 1.0
          ].map(function(item) { return item/9.0 } ));

    }
    else if(isSharpen){
        gl.uniformMatrix3fv(kernelLocation, false, [
            0.0, -1.0, 0.0,
            -1.0, 5.0, -1.0,
            0.0, -1.0, 0.0
          ]);
    }
    else if(isGradient){
        gl.uniformMatrix3fv(kernelLocation, false, [
            0.0, 0.0, 0.0,
            0.0, 2.0, 0.0,
            0.0, 0.0, 0.0
          ]);
    }
    else if(isLaplacian){
        gl.uniformMatrix3fv(kernelLocation, false, [
            0.0, -1.0, 0.0,
            -1.0, 4.0, -1.0,
            0.0, -1.0, 0.0
          ]);
    }
    else{
        gl.uniformMatrix3fv(kernelLocation, false, [
            0.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 0.0, 0.0
          ]);
        
    }
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
    gl.uniform1i(backgroundLocation, 1);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}


// Utility functions for WebGL
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
        return null;
    }

    return program;
}

function createTexture(gl) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    return texture;
}

function loadTexture(gl, texture, file, location) {
    const image = new Image();
    image.src = URL.createObjectURL(file);

    image.onload = function () {

        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        render();
    };
}



// Add event listeners to listen for changes
contrastSlider.addEventListener("input", function() {
    contrastValue = parseFloat(contrastSlider.value);
    // You can perform the necessary updates or actions here
    console.log("Contrast ", contrastValue);
    render();
});

brightnessSlider.addEventListener("input", function() {
    brightnessValue = parseFloat(brightnessSlider.value);
    // You can perform the necessary updates or actions here
    console.log("Brightness ", brightnessValue);
    render();
});

grayscaleCheckbox.addEventListener("change", function() {
    isGrayscale = grayscaleCheckbox.checked;
    if(isGrayscale){
        sepiaCheckbox.checked = false;
        isSepia = false;
        
    }
    // You can perform the necessary updates or actions here
    
    render();
    console.log("grayscale", isGrayscale);
});

sepiaCheckbox.addEventListener("change", function() {
    isSepia = sepiaCheckbox.checked;
    if(isSepia){
        grayscaleCheckbox.checked = false;
        isGrayscale = false;
        
    }
    
    render();
    console.log("Sepia", isSepia);
    // You can perform the necessary updates or actions here
});
// Add event listeners to listen for changes
backgroundRadio.addEventListener("change", function() {
    if (backgroundRadio.checked) {
        selectedMode = "background";
        console.log(selectedMode);
        // You can perform the necessary updates or actions here
    }
    render();
});

alphaBlendedRadio.addEventListener("change", function() {
    if (alphaBlendedRadio.checked) {
        selectedMode = "alpha-blended";
        console.log(selectedMode);
        // You can perform the necessary updates or actions here
    }
    render();
});

smoothCheckbox.addEventListener("change", function(){
    isSmooth = smoothCheckbox.checked;
    if(isSmooth){

        sharpenCheckbox.checked = false;
        gradientCheckbox.checked = false;
        laplacianCheckbox.checked = false;

        isSharpen = false;
        isGradient = false;
        isLaplacian = false;

    }
    render();
    console.log("Smoothen", isSmooth);

});

sharpenCheckbox.addEventListener("change", function(){
    isSharpen = sharpenCheckbox.checked;

    if(isSharpen){

        smoothCheckbox.checked = false;
        gradientCheckbox.checked = false;
        laplacianCheckbox.checked = false;
        isSmooth = false;
        isGradient = false;
        isLaplacian = false;

    }
    render();

    console.log("Sharpen", isSharpen);

});

gradientCheckbox.addEventListener("change", function(){
    isGradient = gradientCheckbox.checked;
    if(isGradient){

        smoothCheckbox.checked = false;
        sharpenCheckbox.checked = false;
        laplacianCheckbox.checked = false;

        isSmooth = false;
        isSharpen = false;
        isLaplacian = false;

    }
    render();
    console.log("Gradient", isGradient);

});

laplacianCheckbox.addEventListener("change", function(){
    isLaplacian = laplacianCheckbox.checked;
    if(isLaplacian){

        smoothCheckbox.checked = false;
        sharpenCheckbox.checked = false;
        gradientCheckbox.checked = false;

        isSmooth = false;
        isSharpen = false;
        isGradient = false;

    }
    render();
    console.log("Laplacian", isLaplacian);

});

resetButton.addEventListener("click", () => {
    // Reset all radio buttons by unchecking them
    radioButtons.forEach((radio) => {
      radio.checked = false;
    });
     radioButtons[0].checked = true;
     selectedMode = "background";
    
    // Reset all checkboxes by unchecking them
    checkboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });
    
    isSmooth = false;
    isSharpen = false;
    isGradient = false;
    isLaplacian = false;
    isGrayscale = false;
    isSepia = false;
    // Reset sliders to their default values
    contrastSlider.value = 0.5; // Set the default value for the contrast slider
    brightnessSlider.value = 0.0; // Set the default value for the brightness slider
    render();
});


// const saveButton = document.getElementById('saveScreenshot');
// const downloadLink = document.getElementById('downloadLink');
// saveButton.addEventListener('click', () => {
//   canvas.toBlob((blob) => {
//     saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.jpg`);
//   });
// });
 
// const saveBlob = (function() {
//   const a = document.createElement('a');
//   document.body.appendChild(a);
//   a.style.display = 'none';
//   return function saveData(blob, fileName) {
//      const url = window.URL.createObjectURL(blob);
//      a.href = url;
//      a.download = fileName;
//      a.click();
//   };
// }());
const saveScreenshotButton = document.getElementById("saveScreenshot");

// Add a click event listener to the button
saveScreenshotButton.addEventListener("click", saveScreenshot);
function saveScreenshot() {
    render();
    // Get the canvas element by its ID
    const canvas = document.getElementById("canvas");

    // Create an "a" element to trigger the download
    const a = document.createElement("a");

    // Convert the canvas content to a data URL with JPEG format
    const dataURL = canvas.toDataURL("image/jpeg");

    // Set the "href" attribute of the "a" element to the data URL
    a.href = dataURL;

    // Set the "download" attribute and file name
    a.download = "screenshot.jpg";

    // Trigger a click event on the "a" element to start the download
    a.click();
}

// Start rendering loop


render();