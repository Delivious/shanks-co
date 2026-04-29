const serviceID = "service_v8j5my3";
const templateID = "template_cnpv89z";

(function () {
    emailjs.init("gQn_927xM8kOjYNhX");
})();

// ================= EMAIL VALIDATION =================
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ================= CHECK IF USER IS VERIFIED (NEW) =================
async function isUserVerified(username) {
    try {
        const res = await fetch("https://shanksco.org/check-verified", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username })
        });

        const data = await res.json();
        return data.verified;
    } catch (err) {
        console.error("Verification check failed:", err);
        return false;
    }
}

console.log("contact.js loaded");

let formInitialized = false;

// ================= SETUP FORM =================
function setupContactForm() {
    if (formInitialized) return;
    formInitialized = true;

    const form = document.getElementById("contactForm");
    if (!form) {
        console.error("contactForm not found");
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const username = document.getElementById("username").value;

        const templateParams = {
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            message: document.getElementById("message").value,
            title: document.getElementById("subject").value
        };

        // ================= VALIDATION =================
        if (
            !username ||
            !templateParams.name ||
            !templateParams.email ||
            !templateParams.message ||
            !templateParams.title
        ) {
            alert("Please fill in all fields.");
            return;
        }

        if (!isValidEmail(templateParams.email)) {
            alert("Invalid email format.");
            return;
        }

        // ================= LOGIN CHECK =================
        if (localStorage.getItem("username") !== username) {
            alert("You must be logged in.");
            return;
        }

        // ================= NEW: VERIFY USER IS ACTUALLY VERIFIED =================
        const verified = await isUserVerified(username);

        if (!verified) {
            alert("You must verify your email before sending messages.");
            return;
        }

        try {
            // ================= BACKEND EMAIL CHECK =================
            const response = await fetch("https://shanksco.org/verify-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username,
                    email: templateParams.email
                })
            });

            const result = await response.json();

            if (!result.valid) {
                alert(result.message);
                return;
            }

            // ================= GET TOKEN =================
            const token = localStorage.getItem("verificationToken");

            if (!token) {
                alert("No verification token found. Please sign up again.");
                return;
            }

            // ================= BUILD LINK =================
            const verificationLink = `https://shanksco.org/verify?token=${token}`;

            // ================= EMAILJS SEND =================
            emailjs.send(serviceID, templateID, {
                name: templateParams.name,
                email: templateParams.email,
                message: templateParams.message,
                title: templateParams.title,
                verification_link: verificationLink
            })
            .then(() => {
                alert("Message sent successfully!");
                form.reset();
            })
            .catch((error) => {
                console.error("EmailJS error:", error);
                alert("Failed to send email.");
            });

        } catch (error) {
            console.error("Verification error:", error);
            alert("Server error while verifying email.");
        }
    });
}

// ================= INIT =================
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupContactForm);
} else {
    setupContactForm();
}

window.addEventListener("load", setupContactForm);