import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context';
import { authService, eventService } from '../services';

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    college: ''
  });
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // Event history state
  const [eventHistory, setEventHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Redirect if user is not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch user profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await authService.getCurrentUser();
        setProfileData(response.user);
        setFormData({
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          email: response.user.email,
          college: response.user.college
        });
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  // Fetch user event history
  useEffect(() => {
    const fetchEventHistory = async () => {
      if (!user) return;
      
      try {
        setHistoryLoading(true);
        const response = await eventService.getUserEventHistory();
        setEventHistory(response.data || []);
      } catch (err) {
        console.error('Failed to fetch event history:', err);
      } finally {
        setHistoryLoading(false);
      }
    };
    
    fetchEventHistory();
  }, [user]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await authService.updateProfile(formData);
      setProfileData(response.user);
      setUpdateSuccess(true);
      setIsEditing(false);
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (error) {
      setError(error.message || 'Failed to update profile');
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  // Handle certificate download
  const handleDownloadCertificate = async (eventId, eventTitle) => {
    try {
      const response = await eventService.getCertificate(eventId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.setAttribute('download', `certificate_${fileName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download certificate:', err);
      alert(err.message || 'Failed to download certificate. Certificates are only available for past events you participated in.');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Render role-specific information
  const renderRoleSpecificInfo = () => {
    if (!profileData) return null;

    switch (profileData.role) {
      case 'admin':
        return (
          <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">Admin Information</h3>
            <p className="text-purple-700 mb-2">As an admin, you have full access to manage the platform.</p>
            <ul className="list-disc list-inside text-purple-600 ml-2">
              <li>Manage all users and their roles</li>
              <li>Approve or reject events</li>
              <li>Access platform analytics</li>
              <li>Configure system settings</li>
            </ul>
          </div>
        );
      case 'organizer':
        return (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Organizer Information</h3>
            <p className="text-blue-700 mb-2">As an organizer, you can create and manage events.</p>
            <ul className="list-disc list-inside text-blue-600 ml-2">
              <li>Create new events</li>
              <li>Manage your existing events</li>
              <li>View participant registrations</li>
              <li>Send announcements to participants</li>
            </ul>
          </div>
        );
      case 'participant':
        return (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Participant Information</h3>
            <p className="text-green-700 mb-2">As a participant, you can register for and attend events.</p>
            <ul className="list-disc list-inside text-green-600 ml-2">
              <li>Browse and register for events</li>
              <li>View your registered events</li>
              <li>Receive event updates</li>
              <li>Participate in event activities</li>
            </ul>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="pb-12">
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-800 px-6 py-4">
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border-l-4 border-red-400 p-4 my-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : profileData ? (
            <div>
              {updateSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                  Profile updated successfully!
                </div>
              )}
              
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 mb-6 md:mb-0">
                  <div className="flex flex-col items-center">
                    {user.photo ? (
                      <img src={user.photo} alt="Profile" className="w-32 h-32 rounded-full object-cover mb-4" />
                    ) : (
                      <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center mb-4">
                        <span className="text-4xl font-bold text-gray-600">
                          {profileData.firstName.charAt(0)}{profileData.lastName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <h2 className="text-xl font-semibold text-gray-800">
                      {profileData.firstName} {profileData.lastName}
                    </h2>
                    <span className={`mt-2 py-1 px-3 rounded-full text-xs ${profileData.role === 'admin' ? 'bg-purple-200 text-purple-800' : profileData.role === 'organizer' ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'}`}>
                      {profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div className="md:w-2/3">
                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                          <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                          <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                          disabled
                        />
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                      </div>
                      <div>
                        <label htmlFor="college" className="block text-sm font-medium text-gray-700 mb-1">College</label>
                        <input
                          type="text"
                          id="college"
                          name="college"
                          value={formData.college}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div className="flex space-x-4">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">First Name</h3>
                          <p className="mt-1 text-lg text-gray-800">{profileData.firstName}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Last Name</h3>
                          <p className="mt-1 text-lg text-gray-800">{profileData.lastName}</p>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Email</h3>
                        <p className="mt-1 text-lg text-gray-800">{profileData.email}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">College</h3>
                        <p className="mt-1 text-lg text-gray-800">{profileData.college}</p>
                      </div>
                      <div>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Edit Profile
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {renderRoleSpecificInfo()}
            </div>
          ) : null}
        </div>
      </div>

      {/* Event History Section */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-teal-800 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">My Event History</h2>
          <p className="text-green-100 text-sm mt-1">View your past events and download certificates</p>
        </div>
        <div className="p-6">
          {historyLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : eventHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">College</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {eventHistory.map((event) => {
                    const isPast = new Date(event.date) < new Date();
                    return (
                      <tr key={event._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{event.title}</div>
                          <div className="text-sm text-gray-500">{event.location}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {event.college}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(event.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {event.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isPast ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              Completed
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Upcoming
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {isPast ? (
                            <button
                              onClick={() => handleDownloadCertificate(event._id, event.title)}
                              className="text-green-600 hover:text-green-900 flex items-center"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download
                            </button>
                          ) : (
                            <span className="text-gray-400">Not available</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-2 text-gray-500">You haven't participated in any events yet.</p>
              <Link to="/events" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800">
                Browse Events
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
