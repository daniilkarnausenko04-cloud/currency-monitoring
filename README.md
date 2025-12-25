# Мониторинг курсов валют

Веб-приложение для отслеживания актуальных курсов валют (USD, EUR, CNY) по данным ЦБ РФ.

## Основные возможности
- **Актуальные данные**: Получение курсов валют на текущий и предыдущий рабочие дни.
- **Цветовая индикация**: Наглядное отображение роста или падения курса.
- **История запросов**: Сохранение последних 10 запросов в базу данных MongoDB (время, IP пользователя, курсы).
- **Графики**: Визуализация динамики курса при клике на карточку валюты.
- **Docker-контейнеризация**: Быстрый запуск всего стека одной командой.

## Стек технологий
- **Frontend**: Vue.js 3 (Composition API), Vite, Chart.js, Axios.
- **Backend**: Node.js, Express, Mongoose.
- **Database**: MongoDB.
- **DevOps**: Docker, Docker Compose.

## Как запустить проект

Для запуска вам понадобится только установленный **Docker** и **Docker Compose**.

1. **Клонируеем репозиторий**:
   git clone [https://github.com/daniilkarnausenko04-cloud/currency-monitoring.git](https://github.com/daniilkarnausenko04-cloud/currency-monitoring.git)
   cd CurrencyProject

Запустите проект:

docker-compose up --build
Откройте приложение: После завершения сборки приложение будет доступно по адресу:

Frontend: http://localhost:8080

Backend API: http://localhost:3000/api/v1/currency

Структура проекта
/frontend — Клиентская часть на Vue.js.

/backend — Серверная часть на Express.

docker-compose.yml — Конфигурация для запуска контейнеров (БД + Бэк + Фронт).

