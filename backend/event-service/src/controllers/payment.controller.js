const axios = require('axios');
const Payment = require('../models/Payment');
const Event = require('../models/Event');

/**
 * @desc    Initialize a payment with Paystack
 * @route   POST /api/payment/initialize
 * @access  Private
 */
exports.initializePayment = async (req, res, next) => {
    try {
        const { amount, email, callback_url, eventId, registrationData } = req.body;

        if (!amount || !email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide amount and email'
            });
        }

        const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

        if (!paystackSecretKey) {
            return res.status(500).json({
                success: false,
                message: 'Paystack secret key is missing'
            });
        }

        // Call Paystack API
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email,
                amount: amount * 100, // Paystack expects amount in Kobo (1 NGN = 100 Kobo)
                callback_url
            },
            {
                headers: {
                    Authorization: `Bearer ${paystackSecretKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const { authorization_url, access_code, reference } = response.data.data;

        // Optional: save pending payment to DB immediately
        await Payment.create({
            userId: req.user.id || req.user._id,
            email,
            amount,
            reference,
            eventId,
            registrationData,
            status: 'pending'
        });

        res.status(200).json({
            success: true,
            data: {
                authorization_url,
                access_code,
                reference
            }
        });
    } catch (error) {
        console.error('Initialize Payment Error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Payment initialization failed',
            error: error.response?.data || error.message
        });
    }
};

/**
 * @desc    Verify Paystack transaction
 * @route   GET /api/payment/verify/:reference
 * @access  Private
 */
exports.verifyPayment = async (req, res, next) => {
    try {
        const { reference } = req.params;

        if (!reference) {
            return res.status(400).json({
                success: false,
                message: 'Reference is required'
            });
        }

        const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

        // Verify transaction dynamically
        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${paystackSecretKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const data = response.data.data;

        let payment = await Payment.findOne({ reference });

        if (data.status === 'success') {
            if (payment) {
                payment.status = 'success';
                payment.paymentDate = data.paid_at || Date.now();
                await payment.save();

                // If eventId and registrationData exist, automatically register the user
                if (payment.eventId && payment.registrationData) {
                    try {
                        const event = await Event.findById(payment.eventId);
                        if (event) {
                            // Check if user is already registered to prevent duplicates
                            const isAlreadyRegistered = event.participants.some(
                                p => p.userId.toString() === payment.userId.toString()
                            );

                            if (!isAlreadyRegistered) {
                                // Add user to participants
                                const { name, email, specialRequirements } = payment.registrationData;
                                const participantEmail = email || req.user.email || 'No email provided';
                                const participantName = name || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Paid Participant';

                                event.participants.push({
                                    userId: payment.userId,
                                    name: participantName,
                                    email: participantEmail,
                                    college: req.user.college || 'No college',
                                    specialRequirements: specialRequirements || '',
                                    attendanceStatus: 'registered'
                                });
                                await event.save();
                                console.log(`User ${payment.userId} successfully auto-registered for paid event ${event._id}`);
                            } else {
                                console.log(`User ${payment.userId} is already registered for event ${event._id}`);
                            }
                        }
                    } catch (regError) {
                        console.error('Error auto-registering user after payment:', regError);
                    }
                }
            } else {
                payment = await Payment.create({
                    userId: req.user.id || req.user._id,
                    email: data.customer.email,
                    amount: data.amount / 100,
                    reference: data.reference,
                    status: 'success',
                    paymentDate: data.paid_at || Date.now()
                });
            }

            res.status(200).json({
                success: true,
                message: 'Payment verified and saved successfully',
                data: payment
            });
        } else {
            if (payment) {
                payment.status = 'failed';
                await payment.save();
            }

            res.status(400).json({
                success: false,
                message: 'Payment was not successful',
                status: data.status
            });
        }
    } catch (error) {
        console.error('Verify Payment Error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Payment verification failed',
            error: error.response?.data || error.message
        });
    }
};
