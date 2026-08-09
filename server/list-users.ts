import { getDatabase } from './db';

async function main() {
  try {
    const db = await getDatabase();
    const users = await db.collection('users').find().toArray();
    console.log('Users in database:');
    for (const u of users) {
      console.log({ _id: u._id?.toString?.(), email: u.email, role: u.role, password: u.password ? '[hidden hashed]' : undefined });
    }
    const labs = await db.collection('labs').find().toArray();
    console.log('\nLabs in database:');
    for (const l of labs) {
      console.log({ _id: l._id?.toString?.(), name: l.name, isActive: l.isActive });
    }
    const clubs = await db.collection('clubs').find().toArray();
    console.log('\nClubs in database:');
    for (const c of clubs) {
      console.log({ _id: c._id?.toString?.(), name: c.name, clubInchargeId: c.clubInchargeId });
    }
    const bookings = await db.collection('bookings').find().toArray();
    console.log('\nBookings in database:');
    for (const b of bookings) {
      console.log({ _id: b._id?.toString?.(), labId: b.labId, userId: b.userId, date: b.date, startTime: b.startTime, status: b.status });
    }
    process.exit(0);
  } catch (err) {
    console.error('Error listing users:', err);
    process.exit(1);
  }
}

main();
