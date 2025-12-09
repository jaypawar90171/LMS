const express = require('express');
const router = express.Router();
const path = require('path');
const { protect } = require('../middleware/auth.middleware');

let multer;
try {
  multer = require('multer');
} catch (err) {
  console.warn('Multer not installed, file upload functionality will be disabled');
}

// Configure multer for file uploads (if available)
let upload;
if (multer) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  upload = multer({
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      // Check file type
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'), false);
      }
    }
  });
}

// Upload image endpoint
router.post('/image', protect, (req, res) => {
  if (!multer) {
    return res.status(501).json({
      success: false,
      message: 'File upload functionality is not available. Please install multer package.'
    });
  }
  
  // Use multer middleware
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    handleImageUpload(req, res);
  });
});

// Handle image upload logic
function handleImageUpload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image'
    });
  }
}

module.exports = router;