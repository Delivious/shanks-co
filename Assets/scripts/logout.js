// Logout functionality
console.log("logout.js loaded");

function setupLogoutButton() {
    const username = localStorage.getItem('username');
    
    if (username) {
        console.log("User logged in as:", username);
        
        // Create logout button
        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = `Logout`;
        logoutBtn.style.position = 'fixed';
        logoutBtn.style.bottom = '10px';
        logoutBtn.style.left = '10px';
        logoutBtn.style.zIndex = '1002';
        logoutBtn.style.padding = '10px 15px';
        logoutBtn.style.backgroundColor = '#ff4444';
        logoutBtn.style.color = 'white';
        logoutBtn.style.border = 'none';
        logoutBtn.style.borderRadius = '5px';
        logoutBtn.style.cursor = 'pointer';
        logoutBtn.style.fontSize = '14px';
        
        // Add hover effect
        logoutBtn.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#cc0000';
        });
        logoutBtn.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#ff4444';
        });
        
        // Add logout click handler
        logoutBtn.addEventListener('click', function() {
            console.log("Logout button clicked");
            localStorage.removeItem('username');
            alert('You have been logged out.');
            window.location.href = '/MainWeb/LoginPages/logIn.html';
        });
        
        document.body.appendChild(logoutBtn);
        console.log("Logout button created and added to page");
    } else {
        console.log("No user logged in");
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupLogoutButton);
} else {
    setupLogoutButton();
}

window.addEventListener('load', setupLogoutButton);
