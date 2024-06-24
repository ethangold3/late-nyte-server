const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Successfully connected to MongoDB');
  // Close the connection after successful test
  return mongoose.connection.close();
})
.then(() => {
  console.log('Connection closed');
  process.exit(0);
})
.catch(err => {
  console.error('Could not connect to MongoDB:', err);
  process.exit(1);
});