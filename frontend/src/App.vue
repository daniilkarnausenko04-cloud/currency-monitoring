<template>
    <div class="app-container">
        <div class="content-wrapper">
            <h1 class="main-title">Мониторинг курсов</h1>

            <div class="currency-grid" v-if="currentRates">
                <div v-for="(val, code) in currentRates.rates"
                     :key="code"
                     class="currency-card"
                     @click="openChart(code)">
                    <div class="card-code">{{ code }}</div>
                    <div class="card-price">{{ val.toFixed(2) }} ₽</div>

                    <div class="card-diff" :class="getDiffClass(code)">
                        <span class="arrow-icon">{{ getDiffSymbol(code) }}</span>
                        <span class="diff-value">{{ Math.abs(getDiff(code)).toFixed(2) }}</span>
                    </div>
                </div>
            </div>

            <button @click="loadData" class="action-btn">Обновить данные</button>

            <div class="history-section">
                <h2 class="history-title">История запросов</h2>
                <div class="table-scroll">
                    <table class="history-table">
                        <thead>
                            <tr>
                                <th>Время</th>
                                <th>USD</th>
                                <th>EUR</th>
                                <th>CNY</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in history" :key="item._id">
                                <td>{{ formatTime(item.timestamp) }}</td>
                                <td class="bold">{{ item.rates?.USD }}</td>
                                <td class="bold">{{ item.rates?.EUR }}</td>
                                <td class="bold">{{ item.rates?.CNY }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <Transition name="fade">
            <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Динамика {{ selectedCurrency }}</h3>
                    </div>
                    <div class="chart-container">
                        <Line v-if="chartHistory.length > 0"
                              :data="chartData"
                              :options="chartOptions"
                              :key="selectedCurrency" />
                        <div v-else class="loading-spinner">Загрузка...</div>
                    </div>

                    <div class="modal-footer">
                        <button @click="closeModal" class="close-oval-btn">Закрыть</button>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup>
    import { ref, onMounted, computed } from 'vue'
    import axios from 'axios'
    import { Line } from 'vue-chartjs'
    import {
        Chart as ChartJS, Title, Tooltip, Legend, LineElement, LinearScale, CategoryScale, PointElement, Filler
    } from 'chart.js'

    ChartJS.register(Title, Tooltip, Legend, LineElement, LinearScale, CategoryScale, PointElement, Filler)

    const API_BASE = 'http://localhost:3000/api/v1'
    const currentRates = ref(null)
    const history = ref([])
    const chartHistory = ref([])
    const showModal = ref(false)
    const selectedCurrency = ref('')

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#8e8e93', font: { size: 10 } } },
            x: { grid: { display: false }, ticks: { color: '#8e8e93', font: { size: 10 } } }
        }
    }

    const loadData = async () => {
        try {
            const res = await axios.get(`${API_BASE}/currency`)
            currentRates.value = res.data
            const histRes = await axios.get(`${API_BASE}/history`)
            history.value = histRes.data
        } catch (err) { console.error(err) }
    }

    const openChart = async (code) => {
        selectedCurrency.value = code
        showModal.value = true
        try {
            const res = await axios.get(`${API_BASE}/chart-data`)
            chartHistory.value = res.data
        } catch (err) { console.error(err) }
    }

    const closeModal = () => { showModal.value = false; chartHistory.value = []; }

    const chartData = computed(() => {
        const validData = chartHistory.value.filter(h => (h.rates?.[selectedCurrency.value] || 0) > 0);
        if (!validData.length) return { labels: [], datasets: [] };
        return {
            labels: validData.map(h => h._id.split('.').slice(0, 2).join('.')),
            datasets: [{
                data: validData.map(h => h.rates?.[selectedCurrency.value]),
                borderColor: '#007aff',
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 3
            }]
        };
    });

    const getDiff = (code) => {
        const cur = currentRates.value?.rates[code] || 0;
        const prev = currentRates.value?.previous?.rates[code] || 0;
        return cur - prev;
    }
    const getDiffClass = (code) => getDiff(code) > 0 ? 'diff-up' : 'diff-down';
    const getDiffSymbol = (code) => getDiff(code) > 0 ? '▲' : '▼';
    const formatTime = (ts) => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'

    onMounted(loadData)
</script>

