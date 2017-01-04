/**
 * Serial implementations of an image smoothing algorithm involving L0 gradient minimization.
 * Based on the image smoothing method described in the following paper:
 * "Image Smoothing via L0 Gradient Minimization", (SIGGRAPH Asia 2011), 2011.
 *
 * This script is written by Hu Jiangchuan in 2017/1/4.
 */

/**
 * L0Smoothing constructor.
 *
 * @param <Int> width 		[width of the image]
 * @param <Int> height   	[height of the image]
 * @param <Array> imageData 	[image data maintained in RGBA form]
 */
var L0Smoothing = function(width, height, imageData) {
	this.width = width;
	this.height = height;

	// fill width and height to power of 2 (FFT reason)
	this.rw = this.GetCeilPower2(width);
	this.rh = this.GetCeilPower2(height);
	this.maxWidth = 1 << this.rw;
	this.maxHeight = 1 << this.rh;

	/* Here I use One-dimensional array to implement all processes.
	   Because of the Fast Fourier Transformation(FFT), some data
	   should be stored as complex numbers separately in two arrays.
	   One for real numbers and one for imaginary numbers. 
	*/

	this.InitRGB(imageData, this.width, this.height, this.maxWidth, this.maxHeight);

	this.InitRGBHV(this.maxWidth, this.maxHeight);

	this.CalculateRGBFFT(this.maxWidth, this.maxHeight, this.rw, this.rh);

	this.CalculateMTF(this.maxWidth, this.maxHeight, this.rw, this.rh);

}


/**
 * Smooth is the main function that should be called.
 *
 * @param <Float> lambda 	[>=1e-3 (the bigger the smoother)]
 * @param <Float> betamax 	[>=1e5]
 * @param <Float> kappa		[>1 (restrict iteration times)]
 * @param <Bool> verbose	[true to show log informations]
 */
L0Smoothing.prototype.Smooth = function(lambda, betamax, kappa, verbose) {
	var beta = 2*lambda;
	var iter = 0;

	while (beta < betamax) {
		var startTime = new Date();

		this.CalculateHV(lambda, beta);
		this.CalculateNormin();
		this.CalculateS(beta);
		beta *= kappa;

		iter += 1;
		var endTime = new Date();
		var runTime = (endTime - startTime) / 1000;
		if (verbose) {
			console.log("ITERATION " + iter + " time: " + runTime + " s");
		}
	}
}


/**
 * GetImageData returns image data array maintained in RGBA form.
 */
L0Smoothing.prototype.GetImageData = function() {
	var width = this.width;
	var height = this.height;
	var maxWidth = this.maxWidth;

	var imageData = new Array(width*height);

	for (var y = 0; y < height; ++y) {
		for (var x = 0; x < width; ++x) {
			var index1 = y*maxWidth + x;
			var index2 = (y*width + x)*4;
			imageData[index2+0] = this.Rr[index1] * 255;
			imageData[index2+1] = this.Gr[index1] * 255;
			imageData[index2+2] = this.Br[index1] * 255;
			imageData[index2+3] = this.Alpha[index1];
		}
	}

	return imageData;
}


/**
 * Init RGB channel data array.
 *
 * @param <Array> imageData 	[image data maintained in RGBA form]
 * @param <Int> width 		[real image width]
 * @param <Int> height 		[real image height]
 * @param <Int> maxWidth 	[width of power of 2 (>=width)]
 * @param <Int> maxHeight 	[height of power of 2 (>=height)]
 */
L0Smoothing.prototype.InitRGB = function(imageData, width, height, maxWidth, maxHeight) {
	var size = maxWidth*maxHeight;
	this.Rr = new Array(size).fill(0);
	this.Ri = new Array(size).fill(0);
	this.Gr = new Array(size).fill(0);
	this.Gi = new Array(size).fill(0);
	this.Br = new Array(size).fill(0);
	this.Bi = new Array(size).fill(0);
	this.Alpha = new Array(size).fill(255);

	for (var y = 0; y < height; ++y) {
		for (var x = 0; x < width; ++x) {
			var index1 = y*maxWidth + x;
			var index2 = (y*width + x)*4;
			this.Rr[index1] = imageData[index2+0] / 255;
			this.Gr[index1] = imageData[index2+1] / 255;
			this.Br[index1] = imageData[index2+2] / 255;
			this.Alpha[index1] = imageData[index2+3];
		}
	}
}


