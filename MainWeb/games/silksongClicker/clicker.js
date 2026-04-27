//variables
const rebirthBtnToRebirth = document.querySelector("#rebirthBtnToRebirth")
const skill1 = document.querySelector("#skill1")
const bossBody = document.createElement("img")
const skill2 = document.querySelector("#skill2")
const skill3 = document.querySelector("#skill3")
const skill4 = document.querySelector("#skill4")
const rebirthTokensText = document.querySelector("#rebirthTokensText")
const lighttool=document.querySelector("#lighttool")
const hornetBtn = document.querySelector("#hornetBtn1")
const hornetPara = document.querySelector("#hornetVal")
const paleOil = document.querySelector("#paleOil")
const sharpen=document.querySelector("#sharpen")
const rpsText=document.querySelector("#rps")
const body=document.querySelector("#body")
const modeForm = document.querySelector("#modeForm")
const upg1Desc=document.querySelector("#upg1Desc")
const upg2Desc=document.querySelector("#upg2Desc")
const upg3Desc=document.querySelector("#upg3Desc")
const upg4Desc=document.querySelector("#upg4Desc")
const upg5Desc=document.querySelector("#upg5Desc")
const upg6Desc=document.querySelector("#upg6Desc")
const upg7Desc=document.querySelector("#upg7Desc")
const upg8Desc=document.querySelector("#upg8Desc")
const upg9Desc=document.querySelector("#upg9Desc")
const upg10Desc=document.querySelector("#upg10Desc")
const upg11Desc=document.querySelector("#upg11Desc")
const bossArenaMain = document.querySelector("#bossArenaMain")
const upgradeContainer=document.querySelector("#upgradeContainer")
const bossArena = document.querySelector("#bossArena")
const arenaBtn = document.querySelector("#arenaBtn")
const threefoldBtn=document.querySelector("#threefold")
const upg2 = document.querySelector("#upg2")
const upg1 = document.getElementById("upg1");
const upg1Img = document.querySelector("#upg1 img");
const upg4 = document.querySelector("#upg4")
const upg3 = document.querySelector("#upg3")
const upg5 = document.querySelector("#upg5")
const upg6 = document.querySelector("#upg6")
const upg7 = document.querySelector("#upg7")
const upg8 = document.querySelector("#upg8")
const upg9 = document.querySelector("#upg9")
const upg10 = document.querySelector("#upg10")
const upg11 = document.querySelector("#upg11")
const btn1 = document.querySelector("#btn1")
const btn2 = document.querySelector("#btn2")
const btn3 = document.querySelector("#btn3")
const btn4 = document.querySelector("#btn4")
const btn5 = document.querySelector("#btn5")
const btn6 = document.querySelector("#btn6")
const btn7 = document.querySelector("#btn7")
const btn8 = document.querySelector("#btn8")
const btn9 = document.querySelector("#btn9")
const rebirthBtn = document.querySelector("#rebirthBtn")
const rebirthMenu = document.querySelector("#rebirthMenu")
const rebirthTree = document.querySelector("#rebirthTree")
const character = document.querySelector("#character")
const soundList = ["assets/deeperren.mp3", "assets/gauruma.mp3", "assets/haaa.mp3", "assets/hegale.mp3", "assets/hornet_edino.mp3", "assets/hornet_gitgud.mp3", "assets/ren.mp3", "assets/shaw.mp3"]
const btnList = [btn1, btn2, btn3, btn4, btn5, btn6, btn7, btn8, hornetBtn, btn9]
const upgList = [upg1, upg2, upg3, upg4, upg5, upg6, upg7, upg8, upg9, upg10, upg11]
const upgChildren = [upg1Desc, upg2Desc, upg3Desc, upg4Desc, upg5Desc, upg6Desc, upg7Desc, upg8Desc, upg9Desc, upg10Desc, upg11Desc]
const skillList = [skill1, skill2, skill3, skill4]
// replace any usage of undeclared skill1Desc etc with safe selections:
const skillChildren = ["#skill1Desc", "#skill2Desc", "#skill3Desc", "#skill4Desc"]
  .map(id => document.querySelector(id))
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let costs = [50,200,750,3000]
let counts = [0,0,0,0]
let actives = [null, null, null, null]
let roseValue = 0
let multiplier = 1
let distance = 0
let hornetBtnNew = null
let distanceX=0
let spaceCounter=0
let displayMenu = false
let bossHealth = 0
let purchase1 = false
let newDivGlobal = null
let purchase2 = false
let purchase3 = false
let purchase4 = false
let purchase5 = false
let bought1 = false
let bought2 = false
let bought3 = false
let bought4 = false
let rpsCounter = 0
let sharpenMultiplier = 1
let rps = 0
let rpsSubtract = 0
let skill1Cost = 3
let skill2Cost = 5
let skill3Cost = 5
let skill4Cost = 7
let rebirthMultiplier = 1
let rebirthCount=0
let rebirthTokens=0
let rebirthCost=100000
const keys = {}
let x = 0
let y = 0
let clicked = false
let rpsPercent = 0
let rpsRebirth = 0
let moveX = 0
let moveY = 0
let velocityY = 0
let onGround = true
let left = false
let right = true
let moving = false
let noiseMode = false
let move = null
let charPos = 0
let clickcost=500
let lofiBeat = null
let canPlay = true
let crouch=false
let priceMultiplier = 1
let damageMultiplier = 1
let speedMultiplier = 1
let currencyMultiplier = 1
function spawnShanks() {
  const randomNum = Math.floor(Math.random() * 1000);
  if (randomNum) {
    const shank = document.createElement("img");
    shank.classList.add("shank");
    let direction = 0.5;
    // prefer a global THESHANKS array if provided, otherwise use the three images in ./THESHANKS/
    const defaultDir = "THESHANKS";
    const defaultFiles = [
      `${defaultDir}/ninjashanks.png`, //he steals all the upgrades and sells them to you at half price
      `${defaultDir}/tabbycatshanks.png`, //kitty cat finds and give you your worth in rosearys from 10 minutes
      `${defaultDir}/v1shanks.png`, //speed buff
      `${defaultDir}/gojoshanks.png`, //damage buff
      `${defaultDir}/normalshanks.png` //x2 multi
    ];

    const shankChoices = (typeof THESHANKS !== "undefined" && Array.isArray(THESHANKS) && THESHANKS.length > 0)
      ? THESHANKS
      : defaultFiles;

    shank.src = shankChoices[Math.floor(Math.random() * shankChoices.length)];
    const shanksSrc = shank.src.split("/").pop().split(".")[0]; // get filename without extension
    shank.alt = "shank";
    shank.style.zIndex = "1000000000000000";
    shank.id = "shank"
    // ensure positioning works even if .shank CSS doesn't set position
    shank.style.position = "fixed";
    shank.style.left = `${Math.random() * 90}vw`; // keep inside viewport
    shank.style.top = `${Math.random() * 90}vh`;
    shank.style.pointerEvents = "auto"; // allow clicking
    shank.addEventListener("click", clickShanks.bind(null, shanksSrc, shank));
    document.body.appendChild(shank);
    setTimeout(() => {
      shank.remove();
    }, 15000);
    funnyGuyBounce(shank);
    setInterval(() => {
      if (shank) {
        direction *= -1;
        funnyGuyBounce(shank, direction);
        
      }
    }, 500);
  }
}
function clickShanks(src, shank) {
  // Handle shank click
  let shanksClicked = {}
  shank.remove()
  shanksClicked={
    "ninjashanks": () => {
      priceMultiplier = 0.5
      const globalHeader = document.createElement("h2")
      globalHeader.textContent = "Ninja Shanks has stolen the upgrades! They cost half as much to get back for the next minute!"
      globalHeader.id = "shankHeader"
      clicked = true
      setTimeout(() => {
        clicked = false
        priceMultiplier = 1
        globalHeader.remove()
        sharpen.textContent = `Get your Nail to slash attack the button for ${5*sharpenMultiplier} Rosaries a second! Cost: ${costs[1]*priceMultiplier} Rosaries`
      lighttool.textContent =
      `Get a Light Throwing Tool that gets you 1 Rosarie per second! Cost: ${costs[0]*priceMultiplier} Rosaries`
      paleOil.textContent = `Get your Pale Oil to *BUFF* every one of your tools by +3 Rosaries! Cost: ${costs[3]*priceMultiplier} Rosaries` 
      threefoldBtn.textContent = `Get your Threefold Pin and throw pins at the button for 15 Rosaries a second! Cost: ${costs[2]*priceMultiplier} Rosaries`
      }, 60000)
      sharpen.textContent = `Get your Nail to slash attack the button for ${5*sharpenMultiplier} Rosaries a second! Cost: ${costs[1]*priceMultiplier} Rosaries`
      lighttool.textContent =
      `Get a Light Throwing Tool that gets you 1 Rosarie per second! Cost: ${costs[0]*priceMultiplier} Rosaries`
      paleOil.textContent = `Get your Pale Oil to *BUFF* every one of your tools by +3 Rosaries! Cost: ${costs[3]*priceMultiplier} Rosaries` 
      threefoldBtn.textContent = `Get your Threefold Pin and throw pins at the button for 15 Rosaries a second! Cost: ${costs[2]*priceMultiplier} Rosaries`
      document.body.appendChild(globalHeader)
    },
    "tabbycatshanks": () => {
      clicked = true
      const globalHeader = document.createElement("h2")
      globalHeader.textContent = "Tabby Cat Shanks has searched far and wide for your worth in Rosaries! You gain 10 minutes worth of Rosaries!"
      globalHeader.id = "shankHeader"
      roseValue += rps * 600
      setTimeout(() => {
        clicked = false
        globalHeader.remove()
      }, 5000)
      document.body.appendChild(globalHeader)
    },
    "v1shanks": () => {
      clicked = true
      const globalHeader = document.createElement("h2")
      globalHeader.textContent = "V1 Shanks has granted his agility! Your speed in the boss arena is doubled for the next 5 minutes!"
      globalHeader.id = "shankHeader"
      speedMultiplier = 2
      setTimeout(() => {
        speedMultiplier = 1
        globalHeader.remove()
        clicked = false
      }, 300000)
      document.body.appendChild(globalHeader)
  },
  "gojoshanks": () => {
      clicked = true
      const globalHeader = document.createElement("h2")
      globalHeader.textContent = "Gojo has granted his cursed energy! Your damage in the boss arena is doubled for the next 5 minutes!"
      globalHeader.id = "shankHeader"
      damageMultiplier = 2
      setTimeout(() => {
        clicked = false
        damageMultiplier = 1
        globalHeader.remove()
      }, 300000)
      document.body.appendChild(globalHeader)
  },
  "normalshanks": () => {
    clicked = true
      const globalHeader = document.createElement("h2")
      globalHeader.textContent = "Shanks has granted you his wealth! Your currency is doubled for the next 5 minutes!"
      globalHeader.id = "shankHeader"
      currencyMultiplier = 2
      setTimeout(() => {
        currencyMultiplier = 1
        globalHeader.remove()
        clicked = false
      }, 300000)
      document.body.appendChild(globalHeader)
  }
}
  shanksClicked[src]?.()
}
function funnyGuyBounce(shank, direction){
  // deterministic single-rAF bounce + rotation; no setInterval inside rAF
  const bounceHeight = 40;
  const bounceDuration = 500; // ms
  const maxRotate = 12; // degrees
  const start = performance.now();
  // random rotation direction
  let rot = 5 * direction;
  function step(timestamp) {
    const elapsed = timestamp - start;
    const t = Math.min(elapsed / bounceDuration, 1); // normalized 0..1

    // smooth vertical bounce (sine) and rotational oscillation (sine)
    const y = Math.sin(t * Math.PI) * bounceHeight;
    rot += direction;

    shank.style.transform = `translateY(-${y}px) rotate(${rot}deg)`;
    
    if (t < 1) {
      requestAnimationFrame(step);
      
      
    } else {
      // ensure clean final state
      shank.style.transform = `translateY(0px) rotate(0deg)`;
      // reverse direction for next bounce
      
    }
  }

  requestAnimationFrame(step);
}
//Changes background color of upgrade menu (top right)
function updateBackgroundColors() {
  //variables
  let backgroundColorUpg1r=4
  let backgroundColorUpg1g=57
  let backgroundColorUpg1b=92
  let backgroundColorUpg2r=30
  let backgroundColorUpg2g=30
  let backgroundColorUpg2b=30
  let maxReached = false
  let minReached = true
  let backgroundColorUpg1 = `rgb(${backgroundColorUpg1r}, ${backgroundColorUpg1g}, ${backgroundColorUpg1b})`;
  let backgroundColorUpg2 = `rgb(${backgroundColorUpg2r}, ${backgroundColorUpg2g}, ${backgroundColorUpg2b})`;
  const MIN = 4
  const MAX = 120
  // time loop for background color changes
  setInterval(() => {
    if (//checks for background colors if they are greater than the max size
      (backgroundColorUpg1r <= MAX &&
      backgroundColorUpg1g <= MAX &&
      backgroundColorUpg1b <= MAX &&
      backgroundColorUpg2r <= MAX &&
      backgroundColorUpg2g <= MAX &&
      backgroundColorUpg2b <= MAX) && minReached) 
    {
      backgroundColorUpg1r++
      backgroundColorUpg1g++
      backgroundColorUpg1b++
      backgroundColorUpg2r++
      backgroundColorUpg2g++
      backgroundColorUpg2b++
      //sets maxReahed turns off minReached
      if (backgroundColorUpg1r > MAX || backgroundColorUpg1g > MAX || backgroundColorUpg1b > MAX || (backgroundColorUpg2r > MAX || backgroundColorUpg2g > MAX || backgroundColorUpg2b > MAX)){
        maxReached = true
        minReached = false
      }
    } 
    if (// opposite of the top if statement
      (backgroundColorUpg1r >= MIN &&
      backgroundColorUpg1g >= MIN &&
      backgroundColorUpg1b >= MIN &&
      backgroundColorUpg2r >= MIN &&
      backgroundColorUpg2g >= MIN &&
      backgroundColorUpg2b >= MIN)&&maxReached)
    {
      backgroundColorUpg1r-=1
      backgroundColorUpg1g-=1
      backgroundColorUpg1b-=1
      backgroundColorUpg2r-=1
      backgroundColorUpg2g-=1
      backgroundColorUpg2b-=1
      //sets minReached turns off maxReached
      if (backgroundColorUpg1r < MIN || backgroundColorUpg1g < MIN || backgroundColorUpg1b < MIN || backgroundColorUpg2r < MIN || backgroundColorUpg2g < MIN || backgroundColorUpg2b < MIN){
        maxReached = false
        minReached = true
      }
    }
    //sets background of the container to the new colors
    backgroundColorUpg1 = `rgb(${backgroundColorUpg1r}, ${backgroundColorUpg1g}, ${backgroundColorUpg1b})`;
    backgroundColorUpg2 = `rgb(${backgroundColorUpg2r}, ${backgroundColorUpg2g}, ${backgroundColorUpg2b})`;
    upgradeContainer.style.background = `linear-gradient(90deg, ${backgroundColorUpg1}, ${backgroundColorUpg2}, ${backgroundColorUpg1}, ${backgroundColorUpg2}, ${backgroundColorUpg1}, ${backgroundColorUpg2})`;
  }, 50);
}
//starts background change
updateBackgroundColors()
//checks for user input to autoplay background music
document.addEventListener("mousedown",()=>{
  //checks if the music can be played without overlapping
  if (canPlay){
    canPlay=false
    setTimeout(()=>{
      lofiBeat = (new Audio("assets/silkMusic.mp3")).play()
    },1)
  }
  setInterval(()=>{
      //checks if the music can be played without overlapping
      if (canPlay){
        canPlay=false
        setTimeout(()=>{
          lofiBeat = (new Audio("assets/silkMusic.mp3")).play()
        },1)
        setTimeout(()=>{
          canPlay=true
        },158000)
      }
  },158005)
})
//func for formatting numbers for high values
function formatNumber(num) {
  //checks if number is less than 1000, if it is it returns the number with 2 decimals
  if (num < 1000) return num.toFixed(2);
  //otherwise it formats the number with suffixes
  const suffixes = [
    "", "K", "M", "B", "T",
    "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"
  ];
//equations
  let exponent = Math.floor(Math.log10(num));
  let tier = Math.floor(exponent / 3);
  // if statement for checking tier
  if (tier < suffixes.length) {
    let scaled = num / Math.pow(10, tier * 3);
    return scaled.toFixed(2) + suffixes[tier];
  }
  // sets the tier
  let mantissa = num / Math.pow(10, exponent);
  return mantissa.toFixed(2) + "e" + exponent;
}
let rpsPrevious = 0
const arenaRect = bossArenaMain.getBoundingClientRect()
const maxX = arenaRect.right 
const minX = arenaRect.left
//rebirth function to reset stats for a boost
function rebirth(){
  if(roseValue >= rebirthCost){
    roseValue-=rebirthCost
    roseValue = 0
    multiplier = 1
    sharpenMultiplier = 1
    distance = 0
    if (hornetBtn) hornetBtn.style.display = "none";
    if (hornetBtnNew) hornetBtnNew.style.display = "none";
    hornetBtnNew = null
    hornetBtn.style.display = "block"
    distanceX=0
    displayMenu = false
    counts = [0,0,0,0]
    costs = [50,200,750,3000]
    purchase1 = false
    purchase2 = false
    purchase3 = false
    upg1.style.display = "block"
    upg1Img.src = "assets/mouse1.png"
    upg2.style.display = "block"
    upg3.style.display = "block"
    upg4.style.display = "block"
    upg5.style.display = "block"
    upg6.style.display = "block"
    upg7.style.display = "block"
    upg8.style.display = "block"
    upg9.style.display = "block"
    upg10.style.display = "block"
    upg11.style.display = "block"
    rpsCounter = 0
    rps = 0
    rpsPercent = 0
    rpsSubtract = 0
    rebirthCount+=1
    rebirthTokens+=10
    clearInterval(actives[0])
    clearInterval(actives[1])
    clearInterval(actives[2])
    actives = [null, null, null, null]
    rebirthCost=rebirthCost*2.5
    rebirthBtnToRebirth.textContent = `Rebirth for ${rebirthCost} Rosaries`
    sharpen.textContent = `Get your Nail to slash attack the button for ${5*sharpenMultiplier} Rosaries a second! Cost: ${costs[1]} Rosaries`
    lighttool.textContent = `Get a Light Throwing Tool that gets you 1 Rosarie per second! Cost: ${costs[0]} Rosaries`
    threefoldBtn.textContent = `Get your Threefold Pin and throw pins at the button for 15 Rosaries a second! Cost: ${costs[2]} Rosaries`
    if (rebirthCount >= 1){
      paleOil.style.display = "block"
    }
  }
}
//button event listeners
rebirthBtnToRebirth.addEventListener("click",rebirth)
sharpen.addEventListener("click",sharpened)
hornetBtn.addEventListener("click",addValue)
lighttool.addEventListener("click",throwy)
threefoldBtn.addEventListener("click",threefoldfunc)
paleOil.addEventListener("click",paleOilFunc)
//checks the form if they want button noise
modeForm.addEventListener("change",(c)=>{
  if (c.target.value == "ButtonNoise"){
    noiseMode=true
  }
  else{
    noiseMode=false
  }
})
//button event listeners
btn1.addEventListener("click",addValue)
btn2.addEventListener("click",addValue)
btn3.addEventListener("click",addValue)
btn4.addEventListener("click",addValue)
btn5.addEventListener("click",addValue)
btn6.addEventListener("click",addValue)
btn7.addEventListener("click",addValue)
btn8.addEventListener("click",addValue)
btn9.addEventListener("click",addValue)
//updates the hornetPara text content
setInterval(()=>{
  hornetPara.textContent = `Rosaries: ${formatNumber(roseValue)}`
},100)
//only allow skill1 to be bought once (doing comments for this skill only btw)
skill1.addEventListener("click",()=>{
  //checks if the user has enough rebirth tokens
  if(rebirthTokens>=skill1Cost){
    //checks if the skill has already been bought
    if(!bought1){  
      //removes currency and applies buff
      rebirthTokens-=skill1Cost
      rebirthMultiplier=rebirthMultiplier*2
      bought1 = true
      skill1.style.backgroundColor = "green"
    }
  }
})
skill2.addEventListener("click",()=>{
  if(rebirthTokens>=skill2Cost && bought1){
  if(!bought2){   
      rebirthTokens-=skill2Cost
      rebirthMultiplier=rebirthMultiplier*2
      bought2 = true
      skill2.style.backgroundColor = "green"
    }
  }
})
skill3.addEventListener("click",()=>{
  if(rebirthTokens>=skill3Cost && bought1){
    if(!bought3){  
      //this one uses percentages to buff your clicks by your rps
      rebirthTokens-=skill3Cost
      rpsRebirth+=0.01
      bought3 = true
      skill3.style.backgroundColor = "green"
    }
  }
})
skill4.addEventListener("click",()=>{
  if(rebirthTokens>=skill4Cost && bought3){
    if (!bought4){
      rebirthTokens-=skill4Cost
      rebirthMultiplier=rebirthMultiplier*2
      bought4 = true
      skill4.style.backgroundColor = "green"
  
    }  
  }
})
//these are key inputs
document.addEventListener("keydown", (e)=>{
  keys[e.key] = true
})

