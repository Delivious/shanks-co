import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri);

let collection;

try {
  console.log("Connecting to MongoDB Atlas...");
  await client.connect();

  const db = client.db("shanks-co"); // change if needed
  collection = db.collection("users");

  console.log("Database Connected Successfully");
  console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY);
} catch (error) {
  console.error("Database Connection Failed:");
  console.error(error);
  process.exit(1);
}

export default collection;