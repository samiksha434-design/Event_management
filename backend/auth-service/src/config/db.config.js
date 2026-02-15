const mongoose = require('mongoose');

// Use recommended strictQuery setting to avoid warnings
mongoose.set('strictQuery', false);

/**
 * Connect to MongoDB database with retry logic
 * @param {number} retries number of retry attempts
 * @param {number} delay ms delay between retries
 * @returns {Promise} Mongoose connection promise
 */
const connectDB = async (retries = 5, delay = 2000) => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/univent';
  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB (${uri}): ${error.message}`);
    if (retries > 0) {
      console.log(`Retrying to connect in ${delay / 1000}s... (${retries} retries left)`);
      await new Promise((res) => setTimeout(res, delay));
      return connectDB(retries - 1, Math.min(delay * 2, 30000));
    }
    process.exit(1);
  }
};

module.exports = connectDB;