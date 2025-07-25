import express from 'express';
import { publicRouter } from '../routes/public_router.js';

export const app = express();

app.use(express.urlencoded({ extended: false }));

app.use(express.json());
app.use('/api', publicRouter);