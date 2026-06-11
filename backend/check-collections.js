require('dotenv').config();
const mongoose = require('mongoose');

async function checkCollections() {
  try {
    if (!process.env.MONGO_URI) {
      console.error("Error: MONGO_URI is not defined in .env file.");
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB successfully!");
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("\n--- Collections in Database ---");
    if (collections.length === 0) {
      console.log("(No collections found in this database)");
    } else {
      collections.forEach(col => {
        console.log(`- ${col.name}`);
      });
    }
    console.log("---------------------------------\n");
    
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error connecting to MongoDB or listing collections:", error.message);
  }
}

checkCollections();
