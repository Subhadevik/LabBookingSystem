const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const dbName = process.env.DB_NAME || 'lab_booking_system';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const users = [
      { email: 'admin@ai.college.edu', password: 'admin123', name: 'AI Department Administrator', role: 'admin' },
      { email: 'faculty1@ai.college.edu', password: 'faculty123', name: 'Dr. Sarah Johnson', role: 'faculty' },
      { email: 'clubincharge1@ai.college.edu', password: 'club123', name: 'Prof. Alex Wilson', role: 'club_incharge' },
      { email: 'labincharge@ai.college.edu', password: 'lab123', name: 'Prof. Robert Wilson', role: 'lab_incharge' },
      { email: 'student1@ai.college.edu', password: 'student123', name: 'Alice Kumar', role: 'club_member' }
    ];

    for (const u of users) {
      const hashed = await bcrypt.hash(u.password, 10);
      const res = await db.collection('users').updateOne(
        { email: u.email },
        { $setOnInsert: { email: u.email, password: hashed, name: u.name, role: u.role, createdAt: new Date(), updatedAt: new Date() } },
        { upsert: true }
      );
      if (res && res.upsertedId) {
        const id = res.upsertedId._id ? res.upsertedId._id.toString() : res.upsertedId;
        console.log('Inserted:', u.email, 'id=', id);
      } else {
        console.log('Already exists:', u.email);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
})();
