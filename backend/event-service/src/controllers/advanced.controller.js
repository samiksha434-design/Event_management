const Event = require('../models/Event');
const PDFDocument = require('pdfkit');
const axios = require('axios');
const { generateCertificate } = require('../utils/certificate.utils');

exports.getUserEventHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const events = await Event.find({ 'participants.userId': userId }).sort({ date: -1 });
        res.status(200).json({ success: true, count: events.length, data: events });
    } catch (error) {
        next(error);
    }
};

exports.downloadCertificate = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

        const participant = event.participants.find(p => p.userId && p.userId.toString() === req.user.id.toString());
        if (!participant) return res.status(403).json({ success: false, message: 'You did not participate in this event' });

        const fs = require('fs');
        const path = require('path');

        // Validate if event is completed via attendanceStatus
        if (participant.attendanceStatus !== 'completed') {
            return res.status(400).json({ success: false, message: 'Certificate is only available after event completion' });
        }

        let certFilePath;
        let fileName;

        if (participant.certificateId && participant.certificatePath) {
            // Remove leading slash if exists to prevent path absolute resolution issues on Windows
            const relativePath = participant.certificatePath.startsWith('/') ? participant.certificatePath.substring(1) : participant.certificatePath;
            certFilePath = path.join(__dirname, '../../', relativePath);
            fileName = `certificate_${participant.certificateId}.pdf`;
        }

        if (!certFilePath || !fs.existsSync(certFilePath)) {
            // Generate it if doesn't exist but status is completed
            const certResult = await generateCertificate(
                participant.name,
                event.title,
                event.date,
                event.college,
                participant.rank
            );

            participant.certificateId = certResult.certificateId;
            participant.certificatePath = certResult.certificatePath;
            participant.certificateGeneratedAt = new Date();
            await event.save();

            certFilePath = certResult.filePath;
            fileName = `certificate_${certResult.certificateId}.pdf`;
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

        const stream = fs.createReadStream(certFilePath);
        stream.pipe(res);
    } catch (error) {
        console.error("CERT ERROR:", error);
        next(error);
    }
};

exports.submitFeedback = async (req, res, next) => {
    try {
        const { rating, comment, isAnonymous } = req.body;
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
        if (!event.isUserRegistered(req.user.id)) return res.status(403).json({ success: false, message: 'You must participate to leave feedback' });

        event.feedbacks.push({
            rating,
            comment,
            isAnonymous: isAnonymous !== undefined ? isAnonymous : true
        });

        await event.save();
        res.status(200).json({ success: true, message: 'Feedback added' });
    } catch (error) {
        next(error);
    }
};

exports.voteForEvent = async (req, res, next) => {
    try {
        const { candidateName } = req.body;
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
        if (!event.voting?.enabled) return res.status(400).json({ success: false, message: 'Voting is not enabled for this event' });

        // Assuming any registered user can vote, or anyone. Let's say user must be authenticated.
        const alreadyVoted = event.voting.voters.some(v => v.userId.toString() === req.user.id.toString());
        if (alreadyVoted) return res.status(400).json({ success: false, message: 'You have already voted' });

        const optionInfo = event.voting.options.find(o => o.candidateName === candidateName);
        if (!optionInfo) return res.status(400).json({ success: false, message: 'Invalid candidate' });

        optionInfo.votes += 1;
        event.voting.voters.push({ userId: req.user.id });
        await event.save();

        res.status(200).json({ success: true, message: 'Vote registered' });
    } catch (error) {
        next(error);
    }
};

exports.verifyVotes = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

        event.voting.adminVerified = true;
        await event.save();
        res.status(200).json({ success: true, message: 'Votes verified successfully' });
    } catch (error) {
        next(error);
    }
};

exports.getEventAnalytics = async (req, res, next) => {
    try {
        // Deliver analytics. Either for a specific event or overall for college.
        const { college } = req.query;

        let query = {};
        if (college) query.college = new RegExp(college, 'i');
        else if (req.user.role !== 'admin') {
            // Maybe restrict?
        }

        const events = await Event.find(query);
        let totalParticipants = 0;
        let totalRevenue = 0;
        let categoryPopularity = {};

        events.forEach(e => {
            totalParticipants += e.participants.length;
            totalRevenue += (e.fees || 0) * e.participants.length;

            const cat = e.category || 'other';
            categoryPopularity[cat] = (categoryPopularity[cat] || 0) + e.participants.length;
        });

        res.status(200).json({
            success: true,
            data: {
                totalEvents: events.length,
                totalParticipants,
                totalRevenue,
                categoryPopularity
            }
        });
    } catch (error) {
        next(error);
    }
};

