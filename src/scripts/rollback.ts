import { sequelize } from '../config/database';
import { migrator } from '../database/migrator';

const rollbackMigration = async () => {
  try {
    console.log('Rolling back last migration...\n');

    await sequelize.authenticate();
    console.log('✓ Database connection established\n');

    const executed = await migrator.executed();

    if (executed.length === 0) {
      console.log('✓ No migrations to rollback\n');
    } else {
      const lastMigration = executed[executed.length - 1];
      console.log(`Rolling back: ${lastMigration?.name}\n`);

      await migrator.down({ to: lastMigration?.name });
      console.log('✓ Migration rolled back successfully\n');
    }

    await sequelize.close();
    console.log('✓ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('✗ Rollback failed:', error);
    await sequelize.close();
    process.exit(1);
  }
};

rollbackMigration();