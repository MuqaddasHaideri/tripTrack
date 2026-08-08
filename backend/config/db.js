import mongoose from 'mongoose';
import dotenv from "dotenv"

// Load env variables
dotenv.config();

// Get db URL from env
const MONGO_URL = process.env.MONGO_URL

// Check if db URL exists
if (!MONGO_URL) {
console.log('MONGO_URL is not defined');
}
// Start db connection
 export async function start() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Database connected');

  }catch(err){
console.log("error conntecting db",err)
  }
}