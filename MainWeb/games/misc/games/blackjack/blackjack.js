const gallery = document.getElementById("gallery");

// Suits
const suits = ["spade", "heart", "club", "diamond"];

// Generate cards
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