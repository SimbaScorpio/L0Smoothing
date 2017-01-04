function FFTSort(dataReal, dataImag, r) {
	var dataLen = dataReal.length;
	if (dataLen <= 2) return;

	var index1 = new Array(dataLen);
	var index2 = new Array(dataLen);
	index2[0] = 0;
	index2[1] = 1;

	for (var i = 0; i < r - 1; ++i) {
		var length = 1 << (i + 1);
		if (i%2 == 0) {
			for (var j = 0; j < length; ++j) {
				index1[j] = index2[j]*2;
				index1[j + length] = index2[j]*2 + 1;
			}
		} else {
			for (var j = 0; j < length; ++j) {
				index2[j] = index1[j]*2;
				index2[j + length] = index1[j]*2 + 1;
			}
		}
	}

	var index = (r%2 == 0) ? index1 : index2;

	var dataRealTemp = new Array(dataLen);
	var dataImagTemp = new Array(dataLen);

	for (var i = 0; i < dataLen; ++i) {
		dataRealTemp[i] = dataReal[index[i]];
		dataImagTemp[i] = dataImag[index[i]];
	}
	for (var i = 0; i < dataLen; ++i) {
		dataReal[i] = dataRealTemp[i];
		dataImag[i] = dataImagTemp[i];
	}
}


function FFT(dataReal, dataImag, r) {
	FFTSort(dataReal, dataImag, r);

	var dataLen = dataReal.length;
	var halfLen = dataLen/2;

	var wReal = new Array(halfLen);
	var wImag = new Array(halfLen);
	for (var i = 0; i < halfLen; ++i) {
		var angle = -i*2*Math.PI/dataLen;
		wReal[i] = Math.cos(angle);
		wImag[i] = Math.sin(angle);
	}

	for (var i = 0; i < r; ++i) {
		var group = 1 << (r - 1 - i);
		var distance = 1 << i;
		var unit = 1 << i;
		for (var j = 0; j < group; ++j) {
			var step = 2*distance*j;
			for (var k = 0; k < unit; ++k) {

				var index1 = dataLen * k / 2 / distance;
				var index2 = step + k + distance;
				var index3 = step + k;

				var r1 = wReal[index1];
				var i1 = wImag[index1];
				var r2 = dataReal[index2];
				var i2 = dataImag[index2];

				var tempReal = r1*r2 - i1*i2;
				var tempImag = r1*i2 + i1*r2;

				dataReal[index2] = dataReal[index3] - tempReal;
				dataImag[index2] = dataImag[index3] - tempImag;

				dataReal[index3] = dataReal[index3] + tempReal;
				dataImag[index3] = dataImag[index3] + tempImag;
			}
		}
	}
}


function IFFT(dataReal, dataImag, r) {
	var dataLen = dataReal.length;
	for (var i = 0; i < dataLen; ++i) {
		dataImag[i] *= -1;
	}

	FFT(dataReal, dataImag, r);

	for (var i = 0; i < dataLen; ++i) {
		dataReal[i] /= dataLen;
		dataImag[i]	/= -dataLen;
	}
}


function FFT2(dataReal, dataImag, width, height, rw, rh) {
	var dataRealTempRow = new Array(width);
	var dataImagTempRow = new Array(width);
	for (var y = 0; y < height; ++y) {
		for (var x = 0; x < width; ++x) {
			var index = y*width + x;
			dataRealTempRow[x] = dataReal[index];
			dataImagTempRow[x] = dataImag[index];
		}

		FFT(dataRealTempRow, dataImagTempRow, rw);

		for (var x = 0; x < width; ++x) {
			var index = y*width + x;
			dataReal[index] = dataRealTempRow[x];
			dataImag[index] = dataImagTempRow[x];
		}
	}

	var dataRealTempCol = new Array(height);
	var dataImagTempCol = new Array(height);
	for (var x = 0; x < width; ++x) {
		for (var y = 0; y < height; ++y) {
			var index = y*width + x;
			dataRealTempCol[y] = dataReal[index];
			dataImagTempCol[y] = dataImag[index];
		}

		FFT(dataRealTempCol, dataImagTempCol, rh);

		for (var y = 0; y < height; ++y) {
			var index = y*width + x;
			dataReal[index] = dataRealTempCol[y];
			dataImag[index] = dataImagTempCol[y];
		}
	}
}


function IFFT2(dataReal, dataImag, width, height, rw, rh) {
	var dataRealTempCol = new Array(height);
	var dataImagTempCol = new Array(height);
	for (var x = 0; x < width; ++x) {
		for (var y = 0; y < height; ++y) {
			var index = y*width + x;
			dataRealTempCol[y] = dataReal[index];
			dataImagTempCol[y] = dataImag[index];
		}

		IFFT(dataRealTempCol, dataImagTempCol, rh);

		for (var y = 0; y < height; ++y) {
			var index = y*width + x;
			dataReal[index] = dataRealTempCol[y];
			dataImag[index] = dataImagTempCol[y];
		}
	}

	var dataRealTempRow = new Array(width);
	var dataImagTempRow = new Array(width);
	for (var y = 0; y < height; ++y) {
		for (var x = 0; x < width; ++x) {
			var index = y*width + x;
			dataRealTempRow[x] = dataReal[index];
			dataImagTempRow[x] = dataImag[index];
		}

		IFFT(dataRealTempRow, dataImagTempRow, rw);

		for (var x = 0; x < width; ++x) {
			var index = y*width + x;
			dataReal[index] = dataRealTempRow[x];
			dataImag[index] = dataImagTempRow[x];
		}
	}
}