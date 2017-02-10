/*jshint esversion: 6 */

let brickBreak = new Phaser.Game(800, 600, Phaser.CANVAS, '', {
    preload,
    create,
    update
});

let ball;
let paddle;
let innerBricks;
let brickStyle;
let brickField;
let score = 0;
let textScore;
let highScore;
let highScoreVal = parseInt(localStorage.getItem("HighScore")) || 0;
let lives = 3;
let livesText;
let start;
let paddleMvmt = false;
let ballOnPaddle = true;
let roundText;
let gameOverText;
let music;
let sndPaddle;
let sndBrick;
let regWidth;
let gameOverBtn;
let musicOn = false;
let pause_label;
let menu;


function preload() {
    brickBreak.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    brickBreak.scale.pageAlignHorizontally = true;
    brickBreak.scale.pageAlignVertically = true;
    brickBreak.stage.background = '#000';
    brickBreak.load.crossOrigin = "anonymous";
    // add image sprites
    brickBreak.load.image("ball", "img/shiny green ball.png");
    brickBreak.load.image("paddle", "img/finalPaddle2.png");
    brickBreak.load.image("brick", "img/realTile.png");
    brickBreak.load.image("start", "img/finalstart.png");
    brickBreak.load.image("gameOverBtn", "img/finalgameover.png");
    brickBreak.load.image('paused', 'img/finalpaused.png');
    brickBreak.load.image("gameWin", "img/gamewin.png");

    brickBreak.load.audio('funk', ["audio/miniBossLoop.mp3"]);
    brickBreak.load.audio('clash', ['audio/beep3.wav']);
    brickBreak.load.audio('clink', ['audio/beepBrick.wav']);

}

function create() {
    //physics setUp
    brickBreak.physics.startSystem(Phaser.Physics.ARCADE);
    brickBreak.physics.arcade.checkCollision.down = false;
    regWidth = brickBreak.world.width * 0.5;

    start = brickBreak.add.button(regWidth, 300, "start", gameStart);
    start.scale.setTo(0.8);
    start.anchor.set(0.5);

    ball = brickBreak.add.sprite(regWidth, 514, "ball");
    brickBreak.physics.enable(ball, Phaser.Physics.ARCADE);
    ball.anchor.set(0.5);
    ball.scale.setTo(0.04, 0.04);
    ball.body.collideWorldBounds = true;
    ball.checkWorldBounds = true;
    ball.body.bounce.set(1.02);
    ball.events.onOutOfBounds.add(lostBall, this);

    paddle = brickBreak.add.sprite(regWidth, 560, "paddle");
    brickBreak.physics.enable(paddle, Phaser.Physics.ARCADE);
    paddle.anchor.set(0.5, 1);
    paddle.scale.setTo(0.4,0.4);
    paddle.body.collideWorldBounds = true;
    paddle.body.immovable = true;

    paddle.body.onCollide = new Phaser.Signal();
    paddle.body.onCollide.add(soundPaddles, this);
    if (gameOverBtn) {
      gameOverBtn.destroy();
    }
    textMaker();
    fieldMaker();
}

function update() {
  brickBreak.physics.arcade.collide(ball, paddle, paddleBallCollision);
  brickBreak.physics.arcade.collide(ball, brickField, destroyBrick);
  if (paddleMvmt) {
    if (brickBreak.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
      paddle.x -=  16;
    } else if (brickBreak.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
      paddle.x += 16;
    }
    // else {
    //
    //   // paddle.x = brickBreak.input.x || regWidth;
    // }
  }

}

