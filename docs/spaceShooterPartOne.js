/**
 * Define an object to hold all our images for the game so images are only ever
 * created once. This type of object is known as a singleton.
 */
var imageRepository = new function () {
  this.background = new Image();
  this.background.src = "background.png";
}

/**
 * Creates the Drawable object which will be the base class for all drawable
 * objects in the game. Sets up default variables that all child objects will
 * inherit, as well as the default functions.
 */
function Drawable() {
  this.init = function (x, y) {
    this.x = x;
    this.y = y;
  };

  this.speed = 0;
  this.canvasWidth = 0;
  this.canvasHeight = 0;

  this.draw = function () {
  };
}

/**
 * Creates the Background object which will become a child of the Drawable
 * object. The background is drawn on the "background" canvas and creates the
 * illusion of moving by panning the image.
 */
function Background() {
  this.speed = 1;

  this.draw = function () {
    this.y += this.speed;
    this.context.drawImage(imageRepository.background, this.x, this.y);
    this.context.drawImage(imageRepository.background, this.x, this.y - this.canvasHeight);
    if (this.y >= this.canvasHeight) this.y = 0;
  }
}
Background.prototype = new Drawable();

/**
 * Creates the Game object which will hold all objects and data for the game.
 */
function Game() {
  this.init = function () {
    this.bgCanvas = document.getElementById('background');
    if (this.bgCanvas.getContext) {
      this.bgContext = this.bgCanvas.getContext('2d');
      Background.prototype.context = this.bgContext;
      Background.prototype.canvasWidth = this.bgCanvas.width;
      Background.prototype.canvasHeight = this.bgCanvas.height;
      this.background = new Background();
      this.background.init(0,0);
      return true;
    } else {
      return false;
    }
  };

  // Start the animation loop:
  this.start = function () {
    animate();
  };
}

function animate() {
  requestAnimFrame(animate);
  game.background.draw();
}

window.requestAnimFrame = (function () {
  return window.requestAnimationFrame  ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    window.oRequestAnimationFrame      ||
    window.msRequestAnimationFrame     ||
    function (callback, element) { window.setTimeout(callback, 1000 / 60); };
})();

var game = new Game();

function init() {
  if (game.init()) game.start();
}
