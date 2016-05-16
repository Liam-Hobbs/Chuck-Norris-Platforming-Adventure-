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



var fpsTime = 1;
var fps = 1;
var fpsCount = 1;

var ENEMY_MAXDX = METER * 5
var ENEMY_ACCEL = ENEMY_MAXDX *2;

var enemies = [];

var LAYER_COUNT =3; //number of layers on map, bg, platform, ladder
var LAYER_BACKGROUND = 0;
var LAYER_PLATFORMS = 1;
var LAYER_LADDERS = 2;

var LAYER_OBJECT_ENEMIES = 3;
var LAYER_OBJECT_TRIGGERS = 4;

var MAP = {tw:60, th:15}; //how big the level is in tiles
var TILE = 35; //width/height of a tile in pixels.
var TILESET_TILE = TILE*2; //width/height of tileset
var TILESET_PADDING = 2; //how many pixels in image border and tile images in tilemap
var TILESET_SPACING = 2; //how many pixels are between tile images and tilemap
var TILESET_COUNT_X = 14; //how many colums of tile images in tileset
var TILESET_COUNT_Y = 14; //how many rows of tile images in the tileset

var SCREEN_WIDTH = canvas.width;
var SCREEN_HEIGHT = canvas.height;



 // abitrary choice for 1m
var METER = TILE;
 // very exaggerated gravity (6x)
var GRAVITY = METER * 9.8 * 6;
 // max horizontal speed (10 tiles per second)
var MAXDX = METER * 10;
 // max vertical speed (15 tiles per second)
var MAXDY = METER * 15;
 // horizontal acceleration - take 1/2 second to reach maxdx
var ACCEL = MAXDX * 2;
 // horizontal friction - take 1/6 second to stop from maxdx
var FRICTION = MAXDX * 6;
 // (a large) instantaneous jump impulse
var JUMP = METER * 1500;

var player = new Player();
var keyboard = new Keyboard();

var music = new Howl(
    {
        urls: ["background.ogg"],
        loop: true,
        buffer: true,
        volume: 0.15
    });
music.play();

var sfx = new Howl(
                {
                    urls: ["fireEffect.ogg"],
                    buffer: true,
                    volume: 0.5,

                } );

//load the image to use for the level tiles.
//var tileset = document.createElement("img");
//tileset.src = "tileset.png";

var cells = [];                    // the array that holds our simplified collision data
function initialize() {
    for (var layerIdx = 0; layerIdx < LAYER_COUNT; layerIdx++) {    // initialize the collision map
        cells[layerIdx] = [];
        var idx = 0;
        for (var y = 0; y < level1.layers[layerIdx].height; y++) {
            cells[layerIdx][y] = [];
            for (var x = 0; x < level1.layers[layerIdx].width; x++) {
                if (level1.layers[layerIdx].data[idx] != 0) {
                    // for each tile we find in the layer data, we need to create 4 collisions
                    // (because our collision squares are 35x35 but the tile in the level are 70x70)
                    cells[layerIdx][y][x] = 1; //bottom left
                    cells[layerIdx][y - 1][x] = 1; //above one
                    cells[layerIdx][y - 1][x + 1] = 1;// above and right
                    cells[layerIdx][y][x + 1] = 1; // right one
                }
                else if (cells[layerIdx][y][x] != 1) {
                    cells[layerIdx][y][x] = 0; // if we haven't set this cell's value, then set it to 0 now
                    //add enemies
               
                    idx = 0;
                    for (var y = 0; y < level1.layers[LAYER_OBJECT_ENEMIES].height; y++) {
                        for (var x = 0; x < level1.layers[LAYER_OBJECT_ENEMIES].width; x++) {
                            if (level1.layers[LAYER_OBJECT_ENEMIES].data[idx] != 0) {
                                var px = tileToPixel(x);
                                var py = tileToPixel(y);
                                var e = new Enemy(px, py);
                                enemies.push(e);
                            }
                        }
                        idx++;
                    }
                }
            }
        }
    }
}

