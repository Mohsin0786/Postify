require('dotenv').config();
const mongoose = require('mongoose');
const URI = process.env.MONGO_URI;

const mongoConnect = () => {
    return mongoose.connect(URI)
        .then(() => {
            console.log('Successfully connected to DB');
        })
        .catch((error) => {
            console.log('Unable to connect to MongoDB Atlas!');
            console.error(error);
            process.exit(1);
        });
};

module.exports = { mongoConnect };