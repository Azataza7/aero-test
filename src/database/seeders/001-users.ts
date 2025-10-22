import { QueryInterface } from 'sequelize';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const users = [
    {
      id: 'user1@example.com',
      password: await bcrypt.hash('password123', SALT_ROUNDS),
      created_at: new Date('2024-01-15'),
    },
    {
      id: 'user2@example.com',
      password: await bcrypt.hash('password456', SALT_ROUNDS),
      created_at: new Date('2024-02-20'),
    },
    {
      id: '+996555123456',
      password: await bcrypt.hash('mobile123', SALT_ROUNDS),
      created_at: new Date('2024-03-10'),
    },
    {
      id: 'admin@example.com',
      password: await bcrypt.hash('admin2024', SALT_ROUNDS),
      created_at: new Date('2024-01-01'),
    },
    {
      id: '+996777654321',
      password: await bcrypt.hash('testpass', SALT_ROUNDS),
      created_at: new Date('2024-04-05'),
    },
  ];

  await queryInterface.bulkInsert('users', users);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.bulkDelete('users', {});
};