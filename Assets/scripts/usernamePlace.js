

window.onload = function() {
    if (localStorage.getItem("username")) {
        const usernameElement = document.createElement("p");
        usernameElement.textContent = localStorage.getItem("username");
        document.body.appendChild(usernameElement);
        usernameElement.className = "username"
    }
}