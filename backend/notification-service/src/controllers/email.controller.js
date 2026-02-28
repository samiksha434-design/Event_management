const { sendNotificationEmail } = require('../utils/email.utils');

exports.sendEmailNotification = async (req, res, next) => {
    try {
        const { to, subject, message } = req.body;

        if (!to || !subject || !message) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Call email util
        const info = await sendNotificationEmail({ to, subject, message });

        res.status(200).json({
            success: true,
            message: 'Email notification triggered successfully',
            data: info ? info.messageId : 'mock-id'
        });
    } catch (error) {
        next(error);
    }
};
