const express = require('express');
const router = express.Router();
const { 
    sendEmailNotification, 
    sendEventResultNotification,
    sendEventReminder,
    sendBulkEmails
} = require('../controllers/email.controller');

// Basic email sending
router.post('/send', sendEmailNotification);

// Send event result to all participants
router.post('/sendEventResult', sendEventResultNotification);

// Send reminder to all participants
router.post('/sendEventReminder', sendEventReminder);

// Send bulk emails to multiple recipients
router.post('/sendBulk', sendBulkEmails);

module.exports = router;
