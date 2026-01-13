import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db';
import User from '../models/User';

dotenv.config();

const users = [
  { _id: 'u1', username: 'Alice' },
  { _id: 'u2', username: 'Bob' },
  { _id: 'u3', username: 'Charlie' },
  { _id: 'u4', username: 'David' },
];

const seedUsers = async () => {
  try {
    await connectDB();

    console.log('Seeding users...');
    
    // Upsert users
    for (const user of users) {
      await User.findByIdAndUpdate(user._id, user, { upsert: true, new: true });
    }

    console.log('Users seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
