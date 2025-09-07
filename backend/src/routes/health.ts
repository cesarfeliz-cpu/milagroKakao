import express from 'express';

export const healthRouter = express.Router();

healthRouter.get('/', (req, res) => {
  res.json({
    message: '✅ Backend is running successfully!',
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: '1.0.0'
  });
});