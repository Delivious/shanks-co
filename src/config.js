import dotenv from "dotenv";
import { MongoClient } from "mongodb";

// Build URI safely
const connectionString =
  process.env.MONGODB_URI ||
  `mongodb+srv://masoncosta31210_db_user:${encodeURIComponent(process.env.pass)}@shanksco.ckbmk3t.mongodb.net/shanks-co?retryWrites=true&w=majority`;

console.log("Connecting to MongoDB Atlas...");

MongoClient.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true })
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

export default collection;