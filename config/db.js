const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

// mongoose.connect(db); // almost wrote it like this but was advised by a tutorial to write this as a promise, as seen below

// Writing this as an async function since this is the new way I learned to do these things

const connectDB = async () => {

    try {
        await mongoose.connect(db, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false
        })
        console.log('MongoDB connected')

    } catch (err) {
        console.error(err.message)
        // this is to exit process with failure
        process.exit(1)
    }
}

module.exports = connectDB;