document.addEventListener("keyup", (e)=>{
  keys[e.key] = false
})
//displays boss arena and disables it
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
    clearInterval(move)
  }
})
//displays the rebirth menu
rebirthBtn.addEventListener("click", () => {
  const displayMenu = (getComputedStyle(rebirthMenu).display == "none")
  if (displayMenu){
    rebirthMenu.style.display = "flex"
    rebirthTree.style.display = "flex"
    rebirtheTokenInt = setInterval(()=>{
      rebirthTokensText.textContent = `Rebirth Tokens: ${rebirthTokens}`
    },100)
  } 
  else {
    rebirthMenu.style.display = "none"
    rebirthTree.style.display = "none"
    clearInterval(rebirthTokenInt)
  }
})
// adds an event listener for each element in the upgrade list
upgList.forEach((el, idx) => {
  if (!el) return
  el.addEventListener('mouseenter', () => {
    upgChildren[idx].style.display = 'block'
  })
  el.addEventListener('mouseleave', () => {
    upgChildren[idx].style.display = 'none'
  })
})
// adds an event listener for each element in the skill list
skillList.forEach((el, idx) => {
  if (!el) return
  el.addEventListener('mouseenter', () => {
    skillChildren[idx].style.display = 'block'
  })
  el.addEventListener('mouseleave', () => {
    skillChildren[idx].style.display = 'none'
  })
})
//checks for key press space to click for you
addEventListener("keydown",(e)=>{
  if (e.code=="Space"){
    e.preventDefault()
    addValue()
  }
})
//upgrade event listeners
upg1.addEventListener("click", () => {
  //checks if purchased and have enough for it
  if (roseValue >= clickcost*priceMultiplier && !purchase1) {
    roseValue -= clickcost*priceMultiplier
    upg1Img.src = "assets/mouse2.png"
    multiplier *= 2
    purchase1 = true
    clickcost *=2
  }

  else if (roseValue >= clickcost*priceMultiplier && !purchase2) {
    roseValue -= clickcost*priceMultiplier
    upg1Img.src = "assets/mouse3.png"
    multiplier *= 2
    purchase2 = true
    clickcost *=2
  }

  else if (roseValue >= clickcost*priceMultiplier && !purchase3) {
    roseValue -= clickcost*priceMultiplier
    upg1Img.src = "assets/mouse4.png"
    multiplier *= 2
    purchase3 = true
    clickcost *=2
  }

  else if (roseValue >= clickcost*priceMultiplier && !purchase4) {
    roseValue -= clickcost*priceMultiplier
    upg1Img.src = "assets/mouse5.png"
    multiplier *= 2
    purchase4 = true
    clickcost *=2
  }
  else if (roseValue >= clickcost*priceMultiplier && !purchase5) {
    roseValue -= clickcost*priceMultiplier
    upg1Img.src = "assets/mouse6.png"
    multiplier *= 2
    purchase5 = true
    clickcost *=2
  }

  else if (roseValue >= clickcost*priceMultiplier && purchase5) {
    roseValue -= clickcost*priceMultiplier
    upg1.style.display = "none"
    multiplier *= 2
  }

})
upg2.addEventListener("click", () => {
  if (roseValue >= 1000*priceMultiplier) {
    roseValue -= 1000*priceMultiplier
    upg2.style.display = "none"
    sharpenMultiplier+=1
    sharpen.textContent = `Get your Nail to slash attack the button for ${5*sharpenMultiplier} Rosaries a second! Cost: ${costs[1]*priceMultiplier} Rosaries`
  }
})
upg4.addEventListener("click", () => {
  if (roseValue >= 2500*priceMultiplier) {
    roseValue -= 2500*priceMultiplier
    upg4.style.display = "none"
    multiplier+=1
    
  }
})
//counts rps
setInterval(()=>{
  rpsText.textContent=`Your RPS is: ${rps}`
  rpsPrevious = rps
  rps=0
},1000)
//pointless function i think
function colorchange(){
  if (body.style.backgroundColor!="black"){
    body.style.backgroundColor="black"
  }
  else{
    body.style.backgroundColor="white"
  }
  
}
//sprite used in boss fight character
let currentSprite = "";

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

