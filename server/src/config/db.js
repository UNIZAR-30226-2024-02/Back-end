const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function connectDB() {
    try {
        await mongoose.connect(process.env.DB_MONGO);
        console.log('Successful connection');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

module.exports = connectDB;
