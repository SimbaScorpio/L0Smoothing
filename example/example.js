window.onload = init;


var imageFile = "";
var lambda = 0.1;
var betamax = 1e5;
var kappa = 4;
var runBtn = null;


function init() {
	// file input
	var imgInput = document.getElementById("img");
	imgInput.onchange = function(e) {
		var file = e.target.files[0];
		var reader = new FileReader();

		reader.onload = function(e) {
			imageFile = e.target.result;
		}
		reader.readAsDataURL(file);
	}

	// lambda input
	var lambdaInput = document.getElementById("lambda");
	lambdaInput.onchange = function(e) {
		lambda = e.srcElement.value;
	}

	// kappa input
	var kappaInput = document.getElementById("kappa");
	kappaInput.onchange = function(e) {
		kappa = e.srcElement.value;
	}

	// run button
	runBtn = document.getElementById("run");
	runBtn.onclick = function(e) {
		run();
	}
}


function run() {
	if (imageFile.length == 0)
		return;

	runBtn.disabled = true;
	document.getElementById("process").innerHTML = "Running...";

	// load image
	var img = new Image();
	img.src = imageFile;

	// callback on finish loading
	img.onload = function() {

		// illustrate original image
		var cvsOrigin = document.getElementById("canvas-origin");
		cvsOrigin.width = img.width;
		cvsOrigin.height = img.height;

		var ctxOrigin = cvsOrigin.getContext("2d");
		ctxOrigin.drawImage(img, 0, 0);

		// illustrate result image
		var cvsResult = document.getElementById("canvas-result");
		cvsResult.width = img.width;
		cvsResult.height = img.height;

		var ctxResult = cvsResult.getContext("2d");
		ctxResult.drawImage(img, 0, 0);

		// get image data
		var c = ctxResult.getImageData(0, 0, img.width, img.height);

		// L0 smoothing
		var L0 = new L0Smoothing(c.width, c.height, c.data);
		L0.Smooth(lambda, betamax, kappa, true);

		// cover image data
		var imageData = L0.GetImageData();
		c.data.set(imageData);

		// redraw image
		ctxResult.putImageData(c, 0, 0);

		runBtn.disabled = false;
		document.getElementById("process").innerHTML = "Finish!";
	}
}
