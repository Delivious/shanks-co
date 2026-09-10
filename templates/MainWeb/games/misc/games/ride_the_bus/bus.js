const gallery = document.getElementById("gallery");
const red = document.getElementById("red");
const black = document.getElementById("black");

// alias existing buttons so code that uses `higher`, `lower`, `inside`, `out` works
const higher = red;
const lower = black;
const inside = red;
const out = black;

let lastRank = null;

function getRank(card){
    const m = card.match(/\d+$/);
    return m ? Number(m[0]) : null;
}
function createdeck(){
    cards  = ["spade1","heart1","club1","diamond1",
                "spade2","heart2","club2","diamond2",
                "spade3","heart3","club3","diamond3",
                "spade4","heart4","club4","diamond4",
                "spade5","heart5","club5","diamond5",
                "spade6","heart6","club6","diamond6",
                "spade7","heart7","club7","diamond7",
                "spade8","heart8","club8","diamond8",
                "spade9","heart9","club9","diamond9",
                "spade10","heart10","club10","diamond10",
                "spade11","heart11","club11","diamond11",
                "spade12","heart12","club12","diamond12",
                "spade13","heart13","club13","diamond13"
];
}
let cards  = ["spade1","heart1","club1","diamond1",
                "spade2","heart2","club2","diamond2",
                "spade3","heart3","club3","diamond3",
                "spade4","heart4","club4","diamond4",
                "spade5","heart5","club5","diamond5",
                "spade6","heart6","club6","diamond6",
                "spade7","heart7","club7","diamond7",
                "spade8","heart8","club8","diamond8",
                "spade9","heart9","club9","diamond9",
                "spade10","heart10","club10","diamond10",
                "spade11","heart11","club11","diamond11",
                "spade12","heart12","club12","diamond12",
                "spade13","heart13","club13","diamond13"]
