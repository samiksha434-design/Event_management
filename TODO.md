# Collexa - College Event Management System Enhancement Tasks

## Phase 1: Event Creation Form Updates
- [ ] 1.1 Update EventForm.jsx - Add category dropdown (coding, debate, dance, hackathon, robotics, sports, cultural, other)
- [ ] 1.2 Add eventType field (technical/non-technical)
- [ ] 1.3 Add college field
- [ ] 1.4 Add fees field
- [ ] 1.5 Add voting enable option
- [ ] 1.6 Update initialEventData in CreateEventPage.jsx

## Phase 2: Events Page - Smart Search & Filters
- [ ] 2.1 Add search bar component to EventsPage.jsx
- [ ] 2.2 Add category filter dropdown
- [ ] 2.3 Add college filter dropdown
- [ ] 2.4 Add date range filter
- [ ] 2.5 Add fees filter (free/paid/max fee)
- [ ] 2.6 Add eventType filter (technical/non-technical)
- [ ] 2.7 Pass filters to eventService.getAllEvents()

## Phase 3: Event Detail Page Enhancements
- [ ] 3.1 Read current EventDetailPage.jsx
- [ ] 3.2 Add feedback/rating submission form
- [ ] 3.3 Add voting system UI (if enabled)
- [ ] 3.4 Show admin verification status for votes
- [ ] 3.5 Display event analytics (participants, revenue)
- [ ] 3.6 Add service methods for feedback and voting

## Phase 4: User Profile - Participant History
- [ ] 4.1 Read current ProfilePage.jsx
- [ ] 4.2 Add participant history section
- [ ] 4.3 Add certificate download buttons for past events
- [ ] 4.4 Add service method for user event history

## Phase 5: Admin Dashboard - College Management & Analytics
- [ ] 5.1 Read current AdminDashboardPage.jsx
- [ ] 5.2 Add college management section
- [ ] 5.3 Add detailed analytics (participation, revenue, trends)
- [ ] 5.4 Add service methods for analytics

## Phase 6: Backend Service Methods
- [ ] 6.1 Add getHistory method to eventService.js
- [ ] 6.2 Add submitFeedback method to eventService.js
- [ ] 6.3 Add voteForEvent method to eventService.js
- [ ] 6.4 Add verifyVotes method to eventService.js
- [ ] 6.5 Add getAnalytics method to eventService.js
- [ ] 6.6 Add getCertificate method to eventService.js

## Phase 7: Run and Test
- [ ] 7.1 Start backend services
- [ ] 7.2 Start frontend
- [ ] 7.3 Test admin login
- [ ] 7.4 Test event creation with new fields
- [ ] 7.5 Test search and filters
- [ ] 7.6 Test participant history and certificates
