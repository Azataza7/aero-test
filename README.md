# Aero

REST API

## 🚀 Технологии

- **Runtime**: Bun
- **Framework**: Express 5
- **Database**: MySQL 8
- **ORM**: Sequelize
- **Authentication**: JWT (jsonwebtoken)
- **Testing**: Bun test, Supertest
- **Container**: Docker & Docker Compose

## 📋 Требования

- [Bun](https://bun.sh/) >= 1.0
- [Docker](https://www.docker.com/) & Docker Compose
- MySQL 8 (через Docker)

## 🛠️ Установка

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd aero-test
```

### 2. Установка зависимостей

```bash
bun install
```

### 3. Настройка окружения

Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Основные переменные окружения:

```env
# Database
MYSQL_ROOT_PASSWORD: root
MYSQL_DATABASE: aero_database
MYSQL_USER: admin
MYSQL_PASSWORD: admin
MYSQL_PORT: 3306

# JWT
JWT_SECRET=13e2e956ed744c968461aa5c4914c8e961c78daaac4c4e2182
JWT_REFRESH_SECRET=e2e956ed744c968461aa5c4914c8e961c78daaac4c4e2182
JWT_EXPIRES_IN=10m

# Environment
NODE_ENV=development
BUN_ENV=development

# Uploads
UPLOAD_DIR=./uploads
```

### 4. Запуск базы данных

```bash
docker-compose up -d
```

### 5. Миграции и сиды

```bash
# Запуск миграций
bun run migrate

# Заполнение тестовыми данными
bun run seed
```

## 🎯 Запуск проекта

### Development режим с hot-reload

```bash
bun run dev
```

### Production режим

```bash
bun run start
```

API будет доступен по адресу: `http://localhost:3000`

## 📁 Структура проекта

```
aero-test/
├── src/
│   ├── config/         # Конфигурация приложения
│   ├── controllers/    # Контроллеры API
│   ├── database/       # Настройки БД
│   ├── middleware/     # Middleware функции
│   ├── models/         # Sequelize модели
│   ├── routes/         # Маршруты API
│   ├── scripts/        # Скрипты миграций и сидов
│   ├── tests/          # Тесты
│   └── utils/          # Утилиты
├── uploads/            # Загруженные файлы
├── .env                # Переменные окружения
├── docker-compose.yml  # Docker конфигурация
├── package.json        # Зависимости и скрипты
└── tsconfig.json       # TypeScript конфигурация
```

## 🧪 Тестирование

### Настройка тестовой базы данных

```bash
# Запуск скрипта настройки тестовой БД
bash setup-test-db.sh
```

Скрипт автоматически:
- Проверит Docker контейнер
- Создаст тестовую базу данных `aero_test`
- Создаст файл `.env.test` если его нет
- Выдаст необходимые права

### Запуск тестов

```bash
# Все тесты
bun test

# С отслеживанием изменений
bun run test:watch

# С покрытием кода
bun run test:coverage

# Тесты аутентификации
bun run test:auth

# Тесты файлов
bun run test:file

# Интеграционные тесты
BUN_ENV=test bun test src/tests/integration/
```

## 📜 Доступные скрипты

```bash
# Разработка
bun run dev              # Запуск с hot-reload

# Продакшн
bun run start            # Запуск приложения

# База данных
bun run migrate          # Применить миграции
bun run migrate:rollback # Откатить последнюю миграцию
bun run seed             # Заполнить БД тестовыми данными
bun run db:reset         # Сбросить БД
bun run db:setup         # migrate + seed

# Тестирование
bun test                 # Запуск всех тестов
bun run test:watch       # Тесты с watch mode
bun run test:coverage    # Тесты с покрытием
bun run test:auth        # Тесты аутентификации
bun run test:file        # Тесты файлов
```

## 🐳 Docker

### Запуск контейнеров

```bash
docker-compose up -d
```

### Остановка контейнеров

```bash
docker-compose down
```

### Просмотр логов

```bash
docker-compose logs -f
```

### Подключение к MySQL

```bash
docker exec -it mysql_db mysql -uadmin -padmin
```

## 🔐 API Endpoints

### Authentication

```
POST   /api/auth/register    # Регистрация пользователя
POST   /api/auth/login        # Вход
POST   /api/auth/refresh      # Обновление токена
POST   /api/auth/logout       # Выход
```

### File Management

```
POST   /api/files/upload      # Загрузка файла
GET    /api/files             # Список файлов
GET    /api/files/:id         # Получить файл
DELETE /api/files/:id         # Удалить файл
PUT    /api/files/:id         # Обновить файл
```

## 🔧 База данных

### Создание новой миграции

```bash
bun run sequelize-cli migration:generate --name migration-name
```

### Создание нового сида

```bash
bun run sequelize-cli seed:generate --name seed-name
```

## 📝 Переменные окружения

### Development (.env)

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=aero_dev
DB_USER=admin
DB_PASSWORD=admin
DB_DIALECT=mysql

JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRES_IN=10m

NODE_ENV=development
BUN_ENV=development
UPLOAD_DIR=./uploads
```

### Test (.env.test)

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=aero_test
DB_USER=admin
DB_PASSWORD=admin
DB_DIALECT=mysql

JWT_SECRET=13e2e956ed744c968461aa5c4914c8e961c78daaac4c4e2182
JWT_REFRESH_SECRET=e2e956ed744c968461aa5c4914c8e961c78daaac4c4e2182
JWT_EXPIRES_IN=10m

NODE_ENV=test
BUN_ENV=test

UPLOAD_DIR=./test-uploads

```

### Проблемы с миграциями

```bash
# Откатите все миграции
bun run migrate:rollback

# Примените заново
bun run migrate
```