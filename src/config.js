
require('dotenv').config();

const mongoose = require('mongoose');

// Debug: Log the environment variable
console.log("Connecting to local MongoDB...");

const connectionString = "mongodb://localhost:27017/shanks-co"; // Local MongoDB connection string
console.log("Connection String:", connectionString);

const connect = mongoose.connect(connectionString);
// Check database connected or not
connect.then(() => {
    console.log("Database Connected Successfully");
})
.catch((error) => {
    console.log("Database cannot be Connected");
    console.error("Connection Error:", error.message);
    console.error("Error Code:", error.code);
})

// Create Schema
const Loginschema = new mongoose.Schema({
    name: {
        type:String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

// collection part
const collection = new mongoose.model("users", Loginschema);

module.exports = collection;