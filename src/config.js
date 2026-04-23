require("dotenv").config();
const mongoose = require("mongoose");

// Build URI safely
const connectionString =
  process.env.MONGODB_URI ||
  `mongodb+srv://${process.env.MONGO_USER}:${encodeURIComponent(process.env.MONGO_PASS)}@shanksco.ckbmk3t.mongodb.net/shanks-co?retryWrites=true&w=majority`;

console.log("Connecting to MongoDB Atlas...");

mongoose
  .connect(connectionString)
  .then(() => {
    console.log("Database Connected Successfully");
  })
  .catch((error) => {
    console.error("Database Connection Failed");
    console.error(error.message);
  });

// Schema
const Loginschema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true }
});

// Collection
const collection = mongoose.model("users", Loginschema);

module.exports = collection;