function addValue(){
  // spawn before we hide/swap the button so particles originate from
  // the image the user actually clicked
  if (!clicked && Math.floor(Math.random() * 1000) == 500) {
    spawnShanks()
  }
  spawnParticles()
  roseValue += multiplier * rebirthMultiplier + Math.floor(((rpsRebirth + rpsPercent) * rpsPrevious)) * currencyMultiplier
  setTimeout(() =>{
      hornetBtn.style.transform="scale(1.16)"
      hornetBtnNew.style.transform="scale(1.16)"
    }, 0)
    
    setTimeout(() =>{
      hornetBtn.style.transform="scale(1.2)"
      hornetBtnNew.style.transform="scale(1.2)"
    }, 10)
    
    setTimeout(() =>{
      hornetBtn.style.transform="scale(1.24)"
      hornetBtnNew.style.transform="scale(1.24)"
    }, 20)
    
    setTimeout(() =>{
      hornetBtn.style.transform="scale(1.28)"
      hornetBtnNew.style.transform="scale(1.28)"
    }, 30)
    
    setTimeout(() =>{
      hornetBtn.style.transform="scale(1.32)"
      hornetBtnNew.style.transform="scale(1.32)"
    }, 40)
    
    setTimeout(() =>{
      hornetBtn.style.transform="scale(1.36)"
      hornetBtnNew.style.transform="scale(1.36)"
    }, 50)
    
    setTimeout(() =>{
      hornetBtn.style.transform="scale(1.36)"
      hornetBtnNew.style.transform="scale(1.36)"
    }, 60)
    
    setTimeout(() =>{
      hornetBtn.style.transform="scale(1.32)"
      hornetBtnNew.style.transform="scale(1.32)"
    }, 70)
    
    setTimeout(() =>{
      hornetBtn.style.transform="scale(1.28)"
      hornetBtnNew.style.transform="scale(1.28)"
    }, 80)
    
    setTimeout(() =>{
      hornetBtn.style.transform="scale(1.24)"
      hornetBtnNew.style.transform="scale(1.24)"
    }, 90)
    
    setTimeout(() =>{
      hornetBtn.style.transform="scale(0.95)"
      hornetBtnNew.style.transform="scale(0.95)"
    }, 100)
    
    setTimeout(() =>{
      hornetBtn.style.transform="scale(0.8)"
      hornetBtnNew.style.transform="scale(0.8)"
    }, 110)
    
    setTimeout(() =>{
      hornetBtn.style.transform="scale(0.7)"
      hornetBtnNew.style.transform="scale(0.7)"
    }, 120)
    
    setTimeout(() =>{
      hornetBtn.style.transform="scale(0.88)"
      hornetBtnNew.style.transform="scale(0.88)"
    }, 130)
    
    setTimeout(() =>{
      hornetBtn.style.transform="scale(1)"
      hornetBtnNew.style.transform="scale(1)"
    }, 140)
  if (hornetBtnNew != null){
    hornetBtnNew.style.display = "none"
  }
  //changes the button
  hornetBtn.style.display = "none"
  randomBtn = Math.floor(Math.random() * btnList.length)
  hornetBtnNew = btnList[randomBtn]
  hornetBtnNew.style.display = "block"
  //plays a funny audio if noise mode is enabled
  if (noiseMode){
    randomHorn = soundList[Math.floor(Math.random()*(soundList.length))]
    audioHorn = new Audio(src=randomHorn)
    audioHorn.play()
  }
}
//extension for particle effects from addValue
function spawnParticles() {
  const activeButton = hornetBtnNew || hornetBtn
  const btnRect = activeButton.getBoundingClientRect()
  const targetRect = hornetPara.getBoundingClientRect()

  const startX = btnRect.left + window.scrollX + btnRect.width / 2
  const startY = btnRect.top + window.scrollY + btnRect.height / 2
  const targetX = targetRect.left + window.scrollX + targetRect.width / 2
  const targetY = targetRect.top + window.scrollY + targetRect.height / 2 - 50

  let particleCount = 1*multiplier
  if (particleCount>=10){
    particleCount=10
  }

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('img')
    particle.className = 'particle'
    particle.src = 'https://www.silk-song.org/_next/image?url=%2Fimages%2Fitems%2Frosaries.png&w=640&q=75'

    // start at (or near) the hornet button center
    const jitterStartX = startX + (Math.random() - 0.5) * btnRect.width * 0.5
    const jitterStartY = startY + (Math.random() - 0.5) * btnRect.height * 0.5

    // small random end offset so particles don't stack exactly
    const jitterEndX = (Math.random() - 0.5) * 20
    const jitterEndY = (Math.random() - 0.5) * 12

    // styles for animation
    const duration = 700 + Math.floor(Math.random() * 300) // ms
    Object.assign(particle.style, {
      position: 'absolute',
      left: `${jitterStartX}px`,
      top: `${jitterStartY}px`,
      width: '28px',
      height: '28px',
      transform: `translate(0,0) scale(1)`,
      transition: `left ${duration}ms cubic-bezier(.2,.9,.2,1), top ${duration}ms cubic-bezier(.2,.9,.2,1), transform ${duration}ms linear, opacity ${duration}ms linear`,
      zIndex: 9999,
      pointerEvents: 'none',
      opacity: '1'
    })

    document.body.appendChild(particle)

    // force style flush so transition will run
    requestAnimationFrame(() => {
      // move to target (center of hornetPara) with a little jitter
      particle.style.left = `${targetX + jitterEndX}px`
      particle.style.top = `${targetY + jitterEndY}px`
      // shrink & fade as it arrives
      particle.style.transform = `translate(${targetX},${targetY}) scale(0.4)`
      particle.style.opacity = '0'
    })

    // remove after animation completes
    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle)
      }
    }, 1000)
  }
}
//function to add and manage the throwy tool
function throwy(){
  if (roseValue >= costs[0]){
    if(!actives[0]){
      actives[0] = setInterval(() =>{
        roseValue += (((counts[3]) * 3)+counts[0])*currencyMultiplier
        rps += (((counts[3]) * 3)+counts[0])*currencyMultiplier
      },1000)
    }


    counts[0] += 1
    roseValue -= costs[0]*priceMultiplier
    costs[0] = Math.trunc(costs[0] * 1.1)
    console.log(counts[0])
    lighttool.textContent =
      `Get a Light Throwing Tool that gets you 1 Rosarie per second! Cost: ${costs[0]*priceMultiplier} Rosaries`
  }
}
//function to add and manage the sharpened tool
function sharpened(){
  if (roseValue >= costs[1]){

    if(!actives[1]){
      actives[1] = setInterval(() =>{
        roseValue += (5*counts[1]) * sharpenMultiplier + ((counts[3] * 3)*counts[1])*currencyMultiplier
        rps += (5*counts[1])*sharpenMultiplier + ((counts[3] * 3)*counts[1])*currencyMultiplier
      },1000)
    }

    counts[1] += 1
    roseValue -= costs[1]*priceMultiplier
    costs[1] = Math.trunc(costs[1] * 1.1)
    sharpen.textContent =
      `Get your Nail to slash attack the button for ${5*sharpenMultiplier} Rosaries a second! Cost: ${costs[1] * priceMultiplier} Rosaries`
  }
}
//function to add and manage the threefold tool
function threefoldfunc(){
  if (roseValue >= costs[2]){

    if(!actives[2]){
      actives[2] = setInterval(() =>{
        roseValue += 5*counts[2] + (((counts[3] * 1)*counts[2]))*currencyMultiplier
        rps += 5*counts[2] + (((counts[3] * 1)*counts[2]))*currencyMultiplier
      },333)
    }

    counts[2] += 1
    roseValue -= costs[2]*priceMultiplier
    costs[2] = Math.trunc(costs[2] * 1.1)
    threefoldBtn.textContent = `Get your Threefold Pin and throw pins at the button for 15 Rosaries a second! Cost: ${costs[2]*priceMultiplier} Rosaries`
  }
}
//function to add and manage the pale oil tool
function paleOilFunc(){
  if (roseValue >= costs[3]){
    counts[3] += 1
    roseValue -= costs[3]
    costs[3] = Math.trunc(costs[3] * 1.65)
    costs[3] = paleOilCost
    paleOil.textContent = `Get your Pale Oil to *BUFF* every one of your tools by +3 Rosaries! Cost: ${costs[3]*priceMultiplier} Rosaries`
  }
}