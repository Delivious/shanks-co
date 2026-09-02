const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1350;
canvas.height = 1350;

// Colors
const GREEN = "#00ff88";
const DARK_GREEN = "#00cc66";
const BLACK = "#000";
const WHITE = "#fff";
const GRAY = "#ccc";

// Game state
let cash = 250;
let bet = 0;
let typedBet = "";
let message = "Place your bet!";
let rolling = false;
let gameOver = false;


//save points
function savePoints() {
  localStorage.setItem('save1', cash);
  localStorage.setItem('save2', cash);
  localStorage.setItem('save3', cash);
}
let save1Active = true;
let save2Active = false;
let save3Active = false;

// Load images
const symbolNames = [
  "Watermelon.png",
  "Tangerine.png",
  "Plum.png",
  "Cherry.png",
  "Goldencherry.png",
  "Seven.png"
];

const symbols = symbolNames.map(name => {
  const img = new Image();
  img.src = name; // 🔧 adjust if needed
  return img;
});

// Grid
let grid = Array.from({ length: 3 }, () => Array(3).fill(0));

// Multipliers
const multipliers = {1:1.5,2:2,3:2.5,4:3,5:3.5,6:5};

// Keypad
let keys = [
  ["1","2","3"],
  ["4","5","6"],
  ["7","8","9"],
  ["DEL","0","ALL"],
  ["ENTER"],
  [`SAVE 1: $${localStorage.getItem('save1') || 250} Active: ${save1Active ? "Yes" : "No"} (Click me to save!)`],
  [`SAVE 2: $${localStorage.getItem('save2') || 250} Active: ${save2Active ? "Yes" : "No"}`],
  [`SAVE 3: $${localStorage.getItem('save3') || 250} Active: ${save3Active ? "Yes" : "No"}`]
];

const buttons = [];
const startX = 800;
const startY = 200;
const size = 100;
const padding = 20;

keys.forEach((row, r) => {
  if (r < 4) {
    row.forEach((key, c) => {
      buttons.push({
        key,
        x: startX + c * (size + padding),
        y: startY + r * (size + padding),
        w: size,
        h: 80
      });
    });
  }
  else if (r === 4) {
    row.forEach((key, c) => {
      buttons.push({
        key,
        x: startX,
        y: startY + 4 * (size + padding) + (r - 4) * 50,
        w: size * 3 + padding * 2,
        h: 80
      });
    });
  }
  else{
    row.forEach((key, c) => {
      buttons.push({
        key,
        x: 0,
        y: startY + 4 * (size + padding) + (r - 4.75) * 150,
        w: size * 6.57 + padding * 2,
        h: 80
      });
    });
  }
});

//saves game
function updateSaveButtons(saveSlot){
  if (saveSlot === 'save1' && save1Active) {
    localStorage.setItem(saveSlot, cash);
    keys[-3] = `SAVE 2: $${localStorage.getItem('save2') || 250} Active: ${save2Active ? "Yes" : "No"} (Click me to save!)`
  } else if (saveSlot === 'save2' && save2Active) {
    localStorage.setItem(saveSlot, cash);
    keys[-2] = `SAVE 2: $${localStorage.getItem('save2') || 250} Active: ${save2Active ? "Yes" : "No"} (Click me to save!)`
  } else if (saveSlot === 'save3' && save3Active) {
    localStorage.setItem(saveSlot, cash);
    keys[-1] = `SAVE 3: $${localStorage.getItem('save3') || 250} Active: ${save3Active ? "Yes" : "No"} (Click me to save!)`
  }
}