function cellAtPixelCoord(layer, x, y) {
    if (x < 0 || x > SCREEN_WIDTH) // remove ‘|| y<0’
        return 1;
    // et the player drop of the bottom of the screen
    //this means death
    if (y > SCREEN_HEIGHT)
        return 0;
    return cellAtTileCoord(layer, p2t(x), p2t(y)); //this allows player to jump over top of screen
};
function cellAtTileCoord(layer, tx, ty) // remove ‘|| y<0’
{
    if (tx < 0 || tx >= MAP.tw)
        return 1;
    //let the player drop of the bottom of the screen
    //this means death
    if (ty >= MAP.th)
        return 0;
    return cells[layer][ty][tx];
};

function tileToPixel(tile) {
    return tile * TILE;
};
function pixelToTile(pixel) {
    return Math.floor(pixel / TILE);
};
function bound(value, min, max) {
    if (value < min)
        return min;
    if (value > max)
        return max;
    return value;
}




var worldOffsetX = 0;
function drawMap() {
    var startX = -1;
    var maxTiles = Math.floor(SCREEN_WIDTH / TILE) + 2;
    var tileX = pixelToTile(player.position.x);
    var offsetX = TILE + Math.floor(player.position.x % TILE);

    startX = tileX - Math.floor(maxTiles / 2);

    if (startX < -1) {
        startX = 0;
        offsetX = 0;
    }
    if (startX > MAP.tw - maxTiles) {
        startX = MAP.tw - maxTiles + 1;
        offsetX = TILE;
    }
    worldOffsetX = startX * TILE + offsetX;

    for (var layerIdx = 0; layerIdx < LAYER_COUNT; layerIdx++) {
        for (var y = 0; y < level1.layers[layerIdx].height; y++) {
            var idx = y * level1.layers[layerIdx].width + startX;
            for (var x = startX; x < startX + maxTiles; x++) {
                if (level1.layers[layerIdx].data[idx] != 0) {
                    // the tiles in the Tiled map are base 1 (meaning a value of 0 means no tile),
                    // so subtract one from the tileset id to get the correct tile
                    var tileIndex = level1.layers[layerIdx].data[idx] - 1;
                    var sx = TILESET_PADDING + (tileIndex % TILESET_COUNT_X) *
                        (TILESET_TILE + TILESET_SPACING);
                    var sy = TILESET_PADDING + (Math.floor(tileIndex / TILESET_COUNT_Y)) *
                        (TILESET_TILE + TILESET_SPACING);
                    context.drawImage(tileset, sx, sy, TILESET_TILE, TILESET_TILE,
                        (x - startX) * TILE - offsetX, (y - 1) * TILE, TILESET_TILE, TILESET_TILE);
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

    for (var i = 0; i < enemies.length; i++) {
        enemies[i].update(deltaTime);
    }
    for (var i = 0; i < enemies.length; i++) {
        enemy.draw();
    }


   
    // update the frame counter
   /* fpsTime += deltaTime;
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
*/

   
}


initialize();

/*CODE FROM ZACH THAT I MAY NEED
//DEBUG DRAW LEVEL COLLISION DATA
function DrawLevelCollisionData(tileLayer) {
    for (var y = 0; y < level1.layers[tileLayer].height; y++) {
        for (var x = 0; x < level1.layers[tileLayer].width; x++) {
            if (cells[tileLayer][y][x] == 1) {
                context.fillStyle = "#F00";
                context.fillRect(TILE * x, TILE * y, TILE, TILE);
            }
        }
    }
}
//DEBUG DRAW PLAYER CELL COLLISION DATA
//fill in value of cell
        context.fillStyle = "#00F";
        context.fillRect(tx * 35, ty * 35,35,35);
        //fill in value of cellRight
        context.fillStyle = "#0FF";
        context.fillRect((tx+1) * 35, ty * 35,35,35);
        //fill in value of cellDown
        context.fillStyle = "#F90";
        context.fillRect(tx * 35, (ty+1) * 35,35,35);
        //fill in value of cellDiag
        context.fillStyle = "#F0F";
        context.fillRect((tx+1) * 35, (ty+1) * 35,35,35);
*/

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
