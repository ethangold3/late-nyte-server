const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const gameRoutes = require('./src/routes/gameRoutes');
const errorHandler = require('./src/middleware/errorHandler');
const connectDB = require('./src/config/database');
// Load environment variables
require('dotenv').config();

// Create Express app
const app = express();


// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


connectDB();

app.use('/api/game', gameRoutes);

// Routes (we'll add these later)
// app.use('/api/users', require('./src/routes/users'));
// app.use('/api/games', require('./src/routes/games'));
app.use('/api/health', require('./src/routes/health'));
app.use(errorHandler);


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;