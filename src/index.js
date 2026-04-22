const express = require("express");
const path = require("path");
const collection = require("./config");
const bcrypt = require('bcrypt');

const app = express();
// convert data into json format
app.use(express.json());
// Static file - serve from parent directory
app.use(express.static(path.join(__dirname, "..")));

app.use(express.urlencoded({ extended: false }));
//use EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

app.get("/", (req, res) => {
    res.redirect("/MainWeb/LoginPages/logIn.html");
});

app.get("/signup", (req, res) => {
    res.redirect("/MainWeb/LoginPages/signUp.html");
});

// Email validation function
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Register User
app.post("/signup", async (req, res) => {

    const data = {
        name: req.body.username,
        password: req.body.password,
        email: req.body.email
    }

    // Validate email format
    if (!isValidEmail(data.email)) {
        return res.send('Please provide a valid email address.');
    }

    // Check if the username already exists in the database
    const existingUser = await collection.findOne({ name: data.name });

    if (existingUser) {
        res.send('User already exists. Please choose a different username.');
    } else {
        // Hash the password using bcrypt
        const saltRounds = 10; // Number of salt rounds for bcrypt
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);

        data.password = hashedPassword; // Replace the original password with the hashed one

        const userdata = await collection.insertOne(data);
        console.log("User added to database:", userdata);
        res.send('User registered successfully. Please log in.');
    }

});

// Login user 
app.post("/login", async (req, res) => {
    try {
        // Validate email format
        if (!isValidEmail(req.body.email)) {
            return res.send('Please provide a valid email address.');
        }

        const check = await collection.findOne({ name: req.body.username });
        if (!check) {
            return res.send("User name cannot found")
        }
        // Compare the hashed password from the database with the plaintext password
        const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
        if (!isPasswordMatch) {
            return res.send("wrong Password");
        }
        // Compare email directly (emails are not hashed)
        const isEmailMatch = req.body.email === check.email;
        if (!isEmailMatch) {
            return res.send("wrong Email");
        }
        res.redirect("/index.html");
        console.log("User logged in successfully:", check);
        localStorage.setItem("username", req.body.username);
    }
    catch {
        res.send("wrong Details");
    }
});

// Verify email matches account for contact form
app.post("/verify-email", async (req, res) => {
    try {
        const { username, email } = req.body;

        // Validate email format
        if (!isValidEmail(email)) {
            return res.json({ valid: false, message: 'Invalid email format.' });
        }

        // Find user in database
        const user = await collection.findOne({ name: username });
        if (!user) {
            return res.json({ valid: false, message: 'User not found.' });
        }

        // Check if email matches
        if (user.email === email) {
            return res.json({ valid: true, message: 'Email verified.' });
        } else {
            return res.json({ valid: false, message: 'Email does not match account email.' });
        }
    }
    catch (error) {
        res.json({ valid: false, message: 'An error occurred during verification.' });
    }
});

// Debug endpoint: View all users (remove this in production!)
app.get("/debug/users", async (req, res) => {
    try {
        const users = await collection.find({});
        res.json(users);
    } catch (error) {
        res.json({ error: error.message });
    }
});

// Define Port for Application
const port = 5000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});