// Generate cards
/*
suits.forEach(suit => {
    for (let i = 1; i <= 13; i++) {

    const img = document.createElement("img");

    // Example:
    // cards/spade1.png
    // cards/heart7.png
    img.src = `cards/${suit}${i}.png`;

    img.alt = `${suit}${i}`;

    gallery.appendChild(img);
    }
});
*/
function clearGallery(){
    // Simple and fast:
    setTimeout(() => {
                   gallery.innerHTML = '';
                }, 1300);
    // Or, if you prefer DOM removals:
    // while (gallery.firstChild) gallery.removeChild(gallery.firstChild);
}
black.onclick = redorblack;
red.onclick = redorblack;
function redorblack(){
    const sourceId = event.currentTarget.id;
    console.log(sourceId)
    const card = cards[Math.floor(Math.random() * cards.length)];
    const img = document.createElement("img");
    console.log(card)
    img.src = `cards/${card}.png`;
    img.alt = card;

    // show rank next to the image
    const rank = getRank(card);
    img.title = `rank: ${rank}`; // hover
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.appendChild(img);
    gallery.appendChild(wrapper);

    indexremove = cards.indexOf(card)
    cards.splice(indexremove,1)
    console.log(cards)
    console.log(gallery)

    if (sourceId === "red"){
        if (card.includes("heart") || card.includes("diamond")){
            console.log("correct");
            // save this card's rank for the next comparison
            lastRank = rank;
            red.innerHTML = "higher";
            red.id="higher"
            black.innerHTML = "lower";
            black.id="lower"
            red.onclick = highlow;
            black.onclick = highlow;
        }
        if (card.includes("spade") || card.includes("club")){
            console.log("Incorrect")
            lastRank = null;
            clearGallery()
            createdeck()
            red.onclick = redorblack;
            black.onclick = redorblack;
        }
    }

    if (sourceId === "black"){
        if (card.includes("spade") || card.includes("club")){
            console.log("correct");
            lastRank = rank;
            red.innerHTML = "higher";
            red.id="higher"
            black.innerHTML = "lower";
            black.id="lower"
            red.onclick = highlow;
            black.onclick = highlow;
        }
        if (card.includes("heart") || card.includes("diamond")){
            console.log("Incorrect")
            lastRank = null;
            clearGallery()
            createdeck()
            red.onclick = redorblack;
            black.onclick = redorblack;
        }
    }
}
function highlow(){
    console.log("highlow")
    const sourceId = event.currentTarget.id;
    console.log(sourceId)
    const card = cards[Math.floor(Math.random() * cards.length)];
    const img = document.createElement("img");
    console.log(card)
    img.src = `cards/${card}.png`;
    img.alt = card;

    const rank = getRank(card);
    img.title = `rank: ${rank}`;
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.appendChild(img);
    gallery.appendChild(wrapper);

    indexremove = cards.indexOf(card)
    cards.splice(indexremove,1)
    console.log(cards)
    console.log(gallery)
    console.log(lastRank)
    console.log(rank)
    // compare with lastRank
    if (sourceId === "higher"){
        if (lastRank !== null && rank > lastRank){
            console.log("correct");
            firstrank = lastRank;
            lastRank = rank;
            higher.innerHTML = "inside";
            higher.id = "inside";
            lower.innerHTML = "out";
            lower.id = "out";
            red.onclick = inorout; 
            black.onclick = inorout;
        } else {
            console.log("Incorrect")
            lastRank = null;
            higher.innerHTML = "red";
            higher.id = "red";
            lower.innerHTML = "black";
            lower.id="black";
            clearGallery()
            createdeck()
            red.onclick = redorblack;
            black.onclick = redorblack;
        }
    }

    if (sourceId === "lower"){
        if (lastRank !== null && rank < lastRank){
            console.log("correct");
            firstrank = lastRank;
            lastRank = rank;
            higher.innerHTML = "inside";
            higher.id = "inside";
            lower.innerHTML = "out";
            lower.id = "out";
            red.onclick = inorout;
            black.onclick = inorout;
        } else {
            console.log("Incorrect")
            lastRank = null;
            higher.innerHTML = "red";
            higher.id = "red";
            lower.innerHTML = "black";
            lower.id="black";
            clearGallery()
            createdeck()
            red.onclick = redorblack;
            black.onclick = redorblack;
        }
    }
}
function inorout(){
    console.log("inorout")
    const sourceId = event.currentTarget.id;
    console.log(sourceId)
    const card = cards[Math.floor(Math.random() * cards.length)];
    const img = document.createElement("img");
    console.log(card)
    img.src = `cards/${card}.png`;
    img.alt = card;

    const rank = getRank(card);
    img.title = `rank: ${rank}`;
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.appendChild(img);
    gallery.appendChild(wrapper);

    indexremove = cards.indexOf(card)
    cards.splice(indexremove,1)
    console.log(cards)
    console.log(gallery)
    if (sourceId === "inside"){
        if (firstrank<lastRank){
            console.log("inside in, first smaller than second")
            console.log(firstrank)
            console.log(lastRank)
            console.log(rank)
            if (lastRank !== null && rank < lastRank && rank > firstrank){
                console.log("correct");
                // use red/black via aliases instead of undefined variables
                inside.innerHTML = "spade";
                inside.id = "spade";
                out.innerHTML = "heart";
                out.id = "heart";
                red.onclick = suit;
                black.onclick = suit;
                createSuitButtons();
            } else {
                console.log("Incorrect")
                lastRank = null;
                inside.innerHTML = "red";
                inside.id = "red";
                out.innerHTML = "black";
                out.id="black";
                clearGallery()
                createdeck()
                red.onclick = redorblack;
                black.onclick = redorblack;
            }
        }
        if (firstrank>lastRank){
            console.log("inside in, first greater than second")
            console.log(firstrank)
            console.log(lastRank)
            console.log(rank)
            if (lastRank !== null && rank > lastRank && rank < firstrank){
                console.log("correct");
                inside.innerHTML = "spade";
                inside.id = "spade";
                out.innerHTML = "heart";
                out.id = "heart";
                red.onclick = suit;
                black.onclick = suit;
                createSuitButtons();
            } else {
                console.log("Incorrect")
                lastRank = null;
                inside.innerHTML = "red";
                inside.id = "red";
                out.innerHTML = "black";
                out.id="black";
                clearGallery()
                createdeck()
                red.onclick = redorblack;
                black.onclick = redorblack;
            }
        }
    }
    if (sourceId === "out"){
          if (firstrank<lastRank){
            console.log("inside out, first smaller than second")
            console.log(firstrank)
            console.log(lastRank)
            console.log(rank)
            if (lastRank !== null && rank > lastRank || rank < firstrank){
                console.log("correct");
                inside.innerHTML = "spade";
                inside.id = "spade";
                out.innerHTML = "heart";
                out.id = "heart";
                // replace local un-appended button creation with helper
                red.onclick = suit;
                black.onclick = suit;
                createSuitButtons();
            } 
            else {
                console.log("Incorrect")
                lastRank = null;
                inside.innerHTML = "red";
                inside.id = "red";
                out.innerHTML = "black";
                out.id="black";
                clearGallery()
                createdeck()
                red.onclick = redorblack;
                black.onclick = redorblack;
            }
        }
        if (firstrank>lastRank){
            console.log("inside out, first greater than second")
            console.log(firstrank)
            console.log(lastRank)
            console.log(rank)
            if (lastRank !== null && rank < lastRank || rank > firstrank){
                console.log("correct");
                inside.innerHTML = "spade";
                inside.id = "spade";
                out.innerHTML = "heart";
                out.id = "heart";
                red.onclick = suit;
                black.onclick = suit;
                createSuitButtons();
            } else {
                console.log("Incorrect")
                lastRank = null;
                inside.innerHTML = "red";
                inside.id = "red";
                out.innerHTML = "black";
                out.id="black";
                clearGallery()
                createdeck()
                red.onclick = redorblack;
                black.onclick = redorblack;
            }
        }
    }
}

// persistent references for dynamically-created suit buttons
let clubButton = null;
let diamondButton = null;

function getControlsContainer(){
    let controls = document.getElementById('controls');
    if (!controls){
        // create a controls container if your HTML doesn't have one
        controls = document.createElement('div');
        controls.id = 'controls';
        document.body.appendChild(controls);
    }
    return controls;
}

function removeSuitButtons(){
    const controls = getControlsContainer();
    if (clubButton && clubButton.parentElement === controls) controls.removeChild(clubButton);
    if (diamondButton && diamondButton.parentElement === controls) controls.removeChild(diamondButton);
    clubButton = null;
    diamondButton = null;
}

function createSuitButtons(){
    removeSuitButtons();
    const controls = getControlsContainer();

    clubButton = document.createElement('button');
    diamondButton = document.createElement('button');

    clubButton.id = 'club';
    diamondButton.id = 'diamond';
    clubButton.textContent = 'Club';
    diamondButton.textContent = 'Diamond';

    // assign handler so suit() sees event.currentTarget.id
    clubButton.onclick = suit;
    diamondButton.onclick = suit;

    controls.appendChild(clubButton);
    controls.appendChild(diamondButton);

    console.log('createSuitButtons: appended club and diamond buttons');
}