/**
 * Init HV data array for each RGB channel.
 *
 * @param <Int> maxWidth 	[width of power of 2 (>=width)]
 * @param <Int> maxHeight 	[height of power of 2 (>=height)]
 */
L0Smoothing.prototype.InitRGBHV = function(maxWidth, maxHeight) {
	var size = maxWidth*maxHeight;
	this.RH = new Array(size).fill(0);
	this.RV = new Array(size).fill(0);
	this.GH = new Array(size).fill(0);
	this.GV = new Array(size).fill(0);
	this.BH = new Array(size).fill(0);
	this.BV = new Array(size).fill(0);

	this.RNr = new Array(size).fill(0);
	this.RNi = new Array(size).fill(0);
	this.GNr = new Array(size).fill(0);
	this.GNi = new Array(size).fill(0);
	this.BNr = new Array(size).fill(0);
	this.BNi = new Array(size).fill(0);
}


/**
 * Calculate original FFT data array for each RGB channel.
 *
 * @param <Int> maxWidth 	[width of power of 2 (>=width)]
 * @param <Int> maxHeight 	[height of power of 2 (>=height)]
 * @param <Int> rw 		[2^rw = maxWidth]
 * @param <Int> rh 		[2^rh = maxHeight]
 */
L0Smoothing.prototype.CalculateRGBFFT = function(maxWidth, maxHeight, rw, rh) {
	this.RIr = this.Rr.slice();
	this.RIi = this.Ri.slice();
	this.GIr = this.Gr.slice();
	this.GIi = this.Gi.slice();
	this.BIr = this.Br.slice();
	this.BIi = this.Bi.slice();

	FFT2(this.RIr, this.RIi, maxWidth, maxHeight, rw, rh);
	FFT2(this.GIr, this.GIi, maxWidth, maxHeight, rw, rh);
	FFT2(this.BIr, this.BIi, maxWidth, maxHeight, rw, rh);
}


/**
 * Calculate MTF data array (psf -> otf).
 *
 * @param <Int> maxWidth 	[width of power of 2 (>=width)]
 * @param <Int> maxHeight 	[height of power of 2 (>=height)]
 * @param <Int> rw 		[2^rw = maxWidth]
 * @param <Int> rh 		[2^rh = maxHeight]
 */
L0Smoothing.prototype.CalculateMTF = function(width, height, rw, rh) {
	var size = width*height;
	var FHr = new Array(size).fill(0);
	var FHi = new Array(size).fill(0);
	var FVr = new Array(size).fill(0);
	var FVi = new Array(size).fill(0);

	var shiftH = width/2;
	var shiftV = height/2;

	FHr[shiftV*width+shiftH] = 1;
	FHr[shiftV*width+shiftH+1] = -1;
	FVr[shiftV*width+shiftH] = 1;
	FVr[shiftV*width+shiftH+width] = -1;

	FFT2(FHr, FHi, width, height, rw, rh);
	FFT2(FVr, FVi, width, height, rw, rh);

	this.MTF = new Array(size).fill(0);
	for (var y = 0; y < height; ++y) {
		for (var x = 0; x < width; ++x) {
			var index = y*width + x;
			this.MTF[index] = FHr[index]*FHr[index] + FHi[index]*FHi[index] +
							  FVr[index]*FVr[index] + FVi[index]*FVi[index];
		}
	}
}


/**
 * Auxiliary function returns r, which 2^(r-1) < number <= 2^r.
 *
 * @param <Int> number
 */
L0Smoothing.prototype.GetCeilPower2 = function(number) {
	var r = 1;
	while (Math.pow(2, r) < number) {
		++r;
	}
	return r;
};


/**
 * Calculate HV data array.
 *
 * @param <Float> lambda 	[>=1e-3 (the bigger the smoother)]
 * @param <Float> beta 		[<betamax]
 */