//swaps save slot
function toggleSaveSlot(slot){
  if (slot == 1 && !save1Active) {
    save1Active = true;
    save2Active = false;
    save3Active = false;
    keys[-3] = `SAVE 2: $${localStorage.getItem('save2') || 250} Active: ${save2Active ? "Yes" : "No"} (Click me to save!)`
    cash = localStorage.getItem('save1') || 250;
    rebuildButtons()
  } else if (slot == 2 && !save2Active) {
    save1Active = false;
    save2Active = true;
    save3Active = false;
    keys[-2] = `SAVE 2: $${localStorage.getItem('save2') || 250} Active: ${save2Active ? "Yes" : "No"} (Click me to save!)`
    cash = Number(localStorage.getItem('save1') || 250)
    rebuildButtons()
  } else if (slot == 3 && !save3Active) {
    save1Active = false;
    save2Active = false;
    save3Active = true;
    keys[-1] = `SAVE 3: $${localStorage.getItem('save2') || 250} Active: ${save3Active ? "Yes" : "No"} (Click me to save!)`
    cash = Number(localStorage.getItem('save2') || 250)
    rebuildButtons()
  }
}

const enterBtn = buttons.find(b => b.key === "ENTER");
// Mouse tracking for hover
let mouseX = 0;
let mouseY = 0;

// Draw button
function drawButton(btn) {
  const hover =
    mouseX > btn.x && mouseX < btn.x + btn.w &&
    mouseY > btn.y && mouseY < btn.y + btn.h;

  ctx.fillStyle = hover ? DARK_GREEN : GREEN;
  ctx.fillRect(btn.x, btn.y, btn.w, btn.h);

  ctx.fillStyle = BLACK;
  ctx.font = "30px Arial";
  ctx.fillText(btn.key, btn.x + 25, btn.y + 50);
}

// Draw keypad
function drawKeypad() {
  ctx.fillStyle = BLACK;
  ctx.font = "40px Arial";
  ctx.fillText(`Bet: $${typedBet || "0"}`, startX, startY - 40);

  buttons.forEach(drawButton);
}



// Draw UI
function drawUI() {
  ctx.fillStyle = BLACK;
  ctx.font = "30px Arial";
  ctx.fillText(`Cash: $${cash}`, 800, 50);
  ctx.fillText(message, 800, 100);
}

// Draw grid
function drawGrid() {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const val = grid[r][c];
      const img = val ? symbols[val - 1] : null;

      if (img && img.complete && img.naturalWidth !== 0) {
        ctx.drawImage(img, c * 250, r * 250, 200, 200);
      } else {
        ctx.fillStyle = GRAY;
        ctx.fillRect(c * 250, r * 250, 200, 200);
      }
    }
  }
}

// Roll animation
function roll() {
  rolling = true;
  message = "Rolling...";

  let start = performance.now();

  function animate(now) {
    if (now - start < 2000) {
      ctx.fillStyle = WHITE;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawKeypad();
      drawUI();

      for (let i = 0; i < 9; i++) {
        const img = symbols[Math.floor(Math.random() * 6)];
        if (img.complete) {
          ctx.drawImage(img, (i % 3) * 250, Math.floor(i/3)*250, 200, 200);
        }
      }

      requestAnimationFrame(animate);
    } else {
      finishRoll();
    }
  }

  requestAnimationFrame(animate);
}

// Finish roll
function finishRoll() {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      grid[r][c] = Math.floor(Math.random() * 6) + 1;
    }
  }

  checkWin();
  rolling = false;
}

