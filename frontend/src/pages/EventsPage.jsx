import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../services';
import EventCard from '../components/events/EventCard';
import { useAuth } from '../context/AuthContext';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past'
  const { user } = useAuth();
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [feeFilter, setFeeFilter] = useState(''); // '', 'free', 'paid'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        
        // Build filter params
        const filters = {};
        if (searchTerm) filters.search = searchTerm;
        if (categoryFilter) filters.category = categoryFilter;
        if (collegeFilter) filters.college = collegeFilter;
        if (eventTypeFilter) filters.eventType = eventTypeFilter;
        if (feeFilter === 'free') filters.isFree = 'true';
        if (feeFilter === 'paid') filters.maxFee = '999999';
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;
        
        const data = await eventService.getAllEvents(filters);
        
        // Get events data, ensuring we have an array
        let eventsData = Array.isArray(data) ? data : data.data || [];
        
        // Filter out sample events
        eventsData = eventsData.filter(event => {
          const title = event.title.toLowerCase();
          return !title.includes('sample') && !title.includes('test');
        });
        
        setEvents(eventsData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
  
    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchEvents();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, categoryFilter, collegeFilter, eventTypeFilter, feeFilter, startDate, endDate]);

  // Filter events based on selected filter (all, upcoming, past)
  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (filter === 'upcoming') {
      return eventDate >= today;
    } else if (filter === 'past') {
      return eventDate < today;
    }
    return true; // 'all' filter
  });

  // Check if user is an organizer or admin
  const canCreateEvent = user && (user.role === 'organizer' || user.role === 'admin');

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setCollegeFilter('');
    setEventTypeFilter('');
    setFeeFilter('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          {canCreateEvent && (
            <Link 
              to="/events/create" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Event
            </Link>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mt-4 mb-6 bg-white p-4 rounded-lg shadow">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                </svg>
              </div>
              <input 
                type="text" 
                className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Search events by title, description, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Category Filter */}
            <div>
              <select 
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="coding">Coding</option>
                <option value="debate">Debate</option>
                <option value="dance">Dance</option>
                <option value="hackathon">Hackathon</option>
                <option value="robotics">Robotics</option>
                <option value="sports">Sports</option>
                <option value="cultural">Cultural</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            {/* College Filter */}
            <div>
              <input 
                type="text" 
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
                placeholder="Filter by college..."
                value={collegeFilter}
                onChange={(e) => setCollegeFilter(e.target.value)}
              />
            </div>
            
            {/* Event Type Filter */}
            <div>
              <select 
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="technical">Technical</option>
                <option value="non-technical">Non-Technical</option>
              </select>
            </div>
            
            {/* Fee Filter */}
            <div>
              <select 
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
                value={feeFilter}
                onChange={(e) => setFeeFilter(e.target.value)}
              >
                <option value="">All Fees</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            
            {/* Start Date Filter */}
            <div>
              <input 
                type="date" 
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            {/* End Date Filter */}
            <div>
              <input 
                type="date" 
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          
          {/* Clear Filters Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Time Filter controls */}
        <div className="mt-4 mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${filter === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
              All Events
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${filter === 'upcoming' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${filter === 'past' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
              Past
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 my-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Events grid */}
        {!loading && !error && (
          <div className="mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.length > 0 ? (
              filteredEvents.map(event => (
                <EventCard key={event._id} event={event} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">
                  {filter === 'all' 
                    ? 'No events found.' 
                    : filter === 'upcoming' 
                      ? 'No upcoming events found.' 
                      : 'No past events found.'}
                </p>
                {canCreateEvent && (
                  <Link 
                    to="/events/create" 
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Create your first event
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