// Send event results to all participants
exports.sendEventResults = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

        // Check authorization - only event creator or admin can send results
        if (event.createdBy.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to send event results' });
        }

        const { results, message } = req.body;

        if (!results && !message) {
            return res.status(400).json({ success: false, message: 'Please provide results or message' });
        }

        const notificationServiceUrl = process.env.NOTIFICATION_SERVICE || 'http://localhost:8005';
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@collexa.com';

        // Get all participant emails
        const participants = event.participants.map(p => ({
            email: p.email,
            name: p.name
        }));

        if (participants.length === 0) {
            return res.status(400).json({ success: false, message: 'No participants to notify' });
        }

        // Send emails to all participants
        const emailPromises = participants.map(async (participant) => {
            try {
                await axios.post(`${notificationServiceUrl}/api/email/send`, {
                    to: participant.email,
                    subject: `Results Announced: ${event.title}`,
                    message: `Hello ${participant.name},\n\nThe results for "${event.title}" have been announced!\n\n${results || ''}\n\n${message || ''}\n\nThank you for participating in Collexa Events!`
                });
                return { email: participant.email, success: true };
            } catch (err) {
                return { email: participant.email, success: false, error: err.message };
            }
        });

        const emailResults = await Promise.all(emailPromises);
        const successful = emailResults.filter(r => r.success).length;
        const failed = emailResults.filter(r => !r.success).length;

        // Also notify admin
        await axios.post(`${notificationServiceUrl}/api/email/send`, {
            to: adminEmail,
            subject: `Event Results Sent: ${event.title}`,
            message: `Results for event "${event.title}" have been sent to participants.\n\nTotal participants: ${participants.length}\nSuccessful: ${successful}\nFailed: ${failed}`
        }).catch(() => { });

        res.status(200).json({
            success: true,
            message: `Event results sent: ${successful} successful, ${failed} failed`,
            data: { total: participants.length, successful, failed }
        });
    } catch (error) {
        next(error);
    }
};

// Update attendance status and generate certificate when completed
exports.updateAttendance = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

        // Check authorization - only event creator or admin can update attendance
        if (event.createdBy.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to update attendance' });
        }

        const { participantId, attendanceStatus, rank } = req.body;

        // Validate attendance status
        const validStatuses = ['registered', 'attended', 'completed', 'absent'];
        if (!validStatuses.includes(attendanceStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid attendance status. Must be one of: registered, attended, completed, absent'
            });
        }

        // Find the participant
        const participantIndex = event.participants.findIndex(
            p => p.userId.toString() === participantId || p._id.toString() === participantId
        );

        if (participantIndex === -1) {
            return res.status(404).json({ success: false, message: 'Participant not found' });
        }

        const participant = event.participants[participantIndex];
        const previousStatus = participant.attendanceStatus;

        // Update attendance status
        event.participants[participantIndex].attendanceStatus = attendanceStatus;
        if (rank) {
            event.participants[participantIndex].rank = rank;
        }

        // If status changes to "completed", generate certificate
        if (attendanceStatus === 'completed' && previousStatus !== 'completed') {
            try {
                console.log(`Generating certificate for participant: ${participant.name}`);

                // Generate PDF certificate
                const certResult = await generateCertificate(
                    participant.name,
                    event.title,
                    event.date,
                    event.college,
                    event.participants[participantIndex].rank
                );

                // Update participant with certificate details
                event.participants[participantIndex].certificateId = certResult.certificateId;
                event.participants[participantIndex].certificatePath = certResult.certificatePath;
                event.participants[participantIndex].certificateGeneratedAt = new Date();

                console.log(`Certificate generated: ${certResult.certificateId} at ${certResult.certificatePath}`);

                // Send certificate email notification
                try {
                    const notificationServiceUrl = process.env.NOTIFICATION_SERVICE || 'http://localhost:8005';
                    await axios.post(`${notificationServiceUrl}/api/email/send`, {
                        to: participant.email,
                        subject: `Your Certificate: ${event.title}`,
                        message: `Hello ${participant.name},\n\nCongratulations! Your certificate for participating in "${event.title}" has been generated.\n\nCertificate ID: ${certResult.certificateId}\nEvent Date: ${new Date(event.date).toLocaleDateString()}\n\nYou can download your certificate from the event page.\n\nThank you for participating in Collexa Events!`
                    }).catch(err => console.error('Failed to send certificate email:', err.message));
                } catch (emailErr) {
                    console.error('Failed to send certificate notification:', emailErr.message);
                }

            } catch (certError) {
                console.error('Error generating certificate:', certError);
                // Continue even if certificate generation fails
            }
        }

        await event.save();

        res.status(200).json({
            success: true,
            message: `Attendance updated to ${attendanceStatus}`,
            data: {
                participantId: participant._id,
                attendanceStatus: attendanceStatus,
                certificateId: event.participants[participantIndex].certificateId || null,
                certificateGenerated: attendanceStatus === 'completed' && previousStatus !== 'completed'
            }
        });

    } catch (error) {
        next(error);
    }
};
