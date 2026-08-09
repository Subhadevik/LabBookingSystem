import { getDatabase } from './db';
import bcrypt from 'bcrypt';

async function main() {
  try {
    const db = await getDatabase();

    const users = [
      { email: 'admin@ai.college.edu', password: 'admin123', name: 'AI Department Administrator', role: 'admin' },
      { email: 'faculty1@ai.college.edu', password: 'faculty123', name: 'Dr. Sarah Johnson', role: 'faculty' },
      { email: 'clubincharge1@ai.college.edu', password: 'club123', name: 'Prof. Alex Wilson', role: 'club_incharge' },
      { email: 'labincharge@ai.college.edu', password: 'lab123', name: 'Prof. Robert Wilson', role: 'lab_incharge', labId: undefined },
      { email: 'student1@ai.college.edu', password: 'student123', name: 'Alice Kumar', role: 'club_member' }
    ];

    for (const u of users) {
      const hashed = await bcrypt.hash(u.password, 10);
      const toUpsert: any = {
        email: u.email,
        password: hashed,
        name: u.name,
        role: u.role,
        updatedAt: new Date(),
      };
      if (u.labId) toUpsert.labId = u.labId;
      // Use upsert to ensure creation if missing
      const res = await db.collection('users').updateOne(
        { email: u.email },
        { $setOnInsert: { ...toUpsert, createdAt: new Date() } },
        { upsert: true }
      );

      if (res.upsertedId) {
        console.log('Inserted (upsert):', u.email, 'id=', res.upsertedId._id?.toString?.() || res.upsertedId);
      } else {
        console.log('Already existed:', u.email);
      }
    }

    console.log('Test user creation complete');
    process.exit(0);
  } catch (err) {
    console.error('Error creating test users:', err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
