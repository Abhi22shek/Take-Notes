import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import noteRoutes from './routes/noteroutes'
import validateEnv from './config/validateEnv';

import { connectDb } from './config/db';

const app = express();
dotenv.config();
validateEnv();
app.use(cors());
connectDb();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/api/auth" , authRoutes);
app.use("/api/notes",noteRoutes)

import errorHandler from './middleware/errorMiddleware';
app.use(errorHandler);


app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});