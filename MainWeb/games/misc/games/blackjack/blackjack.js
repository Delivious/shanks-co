const gallery = document.getElementById("gallery");

// Suits
const suits = ["spade", "heart", "club", "diamond"];
const cards = ["spade1","heart1","club1","diamond1",
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
const imgs = ["cards/spade1.png", "cards/heart1.png", "cards/club1.png", "cards/diamond1.png","cards/spade2.png", "cards/heart2.png", "cards/club2.png", "cards/diamond2.png","cards/spade3.png", "cards/heart3.png", "cards/club3.png", "cards/diamond3.png","cards/spade4.png", "cards/heart4.png", "cards/club4.png", "cards/diamond4.png",
    "cards/spade5.png", "cards/heart5.png", "cards/club5.png", "cards/diamond5.png","cards/spade6.png", "cards/heart6.png", "cards/club6.png", "cards/diamond6.png","cards/spade7.png", "cards/heart7.png", "cards/club7.png", "cards/diamond7.png","cards/spade8.png", "cards/heart8.png", "cards/club8.png", "cards/diamond8.png",
    "cards/spade9.png", "cards/heart9.png", "cards/club9.png", "cards/diamond9.png","cards/spade10.png", "cards/heart10.png", "cards/club10.png", "cards/diamond10.png","cards/spade11.png", "cards/heart11.png", "cards/club11.png", "cards/diamond11.png","cards/spade12.png", "cards/heart12.png", "cards/club12.png", "cards/diamond12.png",
    "cards/spade13.png", "cards/heart13.png", "cards/club13.png", "cards/diamond13.png"
];
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

function bet(){
    
}
function dealCard() {
    const card = cards[Math.floor(Math.random() * cards.length)];
    const img = document.createElement("img");
    img.src = `cards/${card}.png`;
    img.alt = card;
    img.classList.remove(card)
    gallery.appendChild(img);
}

