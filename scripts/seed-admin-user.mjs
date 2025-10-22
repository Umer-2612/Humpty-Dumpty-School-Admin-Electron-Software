import { connectToDatabase } from "../src/lib/mongoose.js";
import { ensureDefaultAdminUser } from "../src/server/services/userService.js";

async function run() {
  try {
    await connectToDatabase();
    const user = await ensureDefaultAdminUser();
    const username = user?.username || "admin";
    console.log(
      `✔️  Admin user "${username}" is ready to use with the configured password.`
    );
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed admin user:", error);
    process.exit(1);
  }
}

run();
