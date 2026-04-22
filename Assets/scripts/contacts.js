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

window.onload = function(){
    document.getElementById('contactForm').addEventListener('submit', async function(event) {
        event.preventDefault();     
        const templateParams = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            message: document.getElementById('message').value,
            title: document.getElementById('subject').value  
        };
        const username = document.getElementById('username').value;

        // Validate all fields are filled
        if (!username || !templateParams.name || !templateParams.email || !templateParams.message || !templateParams.title) {
            alert('Please fill in all fields before submitting the form.');
            return;
        }

        // Validate email format
        if (!isValidEmail(templateParams.email)) {
            alert('Please provide a valid email address.');
            return;
        }

        // Verify email matches account email
        try {
            const response = await fetch('http://localhost:5000/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: username, email: templateParams.email })
            });

            const result = await response.json();

            if (!result.valid) {
                alert(result.message);
                return;
            }

            // Email is verified, send the email
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