L0Smoothing.prototype.CalculateHV = function(lambda, beta) {
	var ch = this.maxWidth;
	var cv = this.maxHeight;
	var Rr = this.Rr;
	var Gr = this.Gr;
	var Br = this.Br;
	var RH = this.RH, RV = this.RV;
	var GH = this.GH, GV = this.GV;
	var BH = this.BH, BV = this.BV;

	for (var v = 0; v < cv; ++v) {
		for (var h = 0; h < ch; ++h) {
			var nextH = (h - 1 + ch) % ch;
			var nextV = (v - 1 + cv) % cv;
			var index = v*ch + h;
			var indexH = v*ch + nextH;
			var indexV = nextV*ch + h;

			var dhr = Rr[index] - Rr[indexH];
			var dvr = Rr[index] - Rr[indexV];
			var dhg = Gr[index] - Gr[indexH];
			var dvg = Gr[index] - Gr[indexV];
			var dhb = Br[index] - Br[indexH];
			var dvb = Br[index] - Br[indexV];

			var dh = dhr + dhg + dhb;
			var dv = dvr + dvg + dvb;

			var bool = dh*dh + dv*dv < lambda / beta;
			RH[index] = bool ? 0 : dhr;
			RV[index] = bool ? 0 : dvr;
			GH[index] = bool ? 0 : dhg;
			GV[index] = bool ? 0 : dvg;
			BH[index] = bool ? 0 : dhb;
			BV[index] = bool ? 0 : dvb;

		}
	}
}


/**
 * Calculate Normin data array.
 */
L0Smoothing.prototype.CalculateNormin = function() {
	var ch = this.maxWidth;
	var cv = this.maxHeight;
	var RH = this.RH, RV = this.RV;
	var GH = this.GH, GV = this.GV;
	var BH = this.BH, BV = this.BV;
	var RNr = this.RNr, RNi = this.RNi;
	var GNr = this.GNr, GNi = this.GNi;
	var BNr = this.BNr, BNi = this.BNi;

	for (var v = 0; v < cv; ++v) {
		for (var h = 0; h < ch; ++h) {
			var nextH = (h + 1) % ch;
			var nextV = (v + 1) % cv;
			var index = v*ch + h;
			var indexH = v*ch + nextH;
			var indexV = nextV*ch + h;

			var dhr = RH[index] - RH[indexH];
			var dvr = RV[index] - RV[indexV];
			var dhg = GH[index] - GH[indexH];
			var dvg = GV[index] - GV[indexV];
			var dhb = BH[index] - BH[indexH];
			var dvb = BV[index] - BV[indexV];

			RNr[index] = dhr + dvr;
			RNi[index] = 0;
			GNr[index] = dhg + dvg;
			GNi[index] = 0;
			BNr[index] = dhb + dvb;
			BNi[index] = 0;
		}
	}

	FFT2(this.RNr, this.RNi, ch, cv, this.rw, this.rh);
	FFT2(this.GNr, this.GNi, ch, cv, this.rw, this.rh);
	FFT2(this.BNr, this.BNi, ch, cv, this.rw, this.rh);
}


/**
 * Calculate S for each RGB data array.
 *
 * @param <Float> beta 	[<betamax]
 */
L0Smoothing.prototype.CalculateS = function(beta) {
	this.CalculateSChannel(this.Rr, this.Ri, this.RIr, this.RIi, this.RNr, this.RNi, beta);
	this.CalculateSChannel(this.Gr, this.Gi, this.GIr, this.GIi, this.GNr, this.GNi, beta);
	this.CalculateSChannel(this.Br, this.Bi, this.BIr, this.BIi, this.BNr, this.BNi, beta);
}


/**
 * Calculate S for each single channel data array.
 *
 * @param <Array> Cr 	[channel data array of complex real numbers]
 * @param <Array> Ci 	[channel data array of complex imag numbers]
 * @param <Array> Ir 	[original channel FFT data array of complex real numbers]
 * @param <Array> Ii 	[original channel FFT data array of complex imag numbers]
 * @param <Array> Nr 	[normin data array of complex real numbers]
 * @param <Array> Ni 	[normin data array of complex imag numbers]
 * @param <Float> beta 	[<betamax]
 */
L0Smoothing.prototype.CalculateSChannel = function(Cr, Ci, Ir, Ii, Nr, Ni, beta) {
	var ch = this.maxWidth;
	var cv = this.maxHeight;
	var MTF = this.MTF;

	for (var v = 0; v < cv; ++v) {
		for (var h = 0; h < ch; ++h) {
			var index = v*ch + h;
			Cr[index] = (Ir[index] + beta*Nr[index])/(1 + beta*MTF[index]);
			Ci[index] = (Ii[index] + beta*Ni[index])/(1 + beta*MTF[index]);
		}
	}

	IFFT2(Cr, Ci, ch, cv, this.rw, this.rh);
}
