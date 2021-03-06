var game = new Game();

function init() { game.init(); }

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

  this.collidableWith = "";
  this.isColliding = false;
  this.type = "";

  this.draw = function () {};
  this.move = function () {};

  this.isCollidableWith = function (object) {
    return (this.collidableWith === object.type);
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
      this.shipStartX = this.shipCanvas.width/2 - imageRepository.spaceship.width;
      this.shipStartY = this.shipCanvas.height/4*3 + imageRepository.spaceship.height*2;
      this.ship.init(this.shipStartX, this.shipStartY, imageRepository.spaceship.width, imageRepository.spaceship.height);

      this.enemyPool = new Pool(30);
      this.enemyPool.init("enemy");
      this.spawnWave();

      this.enemyBulletPool = new Pool(50);
      this.enemyBulletPool.init("enemyBullet");

      // Start QuadTree
      this.quadTree = new QuadTree({ x:0, y:0, width: this.mainCanvas.width, height: this.mainCanvas.height });

      this.playerScore = 0;

      // Audio Files
      this.laser = new SoundPool(10);
      this.laser.init("laser");

      this.explosion = new SoundPool(20);
      this.explosion.init("explosion");

      this.backgroundAudio = new Audio("sounds/kick_shock.mp3");
      this.backgroundAudio.loop = true;
      this.backgroundAudio.volume = .25;
      this.backgroundAudio.load();

      this.gameOverAudio = new Audio("sounds/game_over.mp3");
      this.gameOverAudio.loop = true;
      this.gameOverAudio.volume = .25;
      this.gameOverAudio.load();

      this.checkAudio = window.setInterval(function () { checkReadyState() }, 1000);
    }
  };

  this.spawnWave = function () {
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
  };

  // Start the animation loop:
  this.start = function () {
    console.log("start", this.ship)
    this.ship.draw();
    this.backgroundAudio.play();
    animate();
  };

  this.gameOver = function () {
    console.log("gameOver")
    this.backgroundAudio.pause();
    this.gameOverAudio.currentTime = 0;
    this.gameOverAudio.play();
    document.getElementById("game-over").style.display = "block";
  };

  this.restart = function () {
    console.log("restart");
    this.gameOverAudio.pause();
    document.getElementById("game-over").style.display = "none";
    this.bgContext.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
    this.shipContext.clearRect(0, 0, this.shipCanvas.width, this.shipCanvas.height);
    this.mainContext.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);

    this.quadTree.clear();

    this.background.init(0, 0);
    this.ship.init(this.shipStartX, this.shipStartY, imageRepository.spaceship.width, imageRepository.spaceship.height);
    this.enemyPool.init("enemy");
    this.spawnWave();

    this.enemyBulletPool.init("enemyBullet");
    this.playerScore = 0;
    this.backgroundAudio.currentTime = 0;
    this.backgroundAudio.play();

    this.start();
  };
}

function animate() {
  document.getElementById("score").innerHTML = game.playerScore;
  // Insert objects into quad tree
  game.quadTree.clear();
  game.quadTree.insert(game.ship);
  game.quadTree.insert(game.ship.bulletPool.getPool());
  game.quadTree.insert(game.enemyPool.getPool());
  game.quadTree.insert(game.enemyBulletPool.getPool());

  detectCollision();

  if (game.enemyPool.getPool().length === 0) {
    game.spawnWave();
  }

  if (game.ship.alive) {
    // Animate game objects
    requestAnimFrame(animate);
    game.background.draw();
    game.ship.move();
    game.ship.bulletPool.animate();
    game.enemyPool.animate();
    game.enemyBulletPool.animate();
  }

}

