const express = require('express');
const connectDB = require('./config/db');

// Calling connectDB to connect my database on MongoDB atlas

const app = express();
const cors = require('cors');

app.use(cors())

const PORT = process.env.PORT || 5000;

connectDB();

// Middleware - Do not need to use BodyParser because it is included with express now. Instead we are putting the code below:

app.use(express.json())

// MAIN SERVER ROUTE

app.get('/', (req, res) => res.send('API running'));

// CONTROLLERS - DEFINING ROUTES

const usersController = require('./routes/api/users')
app.use('/api/users', usersController); 

const profilesController = require('./routes/api/profile')
app.use('/api/profile', profilesController);

const authController = require('./routes/api/auth')
app.use('/api/auth', authController); 

const videosController = require('./routes/api/videos')
app.use('/api/videos', videosController); 



app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
