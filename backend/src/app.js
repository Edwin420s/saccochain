const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const saccoRoutes = require('./routes/sacco');
const scoreRoutes = require('./routes/score');
const suiRoutes = require('./routes/sui');
const newsletterRoutes = require('./routes/newsletter');
const verificationRoutes = require('./routes/verification');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sacco', saccoRoutes);
app.use('/api/score', scoreRoutes);
app.use('/api/sui', suiRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/verification', verificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = app;