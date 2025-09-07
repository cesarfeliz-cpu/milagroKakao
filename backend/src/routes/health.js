import express from 'express';

export const healthRouter = express.Router();

healthRouter.get('/', (req, res) => {
  res.json({
    success: true,
    message: '✅ Kakao 40 Backend funcionando correctamente',
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});