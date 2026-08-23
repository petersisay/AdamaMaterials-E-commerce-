const express = require('express');
const multer = require('multer');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed.'), false);
    }
  },
});

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);
router.post('/forgotpassword', authController.forgotPassword);
router.post('/resetpassword', authController.resetPassword);

// Protected routes
router.use(protect);

router.get('/me', authController.getMe);
router.put('/me/update', authController.updateMe);
router.put('/updatedetails', authController.updateDetails);
router.put('/updatepassword', authController.updatePassword);
router.post('/avatar', upload.single('avatar'), authController.uploadAvatar);
router.post('/onboarding', authController.completeOnboarding);
router.put('/seller/location', authController.updateSellerLocation);

// Address management
router.get('/me/addresses', authController.getMyAddresses);
router.post('/me/addresses', authController.addAddress);
router.put('/me/addresses/:addressId', authController.updateAddress);
router.delete('/me/addresses/:addressId', authController.deleteAddress);

module.exports = router;

