// connects to mongoDB database using mongoose

import mongoose from "mongoose";
import "dotenv/config";

export const connectDB = async () => {
    try{
        mongoose.connection.on('connected', () => console.log('Database connected'))
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected successfully');
    } catch (error){
        console.error('MongoDB connection failed:', error);
        process.exit(1);
    }
}
