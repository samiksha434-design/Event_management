const express = require('express');
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelRegistration,
  getEventParticipants
} = require('../controllers/event.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const {
  getUserEventHistory,
  downloadCertificate,
  submitFeedback,
  voteForEvent,
  verifyVotes,
  getEventAnalytics
} = require('../controllers/advanced.controller');

const router = express.Router();

// Public routes
router.get('/', getAllEvents);
router.get('/analytics', protect, authorize('admin', 'organizer'), getEventAnalytics);
router.get('/history', protect, getUserEventHistory);
router.get('/:id', getEventById);

// Protected routes (require authentication)
router.post('/', protect, authorize('organizer', 'admin'), createEvent);
router.put('/:id', protect, updateEvent); // Authorization check in controller
router.delete('/:id', protect, deleteEvent); // Authorization check in controller

// Registration routes
router.post('/:id/register', protect, registerForEvent);
router.delete('/:id/register', protect, cancelRegistration);

// Participants route
router.get('/:id/participants', protect, getEventParticipants); // Authorization check in controller

// Advanced features
router.get('/:id/certificate', protect, downloadCertificate);
router.post('/:id/feedback', protect, submitFeedback);
router.post('/:id/vote', protect, voteForEvent);
router.put('/:id/verify-votes', protect, authorize('admin'), verifyVotes);

module.exports = router;