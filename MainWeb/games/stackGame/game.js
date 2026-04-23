const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 600;

// Game state
let blocks = [];
let currentBlock;
let direction = 1;
let speed = 2;
let gravity = 0.4;
let isDropping = false;
let gameOver = false;
let score = 0;

// Block class
class Block {
  constructor(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.dy = 0;
  }

  update() {
    if (isDropping) {
      this.dy += gravity;
      this.y += this.dy;
    } else {
      this.x += speed * direction;

      if (this.x <= 0 || this.x + this.width >= canvas.width) {
        direction *= -1;
      }
    }
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

// Create first base block
function init() {
  blocks = [];
  score = 0;
  gameOver = false;

  const base = new Block(100, canvas.height - 40, 200, 20, "black");
  blocks.push(base);

  spawnBlock();
}

// Spawn new moving block
function spawnBlock() {
  const last = blocks[blocks.length - 1];
  currentBlock = new Block(0, last.y - 30, last.width, 20, randomColor());
  isDropping = false;
}

// Drop block
function dropBlock() {
  if (isDropping || gameOver) return;
  isDropping = true;
}

// Handle landing + physics
function checkCollision() {
  const last = blocks[blocks.length - 1];

  if (currentBlock.y + currentBlock.height >= last.y) {
    currentBlock.y = last.y - currentBlock.height;

    // Calculate overlap
    const overlap =
      Math.min(
        currentBlock.x + currentBlock.width,
        last.x + last.width
      ) - Math.max(currentBlock.x, last.x);

    if (overlap <= 0) {
      endGame();
      return;
    }

    // Trim block
    currentBlock.width = overlap;
    currentBlock.x = Math.max(currentBlock.x, last.x);

    blocks.push(currentBlock);
    score++;

    // Increase difficulty slightly
    speed += 0.1;

    spawnBlock();
  }
}

// End game
function endGame() {
  gameOver = true;
}

// Draw everything
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw blocks
  blocks.forEach(block => block.draw());
  currentBlock.draw();

  // Score
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "40px Arial";
    ctx.fillText("Game Over", 100, 300);

    ctx.font = "20px Arial";
    ctx.fillText("Click to restart", 120, 340);
  }
}

// Game loop
function update() {
  if (!gameOver) {
    currentBlock.update();

    if (isDropping) {
      checkCollision();
    }
  }

  draw();
  requestAnimationFrame(update);
}

// Helpers
function randomColor() {
  const colors = ["#FF6B6B", "#6BCB77", "#4D96FF", "#FFD93D", "#B983FF"];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Controls
canvas.addEventListener("click", () => {
  if (gameOver) {
    init();
  } else {
    dropBlock();
  }
});

// Start game
init();
update();