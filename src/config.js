import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const uri =
  process.env.MONGODB_URI ||
  `mongodb+srv://masoncosta31210_db_user:${encodeURIComponent(process.env.pass)}@shanksco.ckbmk3t.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri);

let collection;

async function connectDB() {
  try {
    console.log("Connecting to MongoDB Atlas...");

    await client.connect();

    const db = client.db("shanks-co");
    collection = db.collection("users");

    console.log("Database Connected Successfully");
  } catch (error) {
    console.error("Database Connection Failed:");
    console.error(error); // 🔥 shows FULL error (important)
    process.exit(1); // stop app cleanly
  }
}

await connectDB();

export default () => collection;