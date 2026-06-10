const gallery = document.getElementById("gallery");
const red = document.getElementById("red");
const black = document.getElementById("black");

// Suits
const suits =  ["spade", "heart", "club", "diamond"];

const cards  = ["spade1","heart1","club1","diamond1",
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
black.addEventListener('click', redorblack)
red.addEventListener('click', redorblack)
function redorblack(){
    const card = cards[Math.floor(Math.random() * cards.length)];
    const img = document.createElement("img");
    console.log(card)
    img.src = `cards/${card}.png`;
    img.alt = card;
    gallery.appendChild(img);
    indexremove = cards.indexOf(card)
    cards.splice(indexremove,1)
    console.log(cards)
    
}

