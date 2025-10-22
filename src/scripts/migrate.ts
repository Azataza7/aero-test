import { sequelize } from "../config/database";
import { migrator } from "../database/migrator";

const runMigrations = async () => {
  try {
    console.log("Starting database migrations...\n");

    // Подключение к БД
    await sequelize.authenticate();
    console.log("✓ Database connection established\n");

    // Запуск миграций
    const pendingMigrations = await migrator.pending();

    if (pendingMigrations.length === 0) {
      console.log("✓ No pending migrations\n");
    } else {
      console.log(`Found ${pendingMigrations.length} pending migrations:\n`);
      pendingMigrations.forEach((m) => console.log(`  - ${m.name}`));
      console.log("");

      await migrator.up();
      console.log("\n✓ All migrations completed successfully\n");
    }

    // Показываем выполненные миграции
    const executedMigrations = await migrator.executed();
    console.log("Executed migrations:");
    executedMigrations.forEach((m) => console.log(`  ✓ ${m.name}`));
    console.log("");

    await sequelize.close();
    console.log("✓ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("✗ Migration failed:", error);
    await sequelize.close();
    process.exit(1);
  }
};

runMigrations();
