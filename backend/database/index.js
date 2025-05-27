import mongooose from 'mongoose';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');
    
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

export default connectDB;