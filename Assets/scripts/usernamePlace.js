

window.onload = function() {
    if(localStorage.getItem("username")){
        const usernameElement = document.createElement("p");
        usernameElement.textContent = localStorage.getItem("username");
        document.body.appendChild(usernameElement);
        usernameElement.style.position = "fixed";
        usernameElement.style.top = "10px";
        usernameElement.style.right = "10px";
        usernameElement.style.zIndex = "1001";
        usernameElement.style.color = "white";
    }
}