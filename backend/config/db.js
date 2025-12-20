import mongoose from 'mongoose';
import dotenv from "dotenv"


dotenv.config();
const MONGO_URL = process.env.MONGO_URL

if (!MONGO_URL) {
console.log('MONGO_URL is not defined');
}
 export async function start() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Database connected');

  }catch(err){
console.log("error conntecting db",err)
  }
}