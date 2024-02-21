const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: 'variables.env' });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_MONGO);
        console.log('Successful connection');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

module.exports = connectDB;
