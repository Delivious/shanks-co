
require('dotenv').config();

const mongoose = require('mongoose');

// Use MongoDB Atlas connection string from environment variable
// Format: mongodb+srv://username:password@cluster.mongodb.net/database
const connectionString = process.env.MONGODB_URI || "mongodb+srv://masoncosta31210_db_user:" + process.env.pass + "@shanksco.ckbmk3t.mongodb.net/shanks-co?retryWrites=true&w=majority";

console.log("Connecting to MongoDB...");
console.log("Connection String:", connectionString.replace(process.env.pass, "****"));

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