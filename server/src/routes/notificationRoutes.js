const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', notificationController.getMyNotifications);
router.put('/read-all', notificationController.markAllNotificationsRead);
router.patch('/read-all', notificationController.markAllNotificationsRead);
router.put('/:id/read', notificationController.markNotificationRead);
router.patch('/:id/read', notificationController.markNotificationRead);

module.exports = router;