function textMaker() {
    let textInfo = {
        font: "20px Copperplate",
        fill: "#FFF"
    };
    textScore = brickBreak.add.text(630, 20, `Score: ${score}`, textInfo);
    highScore = brickBreak.add.text(630, 65, `HighScore: ${highScoreVal}`, textInfo);
    livesText = brickBreak.add.text(20, 20, `Lives: ${lives}`, textInfo);

    roundText = brickBreak.add.text(regWidth, 400, 'Ready?', textInfo);
    roundText.anchor.set(0.5);
    roundText.visible = false;

    pause_label = brickBreak.add.text(20, 65, 'Pause', textInfo);
    pause_label.inputEnabled = true;
    pause_label.events.onInputUp.add(() => {
      brickBreak.paused = true;
      menu = brickBreak.add.sprite(regWidth, 300, 'paused');
      menu.anchor.set(0.5, 0.5);
      menu.scale.setTo(0.8);
      brickBreak.input.onDown.add(unpause, self);
    });
}

function unpause() {
  brickBreak.paused = false;
  menu.visible = false;
}

function fieldMaker() {
    brickStyle = {padding: 10, width: 30, offset: {top: 50,left: 160}};
    brickField = brickBreak.add.group();
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 1; x++) {
            let xBrick = (x * (brickStyle.width + brickStyle.padding)) + brickStyle.offset.left;
            let yBrick = (y * (brickStyle.width + brickStyle.padding)) + brickStyle.offset.top;
            innerBricks = brickBreak.add.sprite(xBrick, yBrick, "brick");
            brickBreak.physics.enable(innerBricks, Phaser.Physics.ARCADE);
            innerBricks.anchor.set(0.5);
            innerBricks.body.immovable = true;
            innerBricks.body.onCollide = new Phaser.Signal();
            innerBricks.body.onCollide.add(soundBricks, this);
            brickField.add(innerBricks);
        }
    }
}

function paddleBallCollision(ball, paddle) {
    ball.body.velocity.x = -2 * 5 * (paddle.x - ball.x);
    // ball.body.velocity.set(500, -500);
}

function gameStart() {
    start.destroy();
    paddleMvmt = true;
    if(!musicOn) {
    music = brickBreak.add.audio('funk');
    music.play();
  }
    releaseBall();
}

function releaseBall() {
  roundText.visible = false;
  paddleMvmt = true;
  if (ballOnPaddle) {
    ball.body.velocity.set(500, -500);
    ballOnPaddle = false;
  }
}

function destroyBrick(ball, innerBricks) {
    innerBricks.kill();
    score += 5;
    textScore.setText(`Score: ${score}`);
    checkWin();
}

function checkWin() {
    if (brickField.countLiving() === 0) {
      ball.destroy();
      gameWin = brickBreak.add.button(regWidth, 300, "gameWin", restart);
      gameWin.scale.setTo(0.8);
      gameWin.anchor.set(0.5);
    }
}

function lostBall(ball) {
    lives--;
    let reset = paddleReset();
    livesText.setText(`Lives: ${lives}`);
    if (lives) {
        ball.reset(regWidth, 514);
        ball.body.velocity.set(0);
        ballOnPaddle = true;
        roundText.visible = true;
        brickBreak.time.events.add(Phaser.Timer.SECOND * 2.2, releaseBall, this);
    } else {
        restart(ball);

    }
}

function restart(ball) {
  musicOn = true;
  sndBrick.stop();
  sndPaddle.stop();
  ballOnPaddle = true;
  lives = 3;
  ball.destroy();
  paddle.destroy();
  textScore.destroy();
  highScore.destroy();
  livesText.destroy();
  pause_label.destroy();
  if (score > highScoreVal) {
    highScoreVal = score;
  }
  window.localStorage.setItem("HighScore", highScoreVal);
  score = 0;
  roundText.destroy();
  brickField.destroy();
  gameOverBtn = brickBreak.add.button(regWidth, 300, "gameOverBtn", create);
  gameOverBtn.scale.setTo(0.8);
  gameOverBtn.anchor.set(0.5);
}

function paddleReset() {
    paddle.reset(regWidth, 560);
    paddleMvmt = false;
}

function soundPaddles() {
  sndPaddle = brickBreak.add.audio('clash');
    if (!ballOnPaddle) {
        sndPaddle.play();
    }
}

function soundBricks() {
    sndBrick = brickBreak.add.audio('clink');
    sndBrick.play();
}
