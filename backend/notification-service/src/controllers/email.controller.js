const { 
    sendNotificationEmail,
    sendEventResult,
    sendEventReminder,
    sendEventAnnouncement,
    sendBulkEmails 
} = require('../utils/email.utils');

exports.sendEmailNotification = async (req, res, next) => {
    try {
        const { to, subject, message } = req.body;

        if (!to || !subject || !message) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

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

exports.sendEventResultNotification = async (req, res, next) => {
    try {
        const { eventName, eventDate, participants, results, message } = req.body;

        if (!eventName || !participants || !Array.isArray(participants)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: eventName, participants (array)' 
            });
        }

        const emailPromises = participants.map(async (participant) => {
            try {
                const info = await sendEventResult({
                    to: participant.email,
                    eventName,
                    eventDate,
                    participantName: participant.name,
                    results,
                    message
                });
                return { to: participant.email, success: true, messageId: info.messageId };
            } catch (err) {
                return { to: participant.email, success: false, error: err.message };
            }
        });

        const results2 = await Promise.all(emailPromises);
        
        const successful = results2.filter(r => r.success).length;
        const failed = results2.filter(r => !r.success).length;

        res.status(200).json({
            success: true,
            message: `Event results sent: ${successful} successful, ${failed} failed`,
            data: { total: participants.length, successful, failed }
        });
    } catch (error) {
        next(error);
    }
};

exports.sendEventReminder = async (req, res, next) => {
    try {
        const { eventName, eventDate, eventLocation, participants, daysUntil } = req.body;

        if (!eventName || !participants || !Array.isArray(participants)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: eventName, participants (array)' 
            });
        }

        const emailPromises = participants.map(async (participant) => {
            try {
                const info = await sendEventReminder({
                    to: participant.email,
                    eventName,
                    eventDate,
                    eventLocation,
                    participantName: participant.name,
                    daysUntil: daysUntil || 1
                });
                return { to: participant.email, success: true, messageId: info.messageId };
            } catch (err) {
                return { to: participant.email, success: false, error: err.message };
            }
        });

        const results = await Promise.all(emailPromises);
        
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        res.status(200).json({
            success: true,
            message: `Reminders sent: ${successful} successful, ${failed} failed`,
            data: { total: participants.length, successful, failed }
        });
    } catch (error) {
        next(error);
    }
};

exports.sendBulkEmails = async (req, res, next) => {
    try {
        const { emails } = req.body;

        if (!emails || !Array.isArray(emails)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required field: emails (array)' 
            });
        }

        const results = await sendBulkEmails(emails);
        
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        res.status(200).json({
            success: true,
            message: `Bulk emails sent: ${successful} successful, ${failed} failed`,
            data: { total: emails.length, successful, failed, details: results }
        });
    } catch (error) {
        next(error);
    }
};