<style>
    :root {
        --bg-main: #f2f2f7;
        --bg-card: #ffffff;
        --accent: #007aff;
        --text: #1c1c1e;
        --text-secondary: #8e8e93;
        --border: #d1d1d6;
        --modal-overlay: rgba(255, 255, 255, 0.8);
    }

    @media (prefers-color-scheme: dark) {
        :root {
            --bg-main: #141417;
            --bg-card: #1c1c1e;
            --accent: #0a84ff;
            --text: #ffffff;
            --text-secondary: #8e8e93;
            --border: #2c2c2e;
            --modal-overlay: rgba(0, 0, 0, 0.9);
        }
    }

    html, body {
        background-color: var(--bg-main) !important;
        color: var(--text);
        margin: 0;
        padding: 0;
        width: 100%;
        min-height: 100%;

        overflow-x: hidden;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        -webkit-font-smoothing: antialiased;
       
        display: flex;
        justify-content: center;
    }

    .app-container {
        width: 100%;
        max-width: 500px; 
        min-height: 100vh;
        background-color: var(--bg-main);
        padding: 20px 16px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 0 auto;
    }

    .content-wrapper {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .main-title {
        text-align: center;
        margin-bottom: 25px;
        font-weight: 800;
        font-size: 1.7rem;
        letter-spacing: -0.5px;
        width: 100%;
    }


    .currency-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-bottom: 25px;
        width: 100%;
        box-sizing: border-box;
    }

    .currency-card {
        background: var(--bg-card);
        border-radius: 18px;
        padding: 15px 5px;
        text-align: center;
        border: 1px solid var(--border);
        cursor: pointer;
        transition: transform 0.1s ease, background-color 0.2s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }

       
        .currency-card:active {
            transform: scale(0.94);
            background-color: var(--bg-main);
        }

    .card-code {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text-secondary);
        margin-bottom: 4px;
        text-transform: uppercase;
    }

    .card-price {
        font-size: 1.15rem;
        font-weight: 800;
        color: var(--accent);
    }

    .card-diff {
        font-size: 0.75rem;
        font-weight: 700;
        margin-top: 8px; 
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: 8px;
        border: 1px solid transparent; 
    }

    .diff-up {
        color: #32d74b;
        background: rgba(50, 215, 75, 0.1);
    }

    .diff-down {
        color: #ff453a;
        background: rgba(255, 69, 58, 0.1); 
        
    }

   
    .action-btn {
        width: 100%;
        padding: 16px;
        background: var(--accent);
        border: none;
        border-radius: 16px;
        color: #ffffff;
        font-weight: 700;
        font-size: 1rem;
        margin-bottom: 30px;
        cursor: pointer;
        transition: opacity 0.2s ease;
    }

        .action-btn:active {
            opacity: 0.8;
            transform: scale(0.98);
        }

    .history-section {
        width: 100%;
    }

    .history-title {
        font-size: 1.2rem;
        margin-bottom: 15px;
        text-align: center;
        width: 100%;
    }

    .table-scroll {
        background: var(--bg-card);
        border-radius: 18px;
        overflow-x: auto; 
        border: 1px solid var(--border);
        width: 100%;
    }

    .history-table {
        width: 100%;
        border-collapse: collapse;
        min-width: 300px; 
    }

        .history-table th {
            background: rgba(0,0,0,0.02);
            padding: 12px 8px;
            font-size: 0.7rem;
            color: var(--text-secondary);
            text-transform: uppercase;
            border-bottom: 1px solid var(--border);
        }

        .history-table td {
            padding: 14px 8px;
            text-align: center;
            border-bottom: 1px solid var(--border);
            font-size: 0.9rem;
        }

        .history-table tr:last-child td {
            border-bottom: none;
        }

  
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--modal-overlay);
        backdrop-filter: blur(12px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }

    .modal-content {
        background: var(--bg-card);
        width: 90%;
        max-width: 400px;
        padding: 24px;
        border-radius: 32px;
        border: 1px solid var(--border);
        box-shadow: 0 15px 35px rgba(0,0,0,0.15);
        box-sizing: border-box;
    }

    .modal-header h3 {
        margin: 0;
        text-align: center;
        font-size: 1.2rem;
    }

    .chart-container {
        height: 220px;
        margin: 20px 0;
    }

    .modal-footer {
        display: flex;
        justify-content: center;
        width: 100%;
    }


    .close-oval-btn {
        background: var(--text); 
        color: var(--bg-card);
        border: none;
        padding: 14px 60px;
        border-radius: 100px; 
        font-weight: 700;
        font-size: 1rem;
        cursor: pointer;
        transition: transform 0.2s ease, opacity 0.2s ease;
    }

        .close-oval-btn:active {
            transform: scale(0.95);
            opacity: 0.9;
        }

    .fade-enter-active, .fade-leave-active {
        transition: opacity 0.25s ease;
    }

    .fade-enter-from, .fade-leave-to {
        opacity: 0;
    }

    @media (max-width: 480px) {
        .app-container {
            padding: 15px 12px;
        }

        .currency-grid {
            gap: 8px;
        }

        .card-price {
            font-size: 1.1rem;
        }
    }

    .app-container {
        width: 100%;
        max-width: 500px;
        min-height: 100vh;
        background-color: var(--bg-main);
        padding: 20px 16px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 0 auto;
        transition: max-width 0.3s ease; 
    }


    @media (min-width: 768px) {
        .app-container {
            max-width: 800px; 
            padding: 40px 20px;
        }

        .main-title {
            font-size: 2.5rem; 
            margin-bottom: 40px;
        }

        
        .currency-grid {
            gap: 20px;
            margin-bottom: 40px;
        }

        .currency-card {
            padding: 25px 10px;
            border-radius: 24px;
        }

            .currency-card:hover {
                border-color: var(--accent); 
                box-shadow: 0 8px 20px rgba(0,0,0,0.08);
            }

        .card-price {
            font-size: 1.5rem;
        }

        .action-btn {
            width: auto;
            min-width: 250px;
            padding: 18px 40px;
            border-radius: 20px;
            font-size: 1.1rem;
        }

        .history-table th, .history-table td {
            padding: 18px 20px;
            font-size: 1rem;
        }

        .history-title {
            font-size: 1.6rem;
            margin-top: 20px;
        }

        .modal-content {
            max-width: 600px;
            padding: 40px;
        }

        .chart-container {
            height: 350px;
        }
    }

    @media (max-width: 480px) {
        .app-container {
            padding: 15px 12px;
        }

        .currency-grid {
            gap: 8px;
        }

        .card-price {
            font-size: 1.1rem;
        }
    }
</style>