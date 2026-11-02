# Купидон — клиент

Веб-клиент для `kupidon-api`: React, TypeScript и Vite.

## Локальный запуск

Нужны Node.js 22 и запущенный [kupidon-api](https://github.com/gladunvv/kupidon-api).
Инструкция по запуску API находится в его README.

```sh
npm ci
cp .env.example .env
npm run dev
```

По умолчанию клиент обращается к HTTP API по `http://localhost:8000/v1`,
а Socket.IO подключается к `http://localhost:8000`.
Адреса задаются в `.env` через `VITE_API_URL` и `VITE_WS_URL`;
обе переменные обязательны. `.env` не коммитится.

Открыть адрес из вывода Vite (обычно `http://localhost:5173`).
Origin клиента должен быть разрешён в CORS API: авторизация использует cookie.

## Проверки

Перед коммитом выполнить те же проверки, что запускает CI:

```sh
npm run format:check
npm run lint
npm run build
```

`build` включает проверку TypeScript и сохраняет сборку в `dist/`.
Для локального просмотра сборки — `npm run preview`.
