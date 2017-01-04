# L0Smoothing v1.0
Javascript sync implementation of an image smoothing algorithm involving L0 gradient minimization.

## Usage
    var L0 = new L0Smoothing(img.width, img.height, img.data);
    
    L0.Smooth(lambda, betamax, kappa);
    
    var data = L0.GetImageData();
    
    img.data.set(data);

## Result
![](https://github.com/SimbaScorpio/L0Smoothing/raw/master/img/model.jpg)
![](https://github.com/SimbaScorpio/L0Smoothing/raw/master/img/model_result.png)
![](https://github.com/SimbaScorpio/L0Smoothing/raw/master/img/scene.jpg)
![](https://github.com/SimbaScorpio/L0Smoothing/raw/master/img/scene_result.png)
