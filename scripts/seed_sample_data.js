// Use global fetch when available (Node 18+), otherwise fall back to node-fetch
let _fetch = globalThis.fetch;
if (!_fetch) {
  _fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
}
const fetchFn = (...args) => _fetch(...args);

const AUTH_URL = process.env.AUTH_URL || 'http://localhost:8001/api/auth';
const EVENT_URL = process.env.EVENT_URL || 'http://localhost:8002/api/events';
const ANNOUNCE_URL = process.env.ANNOUNCE_URL || 'http://localhost:8003/api/announcements';
const LEADERBOARD_URL = process.env.LEADERBOARD_URL || 'http://localhost:8004/api/leaderboard';

async function createUser(user) {
  const res = await fetchFn(`${AUTH_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
  return res.json();
}

async function createEvent(eventData, token) {
  const res = await fetchFn(EVENT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(eventData)
  });
  return res.json();
}

async function createAnnouncement(data, token) {
  const res = await fetchFn(ANNOUNCE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function updateLeaderboard(eventId, userId, data, token) {
  const res = await fetchFn(`${LEADERBOARD_URL}/event/${eventId}/user/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function run() {
  try {
    console.log('Creating organizer...');
    const orgEmail = `org+${Date.now()}@example.com`;
    const org = await createUser({ firstName: 'Org', lastName: 'One', email: orgEmail, password: 'Aa1!password', college: 'Org College', role: 'organizer' });
    if (!org.token) throw new Error('Failed to create organizer: ' + JSON.stringify(org));
    const orgToken = org.token;
    const orgId = org.user.id;

    console.log('Creating participants...');
    const participants = [];
    for (let i=1;i<=3;i++){
      const pEmail = `participant${i}+${Date.now()}@example.com`;
      const p = await createUser({ firstName: `Part${i}`, lastName: 'User', email: pEmail, password: 'Aa1!password', college: `College ${i}`, role: 'participant' });
      participants.push(p.user);
    }

    console.log('Creating events...');
    const events = [];
    const sampleEvents = [
      { title: '24-Hour Hackathon', description: 'Build something cool in 24 hours', date: new Date(Date.now()+24*3600*1000).toISOString(), location: 'RN:301, Bunts Sangha\'s Anna Leela college Kurla', capacity: 100, tags: ['hackathon','coding'], image: 'https://example.com/hack.jpg' },
      { title: 'Tech Talk: AI in Education', description: 'Talk about AI', date: new Date(Date.now()+48*3600*1000).toISOString(), location: 'Auditorium', capacity: 200, tags: ['talk','ai'], image: '' }
    ];

    for (const ev of sampleEvents) {
      const created = await createEvent(ev, orgToken);
      console.log('Event create response:', created.message || created);
      if (created.data) events.push(created.data);
    }

    console.log('Creating announcements...');
    for (const ev of events) {
      const ann = await createAnnouncement({ title: `New Event: ${ev.title}`, content: ev.description, eventId: ev._id, priority: 'high', creatorName: 'Org One', isPublished: true }, orgToken);
      console.log('Announcement:', ann.message || ann);
    }

    console.log('Seeding leaderboard entries...');
    // For each participant, create leaderboard entry for first event
    if (events[0]){
      const eventId = events[0]._id || events[0].id;
      for (let i=0;i<participants.length;i++){
        const p = participants[i];
        const points = (3-i)*100; // descending
        const resp = await updateLeaderboard(eventId, p.id, { userName: `${p.firstName} ${p.lastName}`, college: p.college, points, achievements: ['participated'] }, orgToken);
        console.log('Leaderboard updated:', resp.message || resp);
      }
    }

    console.log('Seeding complete.');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

run();
