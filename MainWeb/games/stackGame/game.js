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
let landed = false; // ✅ FIX: prevents repeated collision processing

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

// Init game
function init() {
  blocks = [];
  gameOver = false;
  speed = 2;

  const base = new Block(100, canvas.height - 40, 200, 20, "black");
  blocks.push(base);

  spawnBlock();
}

// Spawn block
function spawnBlock() {
  const last = blocks[blocks.length - 1];
  currentBlock = new Block(0, last.y - 30, last.width, 20, randomColor());

  isDropping = false;
  landed = false; // ✅ reset landing lock
}

// Drop block
function dropBlock() {
  if (isDropping || gameOver) return;
  isDropping = true;
}

// Landing physics (FIXED)
function handleLanding() {
  if (landed) return; // ✅ prevent multiple triggers

  const last = blocks[blocks.length - 1];

  // wait until block reaches stack
  if (currentBlock.y + currentBlock.height < last.y) return;

  landed = true; // lock immediately

  // snap to position
  currentBlock.y = last.y - currentBlock.height;

  const left = Math.max(currentBlock.x, last.x);
  const right = Math.min(
    currentBlock.x + currentBlock.width,
    last.x + last.width
  );

  let overlap = right - left;

  // ❌ miss = game over
  if (overlap <= 0) {
    screenShake();
    endGame();
    return;
  }

  // ✂ trim block
  currentBlock.width = overlap;
  currentBlock.x = left;

  // stabilize position (prevents micro jitter)
  currentBlock.x = Math.round(currentBlock.x);

  isDropping = false;
  currentBlock.dy = 0;

  blocks.push(currentBlock);

  speed += 0.1;
  spawnBlock();
}

// Game over
function endGame() {
  gameOver = true;
}

// Draw everything
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  blocks.forEach(b => b.draw());
  if (currentBlock) currentBlock.draw();

  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + (blocks.length - 1), 10, 30);

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "40px Arial";
    ctx.fillText("Game Over", 90, 300);

    ctx.font = "20px Arial";
    ctx.fillText("Click to restart", 120, 340);
  }
}

// Game loop
function update() {
  if (!gameOver) {
    currentBlock.update();
    handleLanding();
  }

  draw();
  requestAnimationFrame(update);
}

// Utils
function randomColor() {
  const colors = ["#FF6B6B", "#6BCB77", "#4D96FF", "#FFD93D", "#B983FF"];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Screen shake
function screenShake() {
  canvas.style.transform = "translate(5px, 5px)";
  setTimeout(() => {
    canvas.style.transform = "translate(0, 0)";
  }, 100);
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