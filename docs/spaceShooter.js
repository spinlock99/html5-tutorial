var game = new Game();

function init() {
  if (game.init()) game.start();
}

/**
 * Define an object to hold all our images for the game so images are only ever
 * created once. This type of object is known as a singleton.
 */
var imageRepository = new function () {
  //
  // too fucking tricky by far. loading is the number of images to load. each
  // Image is given a function to run onload. it will decrement loading then
  // check if "not loading" is true (i.e. loading == 0).
  //
  var loading = 5;
  function loadImage() { if (!--loading) { window.init(); } };

  this.background = new Image();
  this.background.src = "background.png";
  this.background.onload = loadImage;

  this.spaceship = new Image();
  this.spaceship.src = "spaceship.png";
  this.spaceship.onload = loadImage;

  this.bullet = new Image();
  this.bullet.src = "bullet.png";
  this.bullet.onload = loadImage;

  this.enemy = new Image();
  this.enemy.src = "enemy.png";
  this.enemy.onload = loadImage;

  this.enemyBullet = new Image();
  this.enemyBullet.src = "enemy-bullet.png";
  this.enemyBullet.onload = loadImage;

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

  this.draw = function () {};
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
    this.shipCanvas = document.getElementById('ship');
    this.mainCanvas = document.getElementById('main');
    if (this.bgCanvas.getContext) {
      this.bgContext = this.bgCanvas.getContext('2d');
      this.shipContext = this.shipCanvas.getContext('2d');
      this.mainContext = this.mainCanvas.getContext('2d');

      Background.prototype.context = this.bgContext;
      Background.prototype.canvasWidth = this.bgCanvas.width;
      Background.prototype.canvasHeight = this.bgCanvas.height;

      Ship.prototype.context = this.shipContext;
      Ship.prototype.canvasWidth = this.shipCanvas.width;
      Ship.prototype.canvasHeight = this.shipCanvas.height;

      Bullet.prototype.context = this.mainContext;
      Bullet.prototype.canvasWidth = this.mainCanvas.width;
      Bullet.prototype.canvasHeight = this.mainCanvas.height;

      Enemy.prototype.context = this.mainContext;
      Enemy.prototype.canvasWidth = this.mainCanvas.width;
      Enemy.prototype.canvasHeight = this.mainCanvas.height;

      this.background = new Background();
      this.background.init(0,0);

      this.ship = new Ship();
      var shipStartX = this.shipCanvas.width/2 - imageRepository.spaceship.width;
      var shipStartY = this.shipCanvas.height/4*3 + imageRepository.spaceship.height*2;
      this.ship.init(shipStartX, shipStartY, imageRepository.spaceship.width, imageRepository.spaceship.height);

      this.enemyPool = new Pool(30);
      this.enemyPool.init("enemy");
      var height = imageRepository.enemy.height;
      var width = imageRepository.enemy.width;
      var x = 100;
      var y = -height;
      var spacer = y * 1.5;
      for (var i=1; i<=18; i++) {
        this.enemyPool.get(x, y, 2);
        x += width + 25
        if (i % 6 == 0) {
          x = 100;
          y += spacer
        }
      }

      this.enemyBulletPool = new Pool(50);
      this.enemyBulletPool.init("enemyBullet");

      return true;
    } else {
      return false;
    }
  };

  // Start the animation loop:
  this.start = function () {
    this.ship.draw();
    animate();
  };
}

function animate() {
  requestAnimFrame(animate);
  game.background.draw();
  game.ship.move();
  game.ship.bulletPool.animate();
  game.enemyPool.animate();
  game.enemyBulletPool.animate();
}

window.requestAnimFrame = (function () {
  return window.requestAnimationFrame  ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    window.oRequestAnimationFrame      ||
    window.msRequestAnimationFrame     ||
    function (callback, element) { window.setTimeout(callback, 1000 / 60); };
})();

/**
 * Custom Pool object. Holds Bullet objects to be managed to prevent garbage collection.
 */
