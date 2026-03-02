const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/collexa')
  .then(async () => {
    const Event = require('./backend/event-service/src/models/Event');
    const events = await Event.find({ participants: { $exists: true, $ne: [] } })
      .select('_id title participants')
      .limit(3);
    
    console.log('Events with participants:');
    events.forEach(e => {
      console.log(`\nEvent ID: ${e._id}`);
      console.log(`Title: ${e.title}`);
      console.log(`Participants: ${e.participants.length}`);
      e.participants.forEach((p, i) => {
        console.log(`  ${i+1}. ${p.name} (${p.email}) - Status: ${p.attendanceStatus || 'not set'}`);
        console.log(`     User ID: ${p.userId}`);
      });
    });
    
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
