const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());



//подключение.
mongoose.connect('mongodb://mongodb:27017/currency_db')
    .then(() => console.log("База данных подключена"))
    .catch(err => console.error("Ошибка базы:", err));
   



//схема.
const historySchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    ip: String,
    date: String,
    rates: {
        USD: Number,
        EUR: Number,
        CNY: Number
    }
});

const History = mongoose.model('History', historySchema);

//запрос к ЦБ.
async function fetchRates(dateObj) {
    if (!dateObj || !(dateObj instanceof Date)) {
        dateObj = new Date();
    }


    const dateStr = dateObj.toLocaleDateString('ru-RU').split('.').join('/');
    const url = `https://www.cbr.ru/scripts/XML_daily.asp?date_req=${dateStr}`;

    try {
        const response = await axios.get(url);
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
        const json = parser.parse(response.data);

        if (!json.ValCurs || !json.ValCurs.Valute) {
            return { rates: { USD: 0, EUR: 0, CNY: 0 }, actualCbrDate: dateStr };
        }

        const rates = {};
        const valutes = Array.isArray(json.ValCurs.Valute) ? json.ValCurs.Valute : [json.ValCurs.Valute];

        valutes.forEach(v => {
            if (['USD', 'EUR', 'CNY'].includes(v.CharCode)) {
                const valStr = v.Value ? v.Value.toString() : "0";
                rates[v.CharCode] = parseFloat(valStr.replace(',', '.'));
            }
        });

        return { rates, actualCbrDate: json.ValCurs.Date };
    } catch (e) {
        console.error("Ошибка при запросе к ЦБ:", e.message);
        return { rates: { USD: 0, EUR: 0, CNY: 0 }, actualCbrDate: dateStr };
    }
}

// API получения курсов.
app.get('/api/v1/currency', async (req, res) => {
    try {
        console.log('Запрос курсов...');

        const current = await fetchRates(new Date());

        // Логика вчерашнего дня.
        const parts = current.actualCbrDate.split('.');
        const prevDay = new Date(parts[2], parts[1] - 1, parts[0]);
        prevDay.setDate(prevDay.getDate() - 1);

        const previous = await fetchRates(prevDay);

     
        const newRecord = new History({
            ip: req.ip || '127.0.0.1',
            date: current.actualCbrDate,
            rates: current.rates
        });
        await newRecord.save();

        res.json({
            date: current.actualCbrDate,
            rates: current.rates,
            previous: {
                date: previous.actualCbrDate,
                rates: previous.rates
            }
        });
    } catch (error) {
        console.error("Ошибка сервера:", error.message);
        res.status(500).json({ error: "Не удалось получить данные" });
    }
});

// API истории.
app.get('/api/v1/history', async (req, res) => {
    try {
        const history = await History.find().sort({ timestamp: -1 }).limit(10);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: "Ошибка при чтении истории" });
    }
});

app.get('/api/v1/chart-data', async (req, res) => {
    try {
        const dailyHistory = await History.aggregate([
            {
                $group: {

                    _id: "$date",
                    rates: { $first: "$rates" },

                    sortDate: { $first: "$timestamp" }
                }
            },
            { $sort: { sortDate: -1 } },
            { $limit: 10 }
        ]);


        if (!dailyHistory || dailyHistory.length === 0) {
            return res.json([]);
        }

        res.json(dailyHistory.reverse());
    } catch (err) {
        console.error("Ошибка агрегации:", err);
        res.status(500).json({ error: "Ошибка базы данных" });
    }
});

//Запуск сервера.

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n Сервер запущен на порту ${PORT}`);
    console.log(`Курсы: http://localhost:${PORT}/api/v1/currency`);
    console.log(`История: http://localhost:${PORT}/api/vi/history`);
})
