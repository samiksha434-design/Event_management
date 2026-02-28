import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventService } from '../services';
import { useAuth } from '../context/AuthContext';
import EventRegistrationForm from '../components/events/EventRegistrationForm';
import EventAnnouncements from '../components/events/EventAnnouncements';

const EventDetailPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  
  // Feedback state
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  
  // Voting state
  const [votingOption, setVotingOption] = useState('');
  const [votingSubmitting, setVotingSubmitting] = useState(false);
  const [votingSuccess, setVotingSuccess] = useState('');
  
  // Verify votes state
  const [verifyingVotes, setVerifyingVotes] = useState(false);

  // Check if user is an organizer or admin
  const isOrganizerOrAdmin = user && (user.role === 'organizer' || user.role === 'admin');
  // Check if user is the event creator
  const isEventCreator = event && user && event.createdBy === user.id;
  // Check if user is admin
  const isAdmin = user && user.role === 'admin';

  // Function to fetch event details
  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!eventId) {
        setError('Invalid event ID');
        setLoading(false);
        return;
      }

      const eventData = await eventService.getEventById(eventId);
      setEvent(eventData);
      
      await fetchParticipants();
      
    } catch (err) {
      console.error('Failed to fetch event details:', err);
      setError('Failed to load event details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch participants
  const fetchParticipants = async () => {
    if (!user || !eventId) return;
    
    try {
      const participantsData = await eventService.getEventParticipants(eventId);
      
      const list = Array.isArray(participantsData) ? participantsData : 
                  (participantsData && participantsData.data ? participantsData.data : []);
      
      setParticipants(list);
      setIsRegistered(list.some(p => p.userId === user.id));
    } catch (participantError) {
      console.warn('Failed to fetch participants:', participantError);
      setParticipants([]);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    } else {
      setError('No event ID provided');
      setLoading(false);
    }
    
    const participantPolling = setInterval(() => {
      if (eventId && user) {
        fetchParticipants();
      }
    }, 10000);
    
    return () => clearInterval(participantPolling);
  }, [eventId, user]);

  const handleRegister = () => {
    if (!user) {
      navigate('/login', { state: { from: `/events/${eventId}` } });
      return;
    }
    
    if (user.role === 'admin' || user.role === 'organizer') {
      return;
    }
    
    setShowRegistrationForm(true);
  };

  const handleCancelRegistration = async () => {
    try {
      await eventService.cancelRegistration(eventId);
      setIsRegistered(false);
      fetchParticipants();
    } catch (err) {
      console.error('Failed to cancel registration:', err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await eventService.deleteEvent(eventId);
        navigate('/events');
      } catch (err) {
        console.error('Failed to delete event:', err);
      }
    }
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackSubmitting(true);
    setFeedbackSuccess('');
    
    try {
      await eventService.submitFeedback(eventId, {
        rating: feedbackRating,
        comment: feedbackComment,
        isAnonymous: true
      });
      setFeedbackSuccess('Thank you for your feedback!');
      setFeedbackComment('');
      setShowFeedbackForm(false);
      // Refresh event data to show new feedback
      fetchEventDetails();
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      alert(err.message || 'Failed to submit feedback');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // Handle voting
  const handleVote = async (e) => {
    e.preventDefault();
    if (!votingOption) return;
    
    setVotingSubmitting(true);
    setVotingSuccess('');
    
    try {
      await eventService.voteForEvent(eventId, { candidateName: votingOption });
      setVotingSuccess('Your vote has been recorded!');
      // Refresh event data to show updated votes
      fetchEventDetails();
    } catch (err) {
      console.error('Failed to vote:', err);
      alert(err.message || 'Failed to submit vote');
    } finally {
      setVotingSubmitting(false);
    }
  };

  // Handle vote verification (admin only)
  const handleVerifyVotes = async () => {
    setVerifyingVotes(true);
    try {
      await eventService.verifyVotes(eventId);
      alert('Votes verified successfully!');
      fetchEventDetails();
    } catch (err) {
      console.error('Failed to verify votes:', err);
      alert(err.message || 'Failed to verify votes');
    } finally {
      setVerifyingVotes(false);
    }
  };

  // Handle certificate download
  const handleDownloadCertificate = async () => {
    try {
      const response = await eventService.getCertificate(eventId);
      // Create a blob and download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate_${eventId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download certificate:', err);
      alert(err.message || 'Failed to download certificate. Note: Certificates are only available for past events you participated in.');
    }
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString || isNaN(new Date(dateString))) return 'Invalid Date';
    const options = {
      weekday: 'long', year: 'numeric',
      month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Check if user has already voted
  const hasUserVoted = event?.voting?.voters?.some(v => v.userId === user?.id);
  
  // Check if event is past
  const isEventPast = event && new Date(event.date) < new Date();

  if (!eventId) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <svg className="h-12 w-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="mt-4 text-xl font-bold text-center text-gray-800">Invalid Event ID</h2>
          <p className="mt-2 text-center text-gray-600">The event ID is missing or invalid.</p>
          <div className="mt-6 text-center">
            <Link to="/events" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <svg className="h-12 w-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="mt-4 text-xl font-bold text-center text-gray-800">{error}</h2>
          <div className="mt-6 text-center">
            <Link to="/events" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-gray-800">Event not found</h2>
          <p className="mt-2 text-gray-600">The event you're looking for doesn't exist or has been removed.</p>
          <div className="mt-6">
            <Link to="/events" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-6">
          <Link to="/events" className="text-indigo-600 hover:text-indigo-900 flex items-center">
            <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Events
          </Link>
        </div>

        {/* Event details card */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
            <div>
              <h3 className="text-2xl leading-6 font-bold text-gray-900">
                {event?.title || 'Event Title'}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Organized by {event?.organizerName && event.organizerName.trim() !== "undefined undefined" ? event.organizerName : "Event Organizer"}
              </p>
              {/* Event badges */}
              <div className="mt-2 flex gap-2">
                {event?.category && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {event.category}
                  </span>
                )}
                {event?.eventType && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {event.eventType}
                  </span>
                )}
                {event?.fees > 0 ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    ₹{event.fees}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Free
                  </span>
                )}
              </div>
            </div>
            {/* Admin/Organizer actions */}
            <div className="flex space-x-3">
              {isEventCreator && (
                <>
                  <Link to={`/events/${eventId}/edit`} className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    Edit
                  </Link>
                  <button onClick={handleDelete} className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
                    Delete
                  </button>
                </>
              )}
              <Link to={`/leaderboard/${eventId}`} className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                View Leaderboard
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Date and Time</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {event?.date ? formatDate(event.date) : 'Date not specified'}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {event?.location || 'Location not specified'}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">College</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {event?.college || 'College not specified'}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {event?.description || 'No description provided'}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Capacity</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {participants && event ? `${participants.length} / ${event.capacity || 0} registered` : 'Loading...'}
                </dd>
              </div>
              {event?.tags && event.tags.length > 0 && (
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Tags</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Certificate Download - for past events */}
        {isEventPast && isRegistered && (
          <div className="mt-6 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                🎓 Certificate of Participation
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>Thank you for participating in this event! You can download your certificate of participation.</p>
              </div>
              <div className="mt-5">
                <button
                  onClick={handleDownloadCertificate}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                >
                  Download Certificate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Section - for registered participants of past events */}
        {isEventPast && isRegistered && (
          <div className="mt-6 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                📝 Event Feedback & Rating
              </h3>
              {event?.feedbacks && event.feedbacks.length > 0 && (
                <div className="mt-4 mb-4">
                  <p className="text-sm text-gray-500 mb-2">Average Rating: {(() => {
                    const avg = event.feedbacks.reduce((sum, f) => sum + f.rating, 0) / event.feedbacks.length;
                    return avg.toFixed(1);
                  })()} / 5 ({event.feedbacks.length} reviews)</p>
                  <div className="flex flex-wrap gap-2">
                    {event.feedbacks.slice(0, 5).map((fb, idx) => (
                      <div key={idx} className="bg-gray-50 p-2 rounded text-xs">
                        <div className="flex items-center">
                          <span className="text-yellow-500">{'★'.repeat(fb.rating)}</span>
                          <span className="text-gray-300">{'★'.repeat(5 - fb.rating)}</span>
                        </div>
                        {fb.comment && <p className="mt-1 text-gray-600">{fb.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!showFeedbackForm ? (
                <button
                  onClick={() => setShowFeedbackForm(true)}
                  className="mt-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Leave Feedback
                </button>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rating</label>
                    <div className="flex items-center mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className="text-2xl focus:outline-none"
                        >
                          {star <= feedbackRating ? '★' : '☆'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Comment (optional)</label>
                    <textarea
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Share your experience..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={feedbackSubmitting}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFeedbackForm(false)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              {feedbackSuccess && <p className="mt-2 text-green-600">{feedbackSuccess}</p>}
            </div>
          </div>
        )}

        {/* Voting Section - if enabled */}
        {event?.voting?.enabled && (
          <div className="mt-6 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  🗳️ Audience Voting
                </h3>
                {event.voting.adminVerified && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓ Verified by Admin
                  </span>
                )}
              </div>
              
              {/* Show voting options and results */}
              {event.voting.options && event.voting.options.length > 0 && (
                <div className="mt-4">
                  <div className="space-y-3">
                    {event.voting.options.map((option, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium">{option.candidateName}</span>
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full" 
                              style={{ width: `${(option.votes / (event.voting.options.reduce((a, b) => a + b.votes, 0) || 1)) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{option.votes} votes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Voting form for participants */}
              {isRegistered && !hasUserVoted && !event.voting.adminVerified && (
                <form onSubmit={handleVote} className="mt-4">
                  <select
                    value={votingOption}
                    onChange={(e) => setVotingOption(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 mb-2"
                    required
                  >
                    <option value="">Select your vote</option>
                    {event.voting.options?.map((option, idx) => (
                      <option key={idx} value={option.candidateName}>{option.candidateName}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={votingSubmitting || !votingOption}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {votingSubmitting ? 'Voting...' : 'Cast Vote'}
                  </button>
                  {votingSuccess && <p className="mt-2 text-green-600">{votingSuccess}</p>}
                </form>
              )}
              
              {hasUserVoted && <p className="mt-2 text-gray-500">You have already voted.</p>}
              
              {/* Admin verify button */}
              {isAdmin && !event.voting.adminVerified && (
                <button
                  onClick={handleVerifyVotes}
                  disabled={verifyingVotes}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {verifyingVotes ? 'Verifying...' : 'Verify Votes'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Registration section */}
        {!isOrganizerOrAdmin && (
          <div className="mt-6 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Event Registration</h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>
                  {isRegistered
                    ? "You are registered for this event."
                    : participants && event && participants.length >= (event.capacity || 0)
                    ? "This event has reached its capacity."
                    : "Register to secure your spot for this event."}
                </p>
              </div>
              <div className="mt-5">
                {isRegistered ? (
                  <button
                    onClick={handleCancelRegistration}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel Registration
                  </button>
                ) : (
                  <button
                    onClick={handleRegister}
                    disabled={participants && event && participants.length >= (event.capacity || 0)}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                      participants && event && participants.length >= (event.capacity || 0)
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    Register Now
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {showRegistrationForm && (
          <EventRegistrationForm
            event={event}
            onClose={() => setShowRegistrationForm(false)}
            onSuccess={() => {
              setIsRegistered(true);
              setShowRegistrationForm(false);
              fetchParticipants();
            }}
          />
        )}

        {/* Participants section */}
        {isOrganizerOrAdmin && (
          <div className="mt-6 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Registered Participants ({participants ? participants.length : 0})
              </h3>
              <div className="mt-4">
                {participants && participants.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {participants.map((participant) => (
                      <li key={participant.userId || `participant-${Math.random()}`} className="py-4 flex">
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {participant.name || 'Unnamed Participant'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {participant.email || 'No email provided'} - {participant.college || 'No college'}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No participants registered yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Event Announcements Section */}
        <div className="mt-6">
          <EventAnnouncements eventId={eventId} eventTitle={event?.title} />
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
