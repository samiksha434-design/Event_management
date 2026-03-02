const nodemailer = require('nodemailer');

// Cache the test account and transporter
let testAccount = null;
let testTransporter = null;

const createTransporter = async () => {
    try {
        // Use production settings if configured
        if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            return nodemailer.createTransport({
                service: process.env.EMAIL_SERVICE,
                secure: process.env.EMAIL_SECURE === 'true',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
        }
        
        // For development/testing - create fresh test account
        if (!testAccount) {
            testAccount = await nodemailer.createTestAccount();
            console.log('Created new Ethereal test account:', testAccount.user);
        }
        
        if (!testTransporter) {
            testTransporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            console.log('Ethereal test transporter created with fresh credentials.');
        }
        
        return testTransporter;
    } catch (error) {
        console.error('Failed to create email transporter:', error);
        // Return a fallback transporter that logs to console
        return {
            sendMail: (options) => {
                console.log('\n========== EMAIL NOTIFICATION ==========');
                console.log(`To: ${options.to}`);
                console.log(`Subject: ${options.subject}`);
                console.log(`Message: ${options.text || options.message}`);
                console.log('==========================================\n');
                return Promise.resolve({ messageId: 'console-logged-' + Date.now() });
            }
        };
    }
};

// Base email sender function
const sendEmail = async (options) => {
    try {
        const transporter = await createTransporter();

        const mailOptions = {
            from: options.from || '"Collexa Events" <events@collexa.com>',
            to: options.to,
            subject: options.subject,
            text: options.text || options.message,
            html: options.html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent:', info.messageId);

        const previewURL = nodemailer.getTestMessageUrl(info);
        if (previewURL) {
            console.log('Preview URL:', previewURL);
        }

        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

// Original notification email (backward compatible)
exports.sendNotificationEmail = async (options) => {
    const html = `
        <div style="background-color: #f4f4f7; padding: 40px 0; font-family: 'Segoe UI', sans-serif;">
          <table style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; padding: 20px;">
            <tr>
              <td>
                <h2 style="color: #3b82f6;">${options.subject}</h2>
                <p style="font-size: 16px; color: #333; line-height: 1.6;">${options.message}</p>
                <br />
                <p style="font-size: 13px; color: #777;">Thank you for using Collexa.</p>
              </td>
            </tr>
          </table>
        </div>
    `;
    
    return sendEmail({ ...options, html });
};

// Send event registration confirmation email
exports.sendRegistrationConfirmation = async (options) => {
    const { to, eventName, eventDate, eventLocation, participantName } = options;
    
    const html = `
        <div style="background-color: #f4f4f7; padding: 40px 0; font-family: 'Segoe UI', sans-serif;">
          <table style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; padding: 20px;">
            <tr>
              <td>
                <div style="text-align: center; margin-bottom: 20px;">
                    <span style="background-color: #10b981; color: white; padding: 10px 20px; border-radius: 20px; font-size: 14px;">Registration Confirmed</span>
                </div>
                <h2 style="color: #3b82f6; text-align: center;">You're Registered!</h2>
                <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello ${participantName},</p>
                <p style="font-size: 16px; color: #333; line-height: 1.6;">Your registration for <strong>${eventName}</strong> has been confirmed!</p>
                <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #1e293b; margin-bottom: 15px;">Event Details</h3>
                    <p style="color: #475569; margin: 8px 0;"><strong>Date:</strong> ${new Date(eventDate).toLocaleDateString()}</p>
                    <p style="color: #475569; margin: 8px 0;"><strong>Location:</strong> ${eventLocation || 'TBA'}</p>
                </div>
                <p style="font-size: 13px; color: #777;">Thank you for using Collexa.</p>
              </td>
            </tr>
          </table>
        </div>
    `;

    return sendEmail({
        to,
        subject: `Registration Confirmed: ${eventName}`,
        message: `Hello ${participantName},\n\nYou have successfully registered for "${eventName}".\n\nDate: ${new Date(eventDate).toLocaleDateString()}\nLocation: ${eventLocation || 'TBA'}`,
        html
    });
};

// Send event reminder email
exports.sendEventReminder = async (options) => {
    const { to, eventName, eventDate, eventLocation, participantName, daysUntil } = options;
    
    const html = `
        <div style="background-color: #f4f4f7; padding: 40px 0; font-family: 'Segoe UI', sans-serif;">
          <table style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; padding: 20px;">
            <tr>
              <td>
                <div style="text-align: center; margin-bottom: 20px;">
                    <span style="background-color: #f59e0b; color: white; padding: 10px 20px; border-radius: 20px; font-size: 14px;">Reminder</span>
                </div>
                <h2 style="color: #3b82f6; text-align: center;">Event Coming Up!</h2>
                <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello ${participantName},</p>
                <p style="font-size: 16px; color: #333; line-height: 1.6;">This is a friendly reminder that <strong>${eventName}</strong> is in <strong>${daysUntil} day(s)</strong>!</p>
                <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #1e293b; margin-bottom: 15px;">Event Details</h3>
                    <p style="color: #475569; margin: 8px 0;"><strong>Date:</strong> ${new Date(eventDate).toLocaleDateString()}</p>
                    <p style="color: #475569; margin: 8px 0;"><strong>Location:</strong> ${eventLocation || 'TBA'}</p>
                </div>
                <p style="font-size: 13px; color: #777;">Thank you for using Collexa.</p>
              </td>
            </tr>
          </table>
        </div>
    `;

    return sendEmail({
        to,
        subject: `Reminder: ${eventName} is in ${daysUntil} day(s)!`,
        message: `Hello ${participantName},\n\nReminder: "${eventName}" is in ${daysUntil} day(s)!\n\nDate: ${new Date(eventDate).toLocaleDateString()}\nLocation: ${eventLocation || 'TBA'}`,
        html
    });
};

// Send event result notification
exports.sendEventResult = async (options) => {
    const { to, eventName, eventDate, participantName, results, message } = options;
    
    const resultsHtml = results ? `<div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #1e293b; margin-bottom: 15px;">Results</h3>
        <p style="color: #475569;">${results}</p>
    </div>` : '';

    const html = `
        <div style="background-color: #f4f4f7; padding: 40px 0; font-family: 'Segoe UI', sans-serif;">
          <table style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; padding: 20px;">
            <tr>
              <td>
                <div style="text-align: center; margin-bottom: 20px;">
                    <span style="background-color: #8b5cf6; color: white; padding: 10px 20px; border-radius: 20px; font-size: 14px;">Results Announced</span>
                </div>
                <h2 style="color: #3b82f6; text-align: center;">Event Results</h2>
                <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello ${participantName},</p>
                <p style="font-size: 16px; color: #333; line-height: 1.6;">The results for <strong>${eventName}</strong> have been announced!</p>
                ${resultsHtml}
                ${message ? `<p style="font-size: 14px; color: #64748b;">${message}</p>` : ''}
                <p style="font-size: 13px; color: #777;">Thank you for participating in Collexa events!</p>
              </td>
            </tr>
          </table>
        </div>
    `;

    return sendEmail({
        to,
        subject: `Results Announced: ${eventName}`,
        message: `Hello ${participantName},\n\nThe results for "${eventName}" have been announced!\n\n${results || ''}\n\n${message || ''}`,
        html
    });
};

// Send event announcement notification
exports.sendEventAnnouncement = async (options) => {
    const { to, eventName, eventDate, eventLocation, eventDescription, organizerName } = options;
    
    const html = `
        <div style="background-color: #f4f4f7; padding: 40px 0; font-family: 'Segoe UI', sans-serif;">
          <table style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; padding: 20px;">
            <tr>
              <td>
                <div style="text-align: center; margin-bottom: 20px;">
                    <span style="background-color: #3b82f6; color: white; padding: 10px 20px; border-radius: 20px; font-size: 14px;">New Event</span>
                </div>
                <h2 style="color: #3b82f6; text-align: center;">New Event Announced!</h2>
                <p style="font-size: 16px; color: #333; line-height: 1.6;">A new event has been announced:</p>
                <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #1e293b; margin-bottom: 15px;">${eventName}</h3>
                    <p style="color: #475569; margin: 8px 0;"><strong>Date:</strong> ${new Date(eventDate).toLocaleDateString()}</p>
                    <p style="color: #475569; margin: 8px 0;"><strong>Location:</strong> ${eventLocation || 'TBA'}</p>
                    <p style="color: #475569; margin: 8px 0;"><strong>Organizer:</strong> ${organizerName}</p>
                </div>
                <p style="font-size: 13px; color: #777;">Thank you for using Collexa.</p>
              </td>
            </tr>
          </table>
        </div>
    `;

    return sendEmail({
        to,
        subject: `New Event: ${eventName}`,
        message: `New event: ${eventName}\nDate: ${new Date(eventDate).toLocaleDateString()}\nLocation: ${eventLocation || 'TBA'}`,
        html
    });
};

// Send bulk emails
exports.sendBulkEmails = async (emails) => {
    const results = [];
    for (const email of emails) {
        try {
            const result = await sendEmail(email);
            results.push({ to: email.to, success: true, messageId: result.messageId });
        } catch (error) {
            results.push({ to: email.to, success: false, error: error.message });
        }
    }
    return results;
};
