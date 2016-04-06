var canvas = document.getElementById("gameCanvas");
var context = canvas.getContext("2d");

var startFrameMillis = Date.now();
var endFrameMillis = Date.now();

//load the image set to use for the level tiles
var tileset = document.createElement("img");
tileset.src = "tileset.png"
// This function will return the time in seconds since the function 
// was last called
// You should only call this function once per frame
function getDeltaTime()
{
	endFrameMillis = startFrameMillis;
	startFrameMillis = Date.now();

		// Find the delta time (dt) - the change in time since the last drawFrame
		// We need to modify the delta time to something we can use.
		// We want 1 to represent 1 second, so if the delta is in milliseconds
		// we divide it by 1000 (or multiply by 0.001). This will make our 
		// animations appear at the right speed, though we may need to use
		// some large values to get objects movement and rotation correct
	var deltaTime = (startFrameMillis - endFrameMillis) * 0.001;
	
		// validate that the delta is within range
	if(deltaTime > 1)
		deltaTime = 1;
		
    
	return deltaTime;
}

var player = new Player();
var keyboard = new Keyboard();

var fpsTime = 1;
var fps = 1;
var fpsCount = 1;

var LAYER_COUNT =3; //number of layers on map, bg, platform, ladder
var MAP = {tw:60, th:15}; //how big the level is in tiles
var TILE = 35; //width/height of a tile in pixels.
var TILESET_TILE = TILE*2; //width/height of tileset
var TILESET_PADDING = 2; //how many pixels in image border and tile images in tilemap
var TILESET_SPACING = 2; //how many pixels are between tile images and tilemap
var TILESET_COUNT_X = 14; //how many colums of tile images in tileset
var TILESET_COUNT_Y = 14; //how many rows of tile images in the tileset



function drawMap() {
    for (var layerIdx = 0; layerIdx < LAYER_COUNT; layerIdx++) {
        var idx = 0;
        for (var y = 0; y < level1.layers[layerIdx].height; y++) {
            for (var x = 0; x < level1.layers[layerIdx].width; x++) {
                if (level1.layers[layerIdx].data[idx] != 0) {
                    var tileIndex = level1.layers[layerIdx].data[idx] - 1;
                    var sx = TILESET_PADDING + (tileIndex % TILESET_COUNT_X) * (TILESET_TILE + TILESET_SPACING);
                    var sy = TILESET_PADDING + (Math.floor(tileIndex / TILESET_COUNT_Y)) * (TILESET_TILE + TILESET_SPACING);
                    context.drawImage(tileset, sx, sy, TILESET_TILE, TILESET_TILE, x * TILE, (y - 1) * TILE, TILESET_TILE, TILESET_TILE);
                }
                idx++;
            }
        }
    }
}



function run() 
{
    context.fillStyle = "#ccc";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    var deltaTime = getDeltaTime();
    
    drawMap();
    
    player.update(deltaTime);
    player.draw();
   
     
   
    // update the frame counter
    fpsTime += deltaTime;
    fpsCount++;
    if (fpsTime >= 1) {
        fpsTime -= 1;
        fps = fpsCount;
        fpsCount = 0;
    }
    // draw the FPS
    context.fillStyle = "#f00";
    context.font = "14px Arial";
    context.fillText("FPS: " + fps, 5, 20, 100);

}




//-------------------- Don't modify anything below here


// This code will set up the framework so that the 'run' function is called 60 times per second.
// We have a some options to fall back on in case the browser doesn't support our preferred method.
(function() {
  var onEachFrame;
  if (window.requestAnimationFrame) {
    onEachFrame = function(cb) {
      var _cb = function() { cb(); window.requestAnimationFrame(_cb); }
      _cb();
    };
  } else if (window.mozRequestAnimationFrame) {
    onEachFrame = function(cb) {
      var _cb = function() { cb(); window.mozRequestAnimationFrame(_cb); }
      _cb();
    };
  } else {
    onEachFrame = function(cb) {
      setInterval(cb, 1000 / 60);
    }
  }
  
  window.onEachFrame = onEachFrame;
})();

window.onEachFrame(run);
