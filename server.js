// server.js
import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cors from 'cors';
import routes from './routes/index.js';

// Load environment variables
dotenv.config();
// Connect to the Database
connectDB();
const app = express();
// Middleware
app.use(express.json());
const corsOptions = {
  origin: [
    'http://localhost:3000', 
    'https://billingfrontend-sigma.vercel.app'
  ],
  
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, 
  optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));
// Routes
app.use('/api', routes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
