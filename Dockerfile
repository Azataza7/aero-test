# Используем официальный образ Bun
FROM oven/bun:latest

# Рабочая директория внутри контейнера
WORKDIR /app

# Копируем package.json (или bun.lockb) и устанавливаем зависимости
COPY bun.lockb package.json ./
RUN bun install --frozen-lockfile

# Копируем весь проект
COPY . .

# Порт, который слушает приложение
EXPOSE 3000

# Команда по умолчанию
CMD ["bun", "run", "start"]
