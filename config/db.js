const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: 'variables.env'})

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_MONGO,{
            useNewUrlParser: true, 
            useUnifiedTopology: true,
            useFindAndModify : false
        })
        console.log('Exito conexion');
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

module.exports = connectDB;