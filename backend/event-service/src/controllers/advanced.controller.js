const Event = require('../models/Event');
const PDFDocument = require('pdfkit');

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

        // Validate if event is completed (or in past)
        if (new Date(event.date) >= new Date()) {
            return res.status(400).json({ success: false, message: 'Event is not yet completed' });
        }

        const participant = event.participants.find(p => p.userId.toString() === req.user.id.toString());
        if (!participant) return res.status(403).json({ success: false, message: 'You did not participate in this event' });

        // Generate PDF
        const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=certificate_${event._id}.pdf`);
        doc.pipe(res);

        doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();
        doc.fontSize(30).text('Certificate of Participation', { align: 'center' });
        doc.moveDown();
        doc.fontSize(20).text('This is to certify that', { align: 'center' });
        doc.moveDown();
        doc.fontSize(25).fillColor('blue').text(participant.name || 'Participant', { align: 'center' });
        doc.moveDown();
        doc.fontSize(20).fillColor('black').text(`has successfully participated in`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(25).text(event.title, { align: 'center' });
        doc.moveDown();
        doc.fontSize(15).text(`Date: ${new Date(event.date).toLocaleDateString()}`, { align: 'center' });
        doc.text(`College: ${event.college}`, { align: 'center' });

        doc.end();
    } catch (error) {
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