function detectCollision() {
  var objects = [];
  game.quadTree.getAllObjects(objects);

  for (var x = 0, len = objects.length; x < len; x++) {
    game.quadTree.findObjects(obj = [], objects[x]);

    for (y = 0, length = obj.length; y < length; y++) {
      // DETECT COLLISION ALGORITHM
      if (objects[x].collidableWith === obj[y].type && (
        objects[x].x < obj[y].x + obj[y].width &&
        objects[x].x + objects[x].width > obj[y].x &&
        objects[x].y < obj[y].y + obj[y].height &&
        objects[x].y + objects[x].height > obj[y].y
      )) {
        objects[x].isColliding = true;
        obj[y].isColliding = true;
      }
    }
  }

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
        bullet.collidableWith = "enemy";
        bullet.type = "bullet";
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
        bullet.collidableWith = "ship";
        bullet.type = "enemyBullet";
        pool[i] = bullet;
      }
    }
  };

  this.getPool = function () {
    var obj = [];
    for (var i = 0; i < size; i++) {
      if (pool[i].alive) {
        obj.push(pool[i]);
      }
    }
    return obj;
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

    if (this.isColliding) { return true; }

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
    this.isColliding = false;
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

  var fireRate = 1;
  var counter = 0;

  this.collidableWith = "enemyBullet";
  this.type = "ship";

  this.init = function(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.alive = true;
    this.isColliding = false;
    this.bulletPool.init("bullet");
  }

  this.draw = function () {
    console.log("draw")
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
      if (!this.isColliding) {
        this.draw();
      } else {
        this.alive = false;
        game.gameOver();
      }
    }
    if (KEY_STATUS.space && counter >= fireRate && !this.isColliding) {
      this.fire();
      counter = 0;
    }
  };

  /*
   * Fires two bullets
   */
  this.fire = function () {
    this.bulletPool.getTwo(this.x+6, this.y, 3, this.x+33, this.y, 3);
    game.laser.get();
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
  this.collidableWith = "bullet";
  this.type = "enemy";

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

    if (this.isColliding) {
      game.playerScore += 10;
      game.explosion.get();
      return true;
    }

    this.context.drawImage(imageRepository.enemy, this.x, this.y);
    chance = Math.floor(Math.random()*101);
    if (chance/100 < percentFire) {
      this.fire();
    }
    return false;
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
    this.isColliding = false;
  };
}
Enemy.prototype = new Drawable();


/**
 * QuadTree object.
 *
 * The quadrant indexes are numbered as below:
 *     |
 *  1  |  0
 * —-+—-
 *  2  |  3
 *     |
 */
