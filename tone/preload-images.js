
var imageCache = {};

var turtleImg = new Image();
turtleImg.src = 'tone/img/turtle.png';
turtleImg.crossOrigin = 'Anonymous';
imageCache['turtle'] = {img: turtleImg, isLoaded: false};

turtleImg.onload = function() {
  imageCache.turtle.isLoaded = true;
};

var rabbitImg = new Image();
rabbitImg.src = 'tone/img/rabbit.png';
rabbitImg.crossOrigin = 'Anonymous';
imageCache['rabbit'] = {img: rabbitImg, isLoaded: false};

rabbitImg.onload = function() {
  imageCache.rabbit.isLoaded = true;
};

var metronomeImg = new Image();
metronomeImg.src = 'tone/img/metronome.png';
metronomeImg.crossOrigin = 'Anonymous';
imageCache['metronome'] = {img: metronomeImg, isLoaded: false};

metronomeImg.onload = function() {
  imageCache.metronome.isLoaded = true;
};
