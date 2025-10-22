import { sequelize } from "../config/database";
import { migrator, seeder } from "../database/migrator";

const resetDatabase = async () => {
  try {
    console.log("Resetting database...\n");

    await sequelize.authenticate();
    console.log("✓ Database connection established\n");

    // Откат всех сидеров
    console.log("Rolling back seeders...");
    await seeder.down({ to: 0 as any });
    console.log("✓ All seeders rolled back\n");

    // Откат всех миграций
    console.log("Rolling back migrations...");
    await migrator.down({ to: 0 as any });
    console.log("✓ All migrations rolled back\n");

    // Запуск миграций заново
    console.log("Running migrations...");
    await migrator.up();
    console.log("✓ Migrations completed\n");

    // Запуск сидеров заново
    console.log("Running seeders...");
    await seeder.up();
    console.log("✓ Seeders completed\n");

    await sequelize.close();
    console.log("✓ Database reset completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("✗ Database reset failed:", error);
    await sequelize.close();
    process.exit(1);
  }
};

resetDatabase();
