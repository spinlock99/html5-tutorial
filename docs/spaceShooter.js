/**
 * Define an object to hold all our images for the game so images are only ever
 * created once. This type of object is known as a singleton.
 */
var imageRepository = new function () {
  this.background = new Image();
  this.spaceship = new Image();
  this.bullet = new Image();

  var numImages = 3;
  var numLoaded = 0;

  function imageLoaded() {
    numLoaded++;
    if (numLoaded === numImages) {
      window.init();
    }
  }

  this.background.onload = function () { imageLoaded(); }
  this.spaceship.onload = function () { imageLoaded(); }
  this.bullet.onload = function () { imageLoaded(); }

  this.background.src = "background.png";
  this.spaceship.src = "spaceship.png";
  this.bullet.src = "bullet.png";
}

/**
 * Creates the Drawable object which will be the base class for all drawable
 * objects in the game. Sets up default variables that all child objects will
 * inherit, as well as the default functions.
 */
function Drawable() {
  this.init = function (x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
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

/**
 * Custom Pool object. Holds Bullet objects to be managed to prevent garbage collection.
 */
function Pool(maxSize) {
  var size = maxSize;
  var pool = [];

  this.init = function () {
    for (var i = 0; i < size; i++) {
      var bullet = new Bullet();
      bullet.init(0,0,imageRepository.bullet.width, imageRepository.bullet.height);
      pool[i] = bullet;
    }
  };

  this.get = function(x, y, speen) {
    if (!pool[size - 1].alilve) {
      pool[size - 1].spawn(x, y, speed);
      pool.unshift(pool.pop());
    }
  };

  this.getTwo = function(x1, y1, speed, x2, y2, speed2) {
    if (!pool[size - 1].alive && !pool[size - 2].alive) {
      this.get(x1, y1, speed);
      this.get(x2, y2, speed);
    }
  }

  this.animate = function () {
    for (var i=0; i<size; i++) {
      if (pool[i].alive) {
        if (pool[i].draw) {
          pool[i].clear();
          pool.push((pool.splice(i,1))[0]);
        }
      } else {
        break;
      }
    }
  }
}

function Bullet() {
  this.alive = false;
  this.spawn = function (x, y, speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.alive = true;
  };

  this.draw = function () {
    this.context.clearRect(this.x, this.y, this.width, this.height);
    this.y -= this.speed;
    if (this.y <= 0 - this.height) {
      return true;
    } else {
      this.context.drawImage(imageRepository.bullet, this.x, this.y);
    }
  };

  this.clear = function () {
    this.x = 0;
    this.y = 0;
    this.speed = 0;
    this.alive = false;
  }
}
Bullet.prototype = new Drawable();

/**
 * Create the Ship object that the player controls. The ship is drawn on the
 * "ship" canvas and uses dirty rectangles to move around the screen.
 */
function Ship() {
  this.speed = 3;
  this.bulletPool = new Pool(30);
  this.bulletPool.init();

  var fireRate = 15;
  var counter = 0;

  this.draw = function () {
    this.context.drawImage(imageRepository.spaceship, this.x, this.y);
  };

  this.move = function () {
    counter++;
    if (KEY_STATUS.left || KEY_STATUS.right || KEY_STATUS.down || KEY_STATUS.UP) {
      this.context.clearRect(this.x, this.y, this.width, this.height);
      if (KEY_STATUS.left) {
        this.x -= this.speed;
        if (this.x <= 0) this.x = 0;
      } else if (KEY_STATUS.right) {
        this.x += this.speed;
        if (this.x >= this.canvasWidth - this.width) this.x = this.cavasWidth - this.width;
      } else if (KEY_STATUS.up) {
        this.y -= this.speed;
        if (this.y <= this.canvasHeight/4*3) this.y = this.canvasHeight/4*3;
      } else if (KEY_STATUS.down) {
        this.y += this.speed;
        if (this.y >= this.canvasHeight - this.height) this.y = this.canvasHeight - this.height;
      }
      this.draw();
    }
    if (KEY_STATUS.space && counter >= fireRate) {
      this.fire();
      counter = 0;
    }
  };

  /*
   * Fires two bullets
   */
  this.fire = function () {
    this.bulletPool.getTwo(this.x+6, this.y, 3, this.x+33, this.y, 3);
  };
}
Ship.prototype = new Drawable();
