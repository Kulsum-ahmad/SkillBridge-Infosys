import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

async function fixDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Drop the problematic index
    await mongoose.connection.collection('applications').dropIndex('opportunity_id_1_volunteer_id_1');
    console.log('Dropped old index');

    // Delete invalid applications
    const result = await mongoose.connection.collection('applications').deleteMany({
      $or: [
        { opportunity: null },
        { user: null }
      ]
    });
    console.log('Deleted invalid applications:', result.deletedCount);

    // Create new correct index
    await mongoose.connection.collection('applications').createIndex(
      { opportunity: 1, user: 1 },
      { unique: true }
    );
    console.log('Created new index');

    console.log('Database fix completed');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixDatabase();