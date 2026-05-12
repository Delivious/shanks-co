const yellowButton = document.querySelector("#yellowButton");
const greenButton = document.querySelector("#greenButton");
const blueButton = document.querySelector("#blueButton");
const redButton = document.querySelector("#redButton");

const yellowsound = new Audio('simonassets/yellowsound.mp3');
const greensound = new Audio('simonassets/greensound.mp3');
const bluesound = new Audio('simonassets/bluesound.mp3');
const redsound = new Audio('simonassets/redsound.mp3');
const incorrect = new Audio('simonassets/incorrect.mp3');

const orderlist = [1,1,1,1,1];

let currentclick = 0;
let timetowait = 500;

let sequenceTimeouts = [];
let acceptingInput = false;
let restartTimeout = null;

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function resetButtons() {
    yellowButton.src = "simonassets/yellow.png";
    greenButton.src = "simonassets/green.png";
    blueButton.src = "simonassets/blue.png";
    redButton.src = "simonassets/red.png";
}

function setorder() {

    if (orderlist.length > 0 && orderlist.length % 5 === 0) {
        timetowait = Math.max(100, timetowait - 100);
    }

    const order = getRandomInt(1, 5);

    orderlist.push(order);

    console.log("Current order:", orderlist);

    playSequence();
}

function playSequence() {

    acceptingInput = false;

    // Clear old timeouts
    sequenceTimeouts.forEach(timeout => clearTimeout(timeout));
    sequenceTimeouts = [];

    // Every 5 rounds, cut timing in half
    let speedLevel = Math.floor(orderlist.length / 5);

    // Base timing
    let flashTime = timetowait / Math.pow(1.5, speedLevel);
    let delayBetween = 1000 / Math.pow(1.5, speedLevel);

    for (let i = 0; i < orderlist.length; i++) {

        const timeout = setTimeout(() => {

            resetButtons();

            if (orderlist[i] === 1) {
                yellowsound.currentTime = 0;
                yellowsound.play();
                yellowButton.src = "simonassets/yellowlight.png";
            }

            if (orderlist[i] === 2) {
                greensound.currentTime = 0;
                greensound.play();
                greenButton.src = "simonassets/greenlight.png";
            }

            if (orderlist[i] === 3) {
                bluesound.currentTime = 0;
                bluesound.play();
                blueButton.src = "simonassets/bluelight.png";
            }

            if (orderlist[i] === 4) {
                redsound.currentTime = 0;
                redsound.play();
                redButton.src = "simonassets/redlight.png";
            }

            setTimeout(resetButtons, flashTime);

            // Allow player input after sequence ends
            if (i === orderlist.length - 1) {
                setTimeout(() => {
                    acceptingInput = true;
                }, flashTime);
            }

        }, i * delayBetween);

        sequenceTimeouts.push(timeout);
    }
}
function handleClick(colorNumber) {

    if (!acceptingInput) return;

    if (orderlist[currentclick] === colorNumber) {

        currentclick++;

        console.log("Correct!");

        if (currentclick === orderlist.length) {

            console.log("Round complete!");

            currentclick = 0;
            acceptingInput = false;

            setTimeout(setorder, 1000);
        }

    } else {

        console.log("Wrong button!");

        currentclick = 0;
        orderlist.length = 0;
        acceptingInput = false;

        // Stop any pending restart
        clearTimeout(restartTimeout);

        // Stop any active sequence playback
        sequenceTimeouts.forEach(timeout => clearTimeout(timeout));
        sequenceTimeouts = [];

        incorrect.currentTime = 0;
        incorrect.play();

        resetButtons();

        // Reset speed
        timetowait = 500;

        restartTimeout = setTimeout(() => {
            setorder();
        }, 2000);
    }
}

yellowButton.addEventListener("mousedown", () => {

    if (!acceptingInput) return;

    yellowsound.currentTime = 0;
    yellowsound.play();
    yellowButton.src = "simonassets/yellowclick.png";
});

greenButton.addEventListener("mousedown", () => {

    if (!acceptingInput) return;

    greensound.currentTime = 0;
    greensound.play();
    greenButton.src = "simonassets/greenclick.png";
});

blueButton.addEventListener("mousedown", () => {

    if (!acceptingInput) return;

    bluesound.currentTime = 0;
    bluesound.play();
    blueButton.src = "simonassets/blueclick.png";
});

redButton.addEventListener("mousedown", () => {

    if (!acceptingInput) return;

    redsound.currentTime = 0;
    redsound.play();
    redButton.src = "simonassets/redclick.png";
});

yellowButton.addEventListener("mouseup", () => {
    yellowButton.src = "simonassets/yellow.png";
    handleClick(1);
});

greenButton.addEventListener("mouseup", () => {
    greenButton.src = "simonassets/green.png";
    handleClick(2);
});

blueButton.addEventListener("mouseup", () => {
    blueButton.src = "simonassets/blue.png";
    handleClick(3);
});

redButton.addEventListener("mouseup", () => {
    redButton.src = "simonassets/red.png";
    handleClick(4);
});

setorder();