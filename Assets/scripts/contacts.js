const serviceID = "service_v8j5my3";
const templateID = "template_cnpv89z";

emailjs.init("gQn_927xM8kOjYNhX");

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function isUserVerified(username) {
    const res = await fetch("https://shanksco.org/check-verified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
    });

    const data = await res.json();
    return data.verified;
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contactForm");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = document.getElementById("username").value;

        if (localStorage.getItem("username") !== username) {
            return alert("Not logged in");
        }

        if (!(await isUserVerified(username))) {
            return alert("Verify email first");
        }

        const email = document.getElementById("email").value;

        if (!isValidEmail(email)) {
            return alert("Invalid email");
        }

        emailjs.send(serviceID, templateID, {
            name: document.getElementById("name").value,
            email,
            message: document.getElementById("message").value,
            title: document.getElementById("subject").value
        }).then(() => {
            alert("Sent!");
        });
    });
});