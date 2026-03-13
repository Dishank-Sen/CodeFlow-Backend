import mongoose from "mongoose";
import dotenv from "dotenv";
import { AdminAccount } from "../src/models/admin/index.ts";
import { hashPassword } from "@codeflow/auth-utils";

dotenv.config();

async function initializeDatabase() {
  try {
    // Connect to MongoDB
    const dbUrl = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/codeflow";
    await mongoose.connect(dbUrl);
    console.log("✅ Connected to MongoDB");

    // Check if default admin exists
    const adminCount = await AdminAccount.countDocuments();
    if (adminCount === 0) {
      console.log("📝 Creating default SUPER_ADMIN user...");

      // Create default admin
      const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || "admin@123";
      const passwordHash = hashPassword(defaultPassword);

      const defaultAdmin = new AdminAccount({
        username: "admin",
        email: "admin@codeflow.dev",
        passwordHash,
        role: "SUPER_ADMIN",
        status: "active",
        loginAttempts: 0,
      });

      await defaultAdmin.save();
      console.log("✅ Default admin created!");
      console.log("   Username: admin");
      console.log("   Password: " + defaultPassword);
      console.log("   ⚠️  Change this password after first login!");
    } else {
      console.log(`✅ Found ${adminCount} admin account(s)`);
    }

    // Create indexes
    console.log("📝 Creating database indexes...");
    
    // AdminAccount indexes
    await AdminAccount.collection.createIndex({ username: 1 }, { unique: true });
    await AdminAccount.collection.createIndex({ email: 1 }, { unique: true });
    await AdminAccount.collection.createIndex({ role: 1 });
    await AdminAccount.collection.createIndex({ status: 1 });
    
    console.log("✅ Database initialization complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
}

initializeDatabase();
