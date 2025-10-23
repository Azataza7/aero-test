#!/bin/bash

# 🚀 Скрипт настройки тестовой базы данных для Docker MySQL
# Использует ваши настройки из .env

echo "🔧 Настройка тестовой базы данных (Docker)..."
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Настройки из вашего .env
CONTAINER_NAME="mysql_db"
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="admin"
DB_PASSWORD="admin"
ROOT_PASSWORD="root"
TEST_DB="aero_test"

# Проверяем что Docker запущен
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker не установлен или не найден${NC}"
    exit 1
fi

# Проверяем что контейнер запущен
echo "🐳 Проверка Docker контейнера..."
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}❌ Контейнер $CONTAINER_NAME не запущен${NC}"
    echo "Запустите контейнер или проверьте имя контейнера"
    docker ps
    exit 1
fi

echo -e "${GREEN}✅ Контейнер $CONTAINER_NAME работает${NC}"

# Создаем тестовую БД через Docker
echo "🗄️  Создание базы данных $TEST_DB..."

# Пробуем создать БД через пользователя admin
docker exec -i $CONTAINER_NAME mysql -u$DB_USER -p$DB_PASSWORD <<EOF 2>/dev/null
CREATE DATABASE IF NOT EXISTS $TEST_DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SHOW DATABASES LIKE 'aero%';
EOF

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Не удалось создать через admin, пробуем через root...${NC}"

    # Создаем через root
    docker exec -i $CONTAINER_NAME mysql -uroot -p$ROOT_PASSWORD <<EOF
CREATE DATABASE IF NOT EXISTS $TEST_DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON $TEST_DB.* TO '$DB_USER'@'%';
FLUSH PRIVILEGES;
SHOW DATABASES LIKE 'aero%';
EOF

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ База данных $TEST_DB создана через root${NC}"
    else
        echo -e "${RED}❌ Не удалось создать БД${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ База данных $TEST_DB создана успешно${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Настройка завершена!${NC}"
echo ""

# Проверяем что .env.test существует
if [ ! -f .env.test ]; then
    echo -e "${YELLOW}⚠️  Файл .env.test не найден${NC}"
    echo "Создаём .env.test..."

    cat > .env.test << 'ENVEOF'
# .env.test
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
ENVEOF

    echo -e "${GREEN}✅ Файл .env.test создан${NC}"
else
    echo -e "${GREEN}✅ Файл .env.test существует${NC}"
fi

echo ""
echo "📋 Информация о базах данных:"
docker exec -i $CONTAINER_NAME mysql -u$DB_USER -p$DB_PASSWORD -e "SHOW DATABASES LIKE 'aero%';" 2>/dev/null || \
docker exec -i $CONTAINER_NAME mysql -uroot -p$ROOT_PASSWORD -e "SHOW DATABASES LIKE 'aero%';"

echo ""
echo -e "${GREEN}✅ Всё готово для запуска тестов!${NC}"
echo ""
echo "Запустите тесты командой:"
echo -e "${YELLOW}BUN_ENV=test bun test src/tests/integration/${NC}"