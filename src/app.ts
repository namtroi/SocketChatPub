import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db';
import chatRoutes from './routes/chatRoutes';

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Routes
app.use('/chat', chatRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('SocketChat API is running...');
});

// Connect to DB immediately for simplicity in this MVP
connectDB();

export default app;
