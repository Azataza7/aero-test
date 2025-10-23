import { sequelize } from "../config/database";
import { seeder } from "../database/migrator";

const runSeeders = async () => {
  try {
    console.log("Starting database seeding...\n");

    await sequelize.authenticate();
    console.log("✓ Database connection established\n");

    const pendingSeeders = await seeder.pending();

    if (pendingSeeders.length === 0) {
      console.log("✓ No pending seeders\n");
    } else {
      console.log(`Found ${pendingSeeders.length} pending seeders:\n`);
      pendingSeeders.forEach((s) => console.log(`  - ${s.name}`));
      console.log("");

      await seeder.up();
      console.log("\n✓ All seeders completed successfully\n");
    }

    const executedSeeders = await seeder.executed();
    console.log("Executed seeders:");
    executedSeeders.forEach((s) => console.log(`  ✓ ${s.name}`));
    console.log("");

    await sequelize.close();
    console.log("✓ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("✗ Seeding failed:", error);
    await sequelize.close();
    process.exit(1);
  }
};

runSeeders();
