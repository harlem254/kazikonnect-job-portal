const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // ADD THIS LINE TO DEBUG:
    console.log("Your URI is:", process.env.MONGO_URI); 

    // Paste the actual string right here:
    await mongoose.connect("mongodb+srv://zaka:zaka123456789@kazikonnect.sp3leyp.mongodb.net/?appName=Kazikonnect", {});
    
    console.log("MongoDB connected");
  } catch (err) {
    console.error("Error connecting to MongoDB", err);
    process.exit(1);
  }
};

module.exports = connectDB;