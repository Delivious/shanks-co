const yellowButton = document.querySelector("#yellowButton");
const greenButton = document.querySelector("#greenButton");
const blueButton = document.querySelector("#blueButton");
const redButton = document.querySelector("#redButton");
const yellowsound = new Audio('simonassets/yellowsound.mp3');
const greensound = new Audio('simonassets/greensound.mp3');
const bluesound = new Audio('simonassets/bluesound.mp3');
const redsound = new Audio('simonassets/redsound.mp3');
const orderlist = [];
let currentclick = 0;

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

    const order = getRandomInt(1, 5);

    orderlist.push(order);

    console.log("Current order:", orderlist);

    playSequence();
}

function playSequence() {

    for (let i = 0; i < orderlist.length; i++) {

        setTimeout(() => {

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

            setTimeout(resetButtons, 500);

        }, i * 1000);
    }
}

function handleClick(colorNumber) {

    if (orderlist[currentclick] === colorNumber) {

        currentclick++;

        console.log("Correct!");

        if (currentclick === orderlist.length) {

            console.log("Round complete!");

            currentclick = 0;

            setTimeout(setorder, 1000);
        }

    } else {

        console.log("Wrong button!");

        currentclick = 0;

        orderlist.length = 0;

        resetButtons();

        setTimeout(setorder, 1000);
    }
}


yellowButton.addEventListener("mousedown", () => {
    yellowsound.currentTime = 0;
    yellowsound.play();
    yellowButton.src = "simonassets/yellowclick.png";
});

greenButton.addEventListener("mousedown", () => {
    greensound.currentTime = 0;
    greensound.play();
    greenButton.src = "simonassets/greenclick.png";
});

blueButton.addEventListener("mousedown", () => {
    bluesound.currentTime = 0;
    bluesound.play();
    blueButton.src = "simonassets/blueclick.png";
});

redButton.addEventListener("mousedown", () => {
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