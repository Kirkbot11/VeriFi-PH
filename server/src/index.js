const express = require('express');
const cors = require('cors');
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
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime_seconds: Number(process.uptime().toFixed(2)),
    environment: nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

/**
 * -------------------------
 * TEST ROUTE (FOR DEBUGGING)
 * -------------------------
 */
app.get('/test', (req, res) => {
  res.json({ ok: true });
});

/**
 * -------------------------
 * API ROUTES
 * -------------------------
 */
app.use('/api/v1', rateLimiter, analyzeRouter);

/**
 * -------------------------
 * 404 HANDLER (FIXED)
 * -------------------------
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    code: 'NOT_FOUND'
  });
});

/**
 * -------------------------
 * ERROR HANDLER
 * -------------------------
 */
app.use(errorHandler);

/**
 * -------------------------
 * SOCKET.IO SETUP
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

  socket.on('analyze', (data) => {
    socket.emit('analysis-result', {
      success: true,
      data
    });
  });

  socket.on('disconnect', () => {
    console.log(`🔴 Client disconnected: ${socket.id}`);
  });
});

/**
 * -------------------------
 * START SERVER
 * -------------------------
 */
const PORT = process.env.PORT || port || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});