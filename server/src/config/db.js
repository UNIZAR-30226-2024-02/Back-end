const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function connectDB() {
    try {
	console.log(process.env.DB_MONGO);
        await mongoose.connect(process.env.DB_MONGO);
        console.log('Successful connection');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
async function disconnectDB() {
    try {
        await mongoose.disconnect();
        console.log('Disconnected from the database');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

module.exports = { connectDB, disconnectDB };