function QuadTree(boundBox, lvl) {
  var maxObjects = 10;
  this.bounds = boundBox || {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  };
  var objects = [];
  this.nodes = [];
  var level = lvl || 0;
  var maxLevels = 5;
  /*
   *    * Clears the quadTree and all nodes of objects
   *       */
   this.clear = function() {
     objects = [];
     for (var i = 0; i < this.nodes.length; i++) {
       this.nodes[i].clear();
     }
     this.nodes = [];
   };
   /*
    *    * Get all objects in the quadTree
    *       */
    this.getAllObjects = function(returnedObjects) {
      for (var i = 0; i < this.nodes.length; i++) {
        this.nodes[i].getAllObjects(returnedObjects);
      }
      for (var i = 0, len = objects.length; i < len; i++) {
        returnedObjects.push(objects[i]);
      }
      return returnedObjects;
    };
    /*
     *    * Return all objects that the object could collide with
     *       */
     this.findObjects = function(returnedObjects, obj) {
       if (typeof obj === "undefined") {
         console.log("UNDEFINED OBJECT");
         return;
       }
       var index = this.getIndex(obj);
       if (index != -1 && this.nodes.length) {
         this.nodes[index].findObjects(returnedObjects, obj);
       }
       for (var i = 0, len = objects.length; i < len; i++) {
         returnedObjects.push(objects[i]);
       }
       return returnedObjects;
     };
     /*
      *    * Insert the object into the quadTree. If the tree
      *       * excedes the capacity, it will split and add all
      *          * objects to their corresponding nodes.
      *             */
      this.insert = function(obj) {
        if (typeof obj === "undefined") {
          return;
        }
        if (obj instanceof Array) {
          for (var i = 0, len = obj.length; i < len; i++) {
            this.insert(obj[i]);
          }
          return;
        }
        if (this.nodes.length) {
          var index = this.getIndex(obj);
          // Only add the object to a subnode if it can fit completely
          //       // within one
          if (index != -1) {
            this.nodes[index].insert(obj);
            return;
          }
        }
        objects.push(obj);
        // Prevent infinite splitting
        if (objects.length > maxObjects && level < maxLevels) {
          if (this.nodes[0] == null) {
            this.split();
          }
          var i = 0;
          while (i < objects.length) {
            var index = this.getIndex(objects[i]);
            if (index != -1) {
              this.nodes[index].insert((objects.splice(i,1))[0]);
            }
            else {
              i++;
            }
          }
        }
      };
      /*
       * Determine which node the object belongs to. -1 means
       * object cannot completely fit within a node and is part
       * of the current node
       */
      this.getIndex = function(obj) {
        var index = -1;
        var verticalMidpoint = this.bounds.x + this.bounds.width / 2;
        var horizontalMidpoint = this.bounds.y + this.bounds.height / 2;
        // Object can fit completely within the top quadrant
        var topQuadrant = (obj.y < horizontalMidpoint && obj.y + obj.height < horizontalMidpoint);
        // Object can fit completely within the bottom quandrant
        var bottomQuadrant = (obj.y > horizontalMidpoint);
        // Object can fit completely within the left quadrants
        if (obj.x < verticalMidpoint &&
          obj.x + obj.width < verticalMidpoint) {
          if (topQuadrant) {
            index = 1;
          }
          else if (bottomQuadrant) {
            index = 2;
          }
        }
        // Object can fix completely within the right quandrants
        else if (obj.x > verticalMidpoint) {
          if (topQuadrant) {
            index = 0;
          }
          else if (bottomQuadrant) {
            index = 3;
          }
        }
        return index;
      };
      /*
       * Splits the node into 4 subnodes
       */
      this.split = function() {
        // Bitwise or [html5rocks]
        var subWidth = (this.bounds.width / 2) | 0;
        var subHeight = (this.bounds.height / 2) | 0;
        this.nodes[0] = new QuadTree({
          x: this.bounds.x + subWidth,
          y: this.bounds.y,
          width: subWidth,
          height: subHeight
        }, level+1);
        this.nodes[1] = new QuadTree({
          x: this.bounds.x,
          y: this.bounds.y,
          width: subWidth,
          height: subHeight
        }, level+1);
        this.nodes[2] = new QuadTree({
          x: this.bounds.x,
          y: this.bounds.y + subHeight,
          width: subWidth,
          height: subHeight
        }, level+1);
        this.nodes[3] = new QuadTree({
          x: this.bounds.x + subWidth,
          y: this.bounds.y + subHeight,
          width: subWidth,
          height: subHeight
        }, level+1);
      };
}

function SoundPool(maxSize) {
  var size = maxSize;
  var pool = [];
  this.pool = pool;
  var currSound = 0;
  /*
   * Populates the pool array with the given sound.
   */
  this.init = function (object) {
    if (object == "laser") {
      for (var i = 0; i < size; i++) {
        // Initialize the sound
        laser = new Audio("sounds/laser.mp3");
        laser.volume = .12;
        laser.load();
        pool[i] = laser;
      }
    } else if (object == "explosion") {
      for (var i = 0; i < size; i++) {
        var explosion = new Audio("sounds/explosion.mp3");
        explosion.volume = .1;
        explosion.load();
        pool[i] = explosion;
      }
    }
  };

  /*
   * Plays a sound
   */
  this.get = function () {
    if(pool[currSound].currentTime == 0 || pool[currSound].ended) {
      pool[currSound].play();
    }
    currSound = (currSound + 1) % size;
  };
}

function checkReadyState() {
  if (game.gameOverAudio.readyState === 4 && game.backgroundAudio.readyState === 4) {
    window.clearInterval(game.checkAudio);
    game.start();
  }
}
