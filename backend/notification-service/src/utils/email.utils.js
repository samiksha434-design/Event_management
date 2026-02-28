const nodemailer = require('nodemailer');

const createTransporter = async () => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return nodemailer.createTransport({
                service: process.env.EMAIL_SERVICE,
                secure: process.env.EMAIL_SECURE === 'true',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
        } else {
            const transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: 'abbey.haag61@ethereal.email',
                    pass: 'QuamaR8XMsmwpXxr9v'
                }
            });
            console.log('Ethereal test transporter created.');
            return transporter;
        }
    } catch (error) {
        console.error('Failed to create email transporter:', error);
        return {
            sendMail: (options) => {
                console.log('\n--- EMAIL FALLBACK ---');
                console.log(`To: ${options.to}`);
                console.log(`Subject: ${options.subject}`);
                console.log(`Text: ${options.text}`);
                console.log('--- END EMAIL FALLBACK ---\n');
                return Promise.resolve({ messageId: 'mock-id' });
            }
        };
    }
};

exports.sendNotificationEmail = async (options) => {
    try {
        const transporter = await createTransporter();

        const mailOptions = {
            from: '"Collexa Events" <events@collexa.com>',
            to: options.to,
            subject: options.subject,
            text: options.message,
            html: `
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
      `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent:', info.messageId);

        const previewURL = nodemailer.getTestMessageUrl(info);
        if (previewURL) {
            console.log('Preview URL:', previewURL);
        }

        return info;
    } catch (error) {
        console.error('Error sending notification email:', error);
    }
};
