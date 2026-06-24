/**
 * Database Reset Script
 * Removes all registered users for a fresh start
 * Usage: node scripts/reset-database.js
 */

require('dotenv').config({ path: '.env.local' });

const { MongoClient } = require('mongodb');

async function resetDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const usersCollection = db.collection('users');

    console.log('\n⚠️  WARNING: About to remove ALL registered users from the database');
    console.log('========================================================');
    
    const count = await usersCollection.countDocuments();
    console.log(`Current user count: ${count}`);
    
    if (count === 0) {
      console.log('No users found. Database is already clean.');
      await client.close();
      process.exit(0);
    }

    // Use readline for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('\nType "RESET" to confirm deletion: ', async (answer) => {
      if (answer !== 'RESET') {
        console.log('Cancelled. No users were deleted.');
        rl.close();
        await client.close();
        process.exit(0);
      }

      console.log('\nRemoving all users...');
      const result = await usersCollection.deleteMany({});
      console.log(`✅ Successfully deleted ${result.deletedCount} user(s)`);
      
      const remaining = await usersCollection.countDocuments();
      console.log(`Remaining users: ${remaining}`);

      rl.close();
      await client.close();
      console.log('\nDatabase reset complete. Fresh start ready!');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.close();
    process.exit(1);
  }
}

resetDatabase();

resetDatabase();
