// migrate_v1_to_v2.js
import mongoose from "mongoose";

const argv = process.argv.slice(2);
const MONGOURI = argv[0] || process.env.MONGO_URI;
const APPLY = argv.includes("--apply"); // dry-run by default

if (!MONGOURI) throw new Error("Provide mongo URI as first arg");

await mongoose.connect(MONGOURI);
const coll = mongoose.connection.db.collection("users");

const filter = { $or: [{ schemaVersion: { $exists: false } }, { schemaVersion: { $ne: 2 } }] };

// aggregation-style update (MongoDB 4.2+)
const updatePipeline = [
  {
    $set: {
      bio: { $ifNull: ["$bio", ""] },
      followers: { $ifNull: ["$followers", []] },
      following: { $ifNull: ["$following", []] },
      schemaVersion: 2
    }
  }
];

if (!APPLY) {
  // dry-run: show count and a few projected docs
  const count = await coll.countDocuments(filter);
  console.log("Dry-run: documents to migrate:", count);
  const samples = await coll.aggregate([{ $match: filter }, { $limit: 5 }, ...updatePipeline]).toArray();
  console.log("Sample projected docs:", samples);
  await mongoose.disconnect();
  process.exit(0);
}

// actual apply
const res = await coll.updateMany(filter, updatePipeline);
console.log("updateMany result:", res.result || res);
await mongoose.disconnect();
