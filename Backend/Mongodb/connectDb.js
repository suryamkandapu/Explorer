const mongoose = require('mongoose');

const connectDb= async ()=>{
    try {
        console.log(process.env.MongoDb_URI);
        await mongoose.connect(process.env.MongoDb_URI, {
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
    }
}

module.exports = connectDb;