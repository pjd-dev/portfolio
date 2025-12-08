import express from 'express';
import cors from 'cors';
import { validateConfig, PORT, CORS_ORIGIN, NODE_ENV } from './config/supabase.js';
import authRoutes from './routes/auth.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

// Validate configuration
try {
  validateConfig();
  console.log('✓ Configuration validated');
} catch (error) {
  console.error('Configuration error:', error);
  process.exit(1);
}

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'vault-auth',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// Routes
app.use('/auth', authRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🔐 Vault Auth Service running on port ${PORT}`);
  console.log(`   Environment: ${NODE_ENV}`);
  console.log(`   CORS Origin: ${CORS_ORIGIN}`);
  console.log(`\n📋 Available routes:`);
  console.log(`   POST   /auth/signup`);
  console.log(`   POST   /auth/signin`);
  console.log(`   POST   /auth/signout`);
  console.log(`   POST   /auth/refresh`);
  console.log(`   POST   /auth/password-reset`);
  console.log(`   GET    /auth/oauth/:provider`);
  console.log(`   GET    /auth/oauth/callback`);
  console.log(`   GET    /auth/me`);
  console.log(`   PATCH  /auth/me`);
  console.log(`   DELETE /auth/me`);
  console.log(`   GET    /health`);
});
