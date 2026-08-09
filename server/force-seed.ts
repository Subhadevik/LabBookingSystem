import { getDatabase } from './db';
import bcrypt from 'bcrypt';

async function main() {
  try {
    const db = await getDatabase();

    // Admin
    const adminEmail = 'admin@ai.college.edu';
    const existingAdmin = await db.collection('users').findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashed = await bcrypt.hash('admin123', 10);
      const res = await db.collection('users').insertOne({ email: adminEmail, password: hashed, name: 'AI Department Administrator', role: 'admin', createdAt: new Date(), updatedAt: new Date() });
      console.log('Inserted admin:', adminEmail, 'id=', res.insertedId.toString());
    } else {
      console.log('Admin already exists:', adminEmail);
    }

    // Faculty
    const faculty = { email: 'faculty1@ai.college.edu', name: 'Dr. Sarah Johnson', password: 'faculty123', role: 'faculty' };
    const existingFaculty = await db.collection('users').findOne({ email: faculty.email });
    if (!existingFaculty) {
      const hashed = await bcrypt.hash(faculty.password, 10);
      const res = await db.collection('users').insertOne({ email: faculty.email, password: hashed, name: faculty.name, role: 'faculty', createdAt: new Date(), updatedAt: new Date() });
      console.log('Inserted faculty:', faculty.email, 'id=', res.insertedId.toString());
    } else {
      console.log('Faculty exists:', faculty.email);
    }

    // Sample lab
    const labName = 'AI Research Lab';
    const existingLab = await db.collection('labs').findOne({ name: labName });
    if (!existingLab) {
      const res = await db.collection('labs').insertOne({ name: labName, capacity: 30, equipment: ['GPU'], isActive: true, createdAt: new Date(), updatedAt: new Date() });
      console.log('Inserted lab:', labName, 'id=', res.insertedId.toString());
    } else {
      console.log('Lab exists:', labName);
    }

    console.log('Force seed completed');
    process.exit(0);
  } catch (err) {
    console.error('Force seed error:', err);
    process.exit(1);
  }
}

main();
