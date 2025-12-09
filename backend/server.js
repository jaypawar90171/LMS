const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const connectDB = require('./config/db.config');

// Import middleware
const { performanceMonitor } = require('./middleware/performance.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const userRoutes = require('./routes/user.routes');
const roleRoutes = require('./routes/role.routes');
const roleAssignmentRoutes = require('./routes/role-assignment.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const categoryRoutes = require('./routes/category.routes');
const operationsRoutes = require('./routes/operations.routes');
const fineRoutes = require('./routes/fine.routes');
const reminderRoutes = require('./routes/reminder.routes');
const { router: donationRoutes } = require('./routes/donation.routes');
const mobileRoutes = require('./routes/mobile.routes');
const reportRoutes = require('./routes/report.routes');
const settingRoutes = require('./routes/setting.routes');
const itemRequestRoutes = require('./routes/itemRequest.routes');
const debugRoutes = require('./routes/debug.routes');
const userPermissionRoutes = require('./routes/user-permission.routes');
const notificationRoutes = require('./routes/notification.routes');
const profileRoutes = require('./routes/profile.routes');
const serviceRoutes = require('./routes/service.routes');
const automatedFineRoutes = require('./routes/automated-fine.routes');
const barcodeRoutes = require('./routes/barcode.routes');
const itemCopyRoutes = require('./routes/itemCopy.routes');
const uploadRoutes = require('./routes/upload.routes');

// Initialize express app
const app = express();

// Create router for base path
let router;
if (config.basePath) {
  router = express.Router();
} else {
  router = app;
}

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8080', 
    'http://localhost:8081', 
    'http://localhost:3000',
    'http://localhost:8082',
    'http://192.168.0.229:8080',
    'http://192.168.0.229:8081',
    'http://192.168.0.229:3000',
    'http://192.168.0.229:8082',
    'http://68.178.165.24',
    'http://192.168.56.1:5000',
    'http://192.168.31.217:5000',
    'http://68.178.165.24/librarymanagement'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'cache-control', 'pragma', 'expires'],
  credentials: true
}));

// Request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 seconds
  res.setTimeout(30000);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (for images)
app.use('/uploads', express.static('uploads'));
app.use('/images', express.static('images'));

// Performance optimization
app.disable('x-powered-by');
app.use(performanceMonitor);

// Connect to MongoDB
connectDB();

// Initialize automated fine service
if (process.env.NODE_ENV !== 'test') {
  try {
    const AutomatedFineService = require('./services/automated-fine.service');
    AutomatedFineService.init();
  } catch (error) {
    console.warn('Automated fine service failed to initialize:', error.message);
  }
}

// Debug middleware to log all requests
app.use((req, res, next) => {
  if (req.url.includes('/fines/')) {
  }
  next();
});

// Routes
router.use('/api/auth', authRoutes);
router.use('/api/admin/auth', authRoutes);
router.use('/api', userRoutes);
router.use('/api/admin', dashboardRoutes);
router.use('/api/admin', userRoutes);
router.use('/api/admin', roleRoutes);
router.use('/api/admin', roleAssignmentRoutes);
router.use('/api/admin', categoryRoutes);
router.use('/api/admin', inventoryRoutes);
router.use('/api/admin', operationsRoutes);
router.use('/api/admin', fineRoutes);
router.use('/api/admin', reminderRoutes);
router.use('/api/admin', donationRoutes);
router.use('/api/admin', reportRoutes);
router.use('/api/admin', settingRoutes);
router.use('/api/admin', notificationRoutes);
router.use('/api/admin', profileRoutes);
router.use('/api/admin/services', serviceRoutes);
router.use('/api/admin/automated-fines', automatedFineRoutes);
router.use('/api/barcode', barcodeRoutes);
router.use('/api/item-copies', itemCopyRoutes);

// CSRF token endpoint (no CSRF protection needed for getting the token)
router.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Upload routes
router.use('/upload', uploadRoutes);

// Mobile app routes
router.use('/api/mobile', mobileRoutes);

// Item request routes (admin only)
router.use('/api/admin', itemRequestRoutes);

// Debug routes (auth required)
router.use('/api/debug', debugRoutes);

// User permission routes
router.use('/api/admin', userPermissionRoutes);

// Mount router with base path if configured
console.log('Base path config:', config.basePath);
if (config.basePath && config.basePath !== '') {
  console.log('Mounting router with base path:', config.basePath);
  app.use(config.basePath, router);
} else {
  console.log('No base path - routes mounted directly on app');
}

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Library Management System API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start server
const PORT = config.port;
const HOST = '0.0.0.0'; // Listen on all interfaces
try {
  const server = app.listen(PORT, HOST, () => {
    console.log(`Server is running on ${HOST}:${PORT} (${config.env} environment)`);
    console.log(`Mobile app can connect to: http://192.168.0.229:${PORT}/api`);
  });
  
  // Set server timeout
  server.timeout = 30000;
  server.keepAliveTimeout = 5000;
  server.headersTimeout = 6000;
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}