let currentSprite = "";
let keys = {};
// prevents reloading same image every frame
function setSprite(src){
  if(currentSprite !== src){
    character.src = src;
    currentSprite = src;
  }
}

function bossFight(){
  let playerHealth = 5
  let playerhit = false
  bossHealth = 100
  bossBody.src = "assets/bosstest.png"
  bossBody.id = "bossGuy"
  document.body.appendChild(bossBody)
  let ifPressed = false
  let newDiv = null
  let hit = false
  move = setInterval(()=>{

    moving = false; // reset every frame  
    crouch = false;

    if(keys["a"]){
      
      x -= moveX * speedMultiplier;
      left = true;
      right = false;
      moving = true;
    }

    if(keys["s"]){
      y += moveY;
      crouch = true;
    }

    if(keys["d"]) {
      x += moveX * speedMultiplier;
      left = false;
      right = true;
      moving = true;
    }

    if(keys["w"] && onGround){
      if (newDiv) {
        
      }
      velocityY = -20;
      onGround = false;
    }

    velocityY += 1;
    y += velocityY;

    if(y > 0){
      y = 0;
      velocityY = 0;
      onGround = true;
    }

    // SPEED CONTROL
    if (moving){
      moveX += 1;
      if (moveX >= 4){
        moveX = 4;
        
      }
    } else {
      moveX -= 1;
      if (moveX <= 0){
        moveX = 0;
      }
      
    }
    if (bossHealth <= 0){
      bossHealth = 0
      bossBody.style.display = "none"
    }
    if (playerHealth <= 0) {
      // Handle player defeat (e.g., reset fight, show game over, etc.)
      alert("You have been defeated! Try again.");
      playerHealth = 5; // Reset player health
      bossHealth = 100; // Reset boss health
      // Reset player and boss states as needed
    }
    //  SPRITE LOGIC
    if (!onGround) {
      // JUMPING (overrides everything)
      if (right) {
        setSprite("assets/jumpright.gif");
      } else if (left) {
        setSprite("assets/jumpleft.gif");
      }
    } else if (crouch) {
      // CROUCH STATE
      if (right) {
        setSprite("assets/crouchright.gif");
      } else if (left) {
        setSprite("assets/crouchleft.gif");
      }
    } else if (moving) {
      // WALKING
      if (right) {
        setSprite("assets/walkingright.gif");
      } else if (left) {
        setSprite("assets/walkingleft.gif");
      }
    } else {
      // IDLE
      if (right) {
        setSprite("assets/facingright.png");
      } else if (left) {
        setSprite("assets/facingleft.png");
      }
    }

    // APPLY POSITION
    character.style.transform = `translate(${x}px, ${y}px)`;
    character.id = "character"
    if (isColliding(character, bossBody) && !playerhit){
      playerhit = true
      playerHealth -= 1
      console.log(`Player Health: ${playerHealth}`)
      setTimeout(() => {
        playerhit = false
      },2000)
    }
  },16);
  setInterval(()=>{
    let positionLeft = character.getBoundingClientRect().left;
    let positionRight = character.getBoundingClientRect().right;
    let positionBottom = character.getBoundingClientRect().bottom;
    let positionTop = character.getBoundingClientRect().top;
    if (keys["e"] && !ifPressed){
      ifPressed = true
      newDiv = document.createElement("div")
      console.log("E key pressed")
      newDiv.style.backgroundColor = "red"
      newDiv.style.width = "85px"
      newDiv.style.height = "90px"
      newDiv.style.zIndex = "100000000000000000000000000000000000000"
      if (!onGround ){
        newDiv.style.position = "fixed";
        newDiv.style.left = `${positionLeft + 75}px`;
        newDiv.style.top = `${positionBottom - 40}px`;
        

      }
      else if(right){
        newDiv.style.position = "fixed";
        newDiv.style.left = `${positionRight + -75}px`;
        newDiv.style.top = `${positionBottom + -150}px`;
      }
      else if(left){
        newDiv.style.position = "fixed";
        newDiv.style.left = `${positionLeft-25}px`;
        newDiv.style.top = `${positionBottom + -150}px`;
      }
      document.body.appendChild(newDiv)
      setTimeout(() => {
        newDiv.remove()
        ifPressed = false
      }, 200);
    }
    
    if(newDiv && isColliding(newDiv, bossBody) && !hit){
      // Handle collision with boss
      bossHealth += -1 * damageMultiplier
      console.log(`Boss Health: ${bossHealth}`)
      hit = true
      setTimeout(() => {
        hit = false
      }, 201);
    }
    if(!onGround && hit){
          velocityY = -10;
          onGround = false;
        }
    if (bossHealth <= 0){
      arenaBtn.dispatchEvent("click")
    }

  }, 1);
  
}
function isColliding(el1, el2) {
    let rect1 = el1.getBoundingClientRect();
    let rect2 = el2.getBoundingClientRect();
    return !(
        rect1.top > rect2.bottom ||
        rect1.bottom < rect2.top ||
        rect1.left > rect2.right ||
        rect1.right < rect2.left
    );
}
arenaBtn.addEventListener("click", ()=>{
  const display = getComputedStyle(bossArena).display
  if (display == "none"){
    bossArena.style.display = "block"
    bossArenaMain.style.display = "block"
    character.style.display = "block"
    bossBody.style.display = "block"
    bossFight()
  }
  //exits if you kill the boss
  else if(bossHealth <= 0){
    bossArena.style.display = "none"
    bossArenaMain.style.display = "none"
    character.style.display = "none"
    bossBody.style.display = "none"
    character.style.transform = `translate(0px, 0px)`
    clearInterval(move)
  }
  else if (display == "block"){
    bossArena.style.display = "none"
    bossArenaMain.style.display = "none"
    character.style.display = "none"
    bossBody.style.display = "none"
    character.style.transform = `translate(0px, 0px)`
    clearInterval(move)
  }
})
document.addEventListener("keydown", (e)=>{
  keys[e.key] = true
})

document.addEventListener("keyup", (e)=>{
  keys[e.key] = false
})