const express = require('express');
const { sendEmailNotification } = require('../controllers/email.controller');
// We can use same protect from auth if available, but for internal microservice communication 
// it's better if we trust the API gateway or pass through the token.
// Assuming this is used internally inside standard endpoints.

const router = express.Router();

router.post('/send', sendEmailNotification);

module.exports = router;