function Pool(maxSize) {
  var size = maxSize;
  var pool = [];

  this.init = function (object) {
    if (object == "bullet") {
      for (var i = 0; i < size; i++) {
        var bullet = new Bullet("bullet");
        bullet.init(0,0,imageRepository.bullet.width, imageRepository.bullet.height);
        pool[i] = bullet;
      }
    } else if (object == "enemy") {
      for (var i=0; i<size; i++) {
        var enemy = new Enemy();
        enemy.init(0, 0, imageRepository.enemy.width, imageRepository.enemy.height);
        pool[i] = enemy;
      }
    } else if (object == "enemyBullet") {
      for (var i=0; i<size ;i++) {
        var bullet = new Bullet("enemyBullet");
        bullet.init(0, 0, imageRepository.enemyBullet.width, imageRepository.enemyBullet.height);
        pool[i] = bullet;
      }
    }
  };

  this.get = function(x, y, speed) {
    if (!pool[size - 1].alive) {
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
        if (pool[i].draw()) {
          pool[i].clear();
          pool.push((pool.splice(i,1))[0]);
        }
      } else {
        break;
      }
    }
  }
}

function Bullet(object) {
  this.alive = false;
  var self = object;

  this.spawn = function (x, y, speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.alive = true;
  };

  this.draw = function () {
    this.context.clearRect(this.x, this.y, this.width, this.height);
    this.y -= this.speed;
    if (self === "bullet" && this.y <= 0 - this.height) {
      return true;
    } else if (self === "enemyBullet" && this.y >= this.canvasHeight) {
      return true;
    } else {
      if (self === "bullet") {
        this.context.drawImage(imageRepository.bullet, this.x, this.y);
      } else if (self === "enemyBullet") {
        this.context.drawImage(imageRepository.enemyBullet, this.x, this.y);
      }
      return false;
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
  this.bulletPool.init("bullet");

  var fireRate = 15;
  var counter = 0;

  this.draw = function () {
    this.context.drawImage(imageRepository.spaceship, this.x, this.y);
  };

  this.move = function () {
    counter++;
    if (KEY_STATUS.left || KEY_STATUS.right || KEY_STATUS.down || KEY_STATUS.up) {
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

KEY_CODES = {
  32: 'space',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  74: 'left',
  73: 'up',
  75: 'down',
  76: 'right',
}

KEY_STATUS = {};
for (code in KEY_CODES) {
  KEY_STATUS[ KEY_CODES[ code ]] = false;
}

document.onkeydown = function (e) {
  var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
  if (KEY_CODES[keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[keyCode]] = true;
  }
}

document.onkeyup = function (e) {
  var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
  if (KEY_CODES[keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[keyCode]] = false;
  }
}

function Enemy() {
  var percentFire = .01;
  var chance = 0;
  this.alive = false;

  this.spawn = function (x, y, speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.speedX = 0;
    this.speedY = speed;
    this.alive = true;
    this.leftEdge = this.x - 90;
    this.rightEdge = this.x + 90;
    this.bottomEdge = this.y + 140;
  };

  this.draw = function () {
    this.context.clearRect(this.x-1, this.y, this.width+1, this.height);
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.x <= this.leftEdge) {
      this.speedX = this.speed;
    } else if (this.x >= this.rightEdge + this.width) {
      this.speedX = -this.speed;
    } else if (this.y >= this.bottomEdge) {
      this.speed = 1.5;
      this.speedY = 0;
      this.y -= 5;
      this.speedX = -this.speed;
    }
    this.context.drawImage(imageRepository.enemy, this.x, this.y);
    chance = Math.floor(Math.random()*101);
    if (chance/100 < percentFire) {
      this.fire();
    }
  };

  this.fire = function () {
    game.enemyBulletPool.get(this.x+this.width/2, this.y+this.height, -2.5);
  }

  this.clear = function () {
    this.x = 0;
    this.y = 0;
    this.speed = 0;
    this.speedX = 0;
    this.speedY = 0;
    this.alive = false;
  };
}
Enemy.prototype = new Drawable();
