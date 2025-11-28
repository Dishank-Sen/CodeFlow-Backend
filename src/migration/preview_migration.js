// preview_migration.js
import mongoose from "mongoose";

const MONGOURI = process.argv[2] || process.env.MONGO_URI;
if (!MONGOURI) throw new Error("Provide mongo URI as first arg");

await mongoose.connect(MONGOURI);
const coll = mongoose.connection.db.collection("users");

// match docs that look like v1 (no schemaVersion or schemaVersion != 2)
const filter = { $or: [{ schemaVersion: { $exists: false } }, { schemaVersion: { $ne: 2 } }] };

// pipeline that shows the post-migration shape
const pipeline = [
  { $match: filter },
  { $limit: 5 },
  {
    $set: {
      bio: { $ifNull: ["$bio", ""] },
      followers: { $ifNull: ["$followers", []] },
      following: { $ifNull: ["$following", []] },
      schemaVersion: 2
    }
  },
  { $project: { fname:0, lname:0 } } // optional cleanup projection
];

const samples = await coll.aggregate(pipeline).toArray();
console.log("Sample projected documents (dry-run):", JSON.stringify(samples, null, 2));
await mongoose.disconnect();
