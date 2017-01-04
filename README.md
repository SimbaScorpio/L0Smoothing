# L0Smoothing v1.0
Javascript sync implementation of an image smoothing algorithm involving L0 gradient minimization.

## Usage
    var L0 = new L0Smoothing(img.width, img.height, img.data);
    
    L0.Smooth(lambda, betamax, kappa);
    
    var data = L0.GetImageData();
    
    img.data.set(data);

## Result
