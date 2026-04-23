const serviceID = "service_v8j5my3";
const templateID = "template_cnpv89z";

(function() {
    emailjs.init("gQn_927xM8kOjYNhX");
})();

// Email validation function
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Initialize form listener
console.log("contacts.js script loaded");

let formInitialized = false;  // Flag to prevent multiple initializations

function setupContactForm() {
    // Only initialize once
    if (formInitialized) {
        console.log("Form already initialized, skipping");
        return;
    }
    formInitialized = true;
    
    console.log("setupContactForm() called");
    const form = document.getElementById('contactForm');
    console.log("contactForm element found:", !!form);
    
    if (!form) {
        console.error("ERROR: contactForm element not found!");
        return;
    }
    
    console.log("Adding submit event listener to form");
    form.addEventListener('submit', async function(event) {
        console.log("Form submit event fired!");
        event.preventDefault();     
        
        const templateParams = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            message: document.getElementById('message').value,
            title: document.getElementById('subject').value  
        };
        const username = document.getElementById('username').value;

        console.log("Form data collected:", { username });

        // Validate all fields are filled
        if (!username || !templateParams.name || !templateParams.email || !templateParams.message || !templateParams.title) {
            console.log("Validation failed: empty fields");
            alert('Please fill in all fields before submitting the form.');
            return;
        }

        // Validate email format
        if (!isValidEmail(templateParams.email)) {
            console.log("Email format validation failed");
            alert('Please provide a valid email address.');
            return;
        }
        try{
            if (localStorage.getItem("username") !== username) {
                console.log("No user logged in, cannot submit form");
                alert('Please use your account username to submit the form.');
                return;
            }
        } catch (error) {
            console.log("Error accessing localStorage:", error);
            alert('An error occurred while checking login status. Please try again.');
            return;
        }

        // Verify email matches account email
        try {
            console.log("Verifying email with server...");
            const response = await fetch('http://localhost:5000/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: username, email: templateParams.email })
            });

            const result = await response.json();
            console.log("Email verification result:", result);

            if (!result.valid) {
                alert(result.message);
                return;
            }

            // Email is verified, send the email
            console.log("Email verified, sending with EmailJS...");
            emailjs.send(serviceID, templateID, templateParams)
                .then(function(response) {
                    console.log('SUCCESS!', response.status, response.text);
                    alert('Your message has been sent successfully!');
                    document.getElementById('contactForm').reset();
                }, function(error) {
                    console.log('FAILED...', error);
                    alert('There was an error sending your message. Please try again later.');
                });
        } catch (error) {
            console.log('Verification error:', error);
            alert('There was an error verifying your email. Please try again later.');
        }
    });
}

// Use multiple event listeners for maximum compatibility
if (document.readyState === 'loading') {
    console.log("Page is still loading");
    document.addEventListener('DOMContentLoaded', setupContactForm);
} else {
    console.log("Page already loaded, setting up now");
    setupContactForm();
}

// Also use window.load
window.addEventListener('load', setupContactForm);