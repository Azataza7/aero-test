import { QueryInterface } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const files = [
    {
      user_id: 'user1@example.com',
      filename: '1706180400000-abc123def456.pdf',
      original_name: 'Project_Proposal.pdf',
      extension: '.pdf',
      mime_type: 'application/pdf',
      size: 2457600, // ~2.4 MB
      upload_date: new Date('2024-01-25T10:30:00'),
    },
    {
      user_id: 'user1@example.com',
      filename: '1706266800000-def789ghi012.jpg',
      original_name: 'vacation_photo.jpg',
      extension: '.jpg',
      mime_type: 'image/jpeg',
      size: 4194304, // 4 MB
      upload_date: new Date('2024-01-26T14:15:00'),
    },
    {
      user_id: 'user1@example.com',
      filename: '1706353200000-jkl345mno678.docx',
      original_name: 'Resume_2024.docx',
      extension: '.docx',
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 524288, // 512 KB
      upload_date: new Date('2024-01-27T09:00:00'),
    },

    {
      user_id: 'user2@example.com',
      filename: '1708491600000-pqr901stu234.xlsx',
      original_name: 'Sales_Report_Q1.xlsx',
      extension: '.xlsx',
      mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 1048576, // 1 MB
      upload_date: new Date('2024-02-21T11:20:00'),
    },
    {
      user_id: 'user2@example.com',
      filename: '1708578000000-vwx567yza890.png',
      original_name: 'Logo_Design_v2.png',
      extension: '.png',
      mime_type: 'image/png',
      size: 3145728, // 3 MB
      upload_date: new Date('2024-02-22T16:45:00'),
    },
    {
      user_id: 'user2@example.com',
      filename: '1708664400000-bcd123efg456.zip',
      original_name: 'project_files.zip',
      extension: '.zip',
      mime_type: 'application/zip',
      size: 15728640, // 15 MB
      upload_date: new Date('2024-02-23T08:30:00'),
    },
    {
      user_id: 'user2@example.com',
      filename: '1708750800000-hij789klm012.txt',
      original_name: 'notes.txt',
      extension: '.txt',
      mime_type: 'text/plain',
      size: 8192, // 8 KB
      upload_date: new Date('2024-02-24T13:10:00'),
    },

    {
      user_id: '+996555123456',
      filename: '1710118800000-nop345qrs678.mp4',
      original_name: 'presentation_recording.mp4',
      extension: '.mp4',
      mime_type: 'video/mp4',
      size: 52428800, // 50 MB
      upload_date: new Date('2024-03-11T10:00:00'),
    },
    {
      user_id: '+996555123456',
      filename: '1710205200000-tuv901wxy234.pdf',
      original_name: 'Contract_Draft.pdf',
      extension: '.pdf',
      mime_type: 'application/pdf',
      size: 1572864, // 1.5 MB
      upload_date: new Date('2024-03-12T15:30:00'),
    },

    {
      user_id: 'admin@example.com',
      filename: '1704110400000-zab567cde890.sql',
      original_name: 'database_backup.sql',
      extension: '.sql',
      mime_type: 'application/sql',
      size: 10485760, // 10 MB
      upload_date: new Date('2024-01-02T00:00:00'),
    },
    {
      user_id: 'admin@example.com',
      filename: '1704196800000-fgh123ijk456.json',
      original_name: 'config.json',
      extension: '.json',
      mime_type: 'application/json',
      size: 4096, // 4 KB
      upload_date: new Date('2024-01-03T12:00:00'),
    },
    {
      user_id: 'admin@example.com',
      filename: '1704283200000-lmn789opq012.csv',
      original_name: 'user_data_export.csv',
      extension: '.csv',
      mime_type: 'text/csv',
      size: 2097152, // 2 MB
      upload_date: new Date('2024-01-04T09:15:00'),
    },

    {
      user_id: '+996777654321',
      filename: '1712325600000-rst345uvw678.pptx',
      original_name: 'Marketing_Strategy.pptx',
      extension: '.pptx',
      mime_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      size: 8388608, // 8 MB
      upload_date: new Date('2024-04-06T14:20:00'),
    },
    {
      user_id: '+996777654321',
      filename: '1712412000000-xyz901abc234.mp3',
      original_name: 'podcast_episode_01.mp3',
      extension: '.mp3',
      mime_type: 'audio/mpeg',
      size: 6291456, // 6 MB
      upload_date: new Date('2024-04-07T10:45:00'),
    },
  ];

  await queryInterface.bulkInsert('files', files);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.bulkDelete('files', {});
};