const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const { Server } = require('socket.io');

const { port, nodeEnv } = require('./config/config');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const rateLimiter = require('./middleware/rateLimiter');
const analyzeRouter = require('./routes/analyze');

const app = express();

/**
 * -------------------------
 * MIDDLEWARE
 * -------------------------
 */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(compression());
app.use(express.json());
app.use(requestLogger(nodeEnv));

app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

/**
 * -------------------------
 * HEALTH CHECK
 * -------------------------
 */
app.get('/health', async (req, res) => {
  return res.status(200).json({
    status: 'ok',
    uptime_seconds: Number(process.uptime().toFixed(2)),
    environment: nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

/**
 * -------------------------
 * API ROUTES
 * -------------------------
 */
app.use('/api/v1/analyze', rateLimiter, analyzeRouter);

/**
 * -------------------------
 * 404 HANDLER
 * -------------------------
 */
app.use((req, res, next) => {
  const notFoundError = new Error('Route not found');
  notFoundError.status = 404;
  notFoundError.code = 'NOT_FOUND';
  return next(notFoundError);
});

/**
 * -------------------------
 * ERROR HANDLER
 * -------------------------
 */
app.use(errorHandler);

/**
 * -------------------------
 * SOCKET.IO SETUP (FIX)
 * -------------------------
 */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});
io.on('connection', (socket) => {
  console.log(`🟢 Client connected: ${socket.id}`);

  /**
   * FRONTEND SENDS DATA HERE
   */
  socket.on('analyze', (data) => {
    try {
      // just echo back OR you can trigger backend logic here
      socket.emit('analysis-result', {
        success: true,
        data
      });
    } catch (err) {
      socket.emit('analysis-result', {
        success: false,
        error: err.message
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔴 Client disconnected: ${socket.id}`);
  });
});

/**
 * -------------------------
 * START SERVER (IMPORTANT FIX)
 * -------------------------
 */
server.listen(port, () => {
  console.log(
    `🚀 Fake-News-Shield backend running on port ${port} in ${nodeEnv} mode`
  );
});