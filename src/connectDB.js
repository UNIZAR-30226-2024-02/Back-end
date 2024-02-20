const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../src/.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_MONGO)
        console.log('Exito conexion');
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

module.exports = connectDB;
