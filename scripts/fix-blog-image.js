require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local', override: true });

const { getDb } = require('../lib/db');

async function main() {
  const db = await getDb();
  const result = await db.collection('blogs').updateOne(
    { slug: 'introductions-with-context-not-cold-ask' },
    {
      $set: {
        coverImageUrl: '/Assets/photos/team-meeting.jpg',
        imageUrl: '/Assets/photos/team-meeting.jpg'
      }
    }
  );
  console.log(result);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
