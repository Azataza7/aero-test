import { Sequelize } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';
import path from 'path';
import { sequelize } from '../config/database';

export const createMigrator = (sequelizeInstance: Sequelize) => {
  return new Umzug({
    migrations: {
      glob: ['migrations/*.ts', { cwd: path.join(__dirname) }],
      resolve: ({ name, path: migrationPath }) => {
        const migration = require(migrationPath || '');
        return {
          name,
          up: async () => migration.up(sequelizeInstance.getQueryInterface()),
          down: async () => migration.down(sequelizeInstance.getQueryInterface()),
        };
      },
    },
    context: sequelizeInstance.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize: sequelizeInstance }),
    logger: console,
  });
};

export const createSeeder = (sequelizeInstance: Sequelize) => {
  return new Umzug({
    migrations: {
      glob: ['seeders/*.ts', { cwd: path.join(__dirname) }],
      resolve: ({ name, path: seederPath }) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const seeder = require(seederPath || '');
        return {
          name,
          up: async () => seeder.up(sequelizeInstance.getQueryInterface()),
          down: async () => seeder.down(sequelizeInstance.getQueryInterface()),
        };
      },
    },
    context: sequelizeInstance.getQueryInterface(),
    storage: new SequelizeStorage({
      sequelize: sequelizeInstance,
      tableName: 'seeders_meta',
    }),
    logger: console,
  });
};

export const migrator = createMigrator(sequelize);
export const seeder = createSeeder(sequelize);