// Win logic
function checkWin() {
  let totalWin = 0;
  let won = false;

  const allSame = grid.every(row =>
    row.every(val => val === grid[0][0])
  );

  if (allSame) {
    totalWin = bet * multipliers[grid[0][0]] * 50;
    message = `JACKPOT! $${totalWin}`;
  } else {
    for (let r = 0; r < 3; r++) {
      if (grid[r][0] === grid[r][1] && grid[r][1] === grid[r][2]) {
        totalWin += bet * multipliers[grid[r][0]] * 5;
        won = true;
      }
    }

    for (let c = 0; c < 3; c++) {
      if (grid[0][c] === grid[1][c] && grid[1][c] === grid[2][c]) {
        totalWin += bet * multipliers[grid[0][c]] * 5;
        won = true;
      }
    }
    // Diagonal top-left -> bottom-right
    if (
      grid[0][0] === grid[1][1] &&
      grid[1][1] === grid[2][2]
    ) {
      totalWin += bet * multipliers[grid[0][0]] * 5;
      won = true;
    }

    // Diagonal top-right -> bottom-left
    if (
      grid[0][2] === grid[1][1] &&
      grid[1][1] === grid[2][0]
    ) {
      totalWin += bet * multipliers[grid[0][2]] * 5;
      won = true;
    }
    if (won) {
      message = `You win $${totalWin}`;
    } else {
      totalWin = -bet;
      message = "You lost!";
    }
  }

  cash += Math.floor(totalWin);
  typedBet = "";
  bet = 0;

  if (cash <= 0) {
    gameOver = true;
    message = "Game Over!";
    gameover();
  }
}

function gameover(){
  console.log("Game Over!");
  setTimeout(() => {
    message = "Click ENTER to restart!";
  }, 2000);
}

// Click handling
canvas.addEventListener("click", e => {
  if (rolling) return;

  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  buttons.forEach(btn => {
    if (mx > btn.x && mx < btn.x+btn.w && my > btn.y && my < btn.y+btn.h) {
      if (!isNaN(btn.key)) typedBet += btn.key;
      else if (btn.key === "DEL") typedBet = typedBet.slice(0, -1);
      else if (btn.key === "ALL") typedBet = cash.toString();
      else if (btn.key.startsWith("SAVE 1")) {
        updateSaveButtons('save1');
        toggleSaveSlot(1);
      }

      else if (btn.key.startsWith("SAVE 2")) {
        updateSaveButtons('save2');
        toggleSaveSlot(2);
      }

      else if (btn.key.startsWith("SAVE 3")) {
        updateSaveButtons('save3');
        toggleSaveSlot(3);
      }
    }
  });

  // ENTER
  if (
    mx > enterBtn.x && mx < enterBtn.x + enterBtn.w &&
    my > enterBtn.y && my < enterBtn.y + enterBtn.h
  ) {
    if (typedBet) {
      bet = parseInt(typedBet);
      if (bet > cash) {
        message = "Not enough cash!";
        typedBet = "";
      } else {
        roll();
      }
    }
    else if (message === "Click ENTER to restart!") {
      cash = 250;
      gameOver = false;
      message = "Place your bet!";
      typedBet = "";
      bet = 0;
    }
  }
  
});

// Keyboard input
document.addEventListener("keydown", e => {
  if (rolling || gameOver) return;

  if (!isNaN(e.key)) typedBet += e.key;
  else if (e.key === "Backspace") typedBet = typedBet.slice(0, -1);
  else if (e.key === "Enter") {
    if (typedBet) {
      bet = parseInt(typedBet);
      if (bet <= cash) roll();
    }
  }
});

// Mouse move (hover)
canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});
function rebuildButtons() {
  buttons = [];

  keys.forEach((row, r) => {
    if (r < 4) {
      row.forEach((key, c) => {
        buttons.push({
          key,
          x: startX + c * (size + padding),
          y: startY + r * (size + padding),
          w: size,
          h: 80
        });
      });
    }
    else if (r === 4) {
      row.forEach((key) => {
        buttons.push({
          key,
          x: startX,
          y: startY + 4 * (size + padding),
          w: size * 3 + padding * 2,
          h: 80
        });
      });
    }
    else {
      row.forEach((key) => {
        buttons.push({
          key,
          x: 0,
          y: startY + 4 * (size + padding) + 100,
          w: size * 6.5,
          h: 80
        });
      });
    }
  });
}
// Main loop
function loop() {
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid();
  drawKeypad();
  drawUI();

  requestAnimationFrame(loop);
}

loop();