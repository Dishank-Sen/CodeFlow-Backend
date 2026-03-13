import dotenv from "dotenv";
import mongoose from "mongoose";
import { AdminAccount, AdminSession } from "../src/models/admin/index.js";

dotenv.config();

async function cleanDatabase() {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/codeflow";

    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Delete all admin users
    console.log("\n🗑️  Deleting all admin users...");
    const adminResult = await AdminAccount.deleteMany({});
    console.log(`✅ Deleted ${adminResult.deletedCount} admin user(s)`);

    // Delete all admin sessions
    console.log("\n🗑️  Deleting all admin sessions...");
    const sessionResult = await AdminSession.deleteMany({});
    console.log(`✅ Deleted ${sessionResult.deletedCount} session(s)`);

    console.log("\n✨ Database cleaned successfully!");
    console.log("📝 Ready to start fresh with initDb.ts\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Database cleanup failed:", error);
    process.exit(1);
  }
}

cleanDatabase();
