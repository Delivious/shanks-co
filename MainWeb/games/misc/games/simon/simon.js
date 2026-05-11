const yellowButton = document.querySelector("#yellowButton");
const greenButton = document.querySelector("#greenButton");
const blueButton = document.querySelector("#blueButton");
const redButton = document.querySelector("#redButton");
console.log("yellowButton image at load:", yellowButton);
console.log("greenButton image at load:", greenButton);
console.log("blueButton image at load:", blueButton);
console.log("redButton image at load:", redButton);
function setorder(){
    
}
function play(){
    yellowButton.addEventListener("mousedown", () => {
        console.log("Yellow button clicked");
        yellowButton.src = "simonassets/yellowclick.png";
        console.log("yellowButton image at change:", yellowButton);
    });
    greenButton.addEventListener("mousedown", () => {
        console.log("Green button clicked");
        greenButton.src = "simonassets/greenclick.png";
        console.log("greenButton image at change:", greenButton);
    });
    blueButton.addEventListener("mousedown", () => {
        console.log("Blue button clicked");
        blueButton.src = "simonassets/blueclick.png";
        console.log("blueButton image at change:", blueButton);
    });
    redButton.addEventListener("mousedown", () => {
        console.log("Red button clicked");
        redButton.src = "simonassets/redclick.png";
        console.log("redButton image at change:", redButton);
    });
    yellowButton.addEventListener("mouseup", () => {
        console.log("Yellow button clicked");
        yellowButton.src = "simonassets/yellow.png";
        console.log("yellowButton image at change:", yellowButton);
    });
    greenButton.addEventListener("mouseup", () => {
        console.log("Green button clicked");
        greenButton.src = "simonassets/green.png";
        console.log("greenButton image at change:", greenButton);
    });
    blueButton.addEventListener("mouseup", () => {
        console.log("Blue button clicked");
        blueButton.src = "simonassets/blue.png";
        console.log("blueButton image at change:", blueButton);
    });
    redButton.addEventListener("mouseup", () => {
        console.log("Red button clicked");
        redButton.src = "simonassets/red.png";
        console.log("redButton image at change:", redButton);
    });
}
play();