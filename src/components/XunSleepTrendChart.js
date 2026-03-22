let sleepTrendChartInstance = null;

const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    return `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export function renderSleepTrendChart(records = []) {
    const container = document.getElementById('sleep-trend-chart');
    if (!container) return;

    if (sleepTrendChartInstance) {
        sleepTrendChartInstance.destroy();
        sleepTrendChartInstance = null;
    }

    container.innerHTML = '';

    if (typeof Chart === 'undefined') {
        container.innerHTML = '<p class="text-sm text-gray-500">图表组件未加载。</p>';
        return;
    }

    const sortedRecords = [...records]
        .filter((record) => record?.date && Number.isFinite(Number(record?.sleepDuration)))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-10);

    if (!sortedRecords.length) {
        container.innerHTML = '<p class="text-sm text-gray-500">最近10天暂无睡眠记录。</p>';
        return;
    }

    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    sleepTrendChartInstance = new Chart(canvas, {
        type: 'line',
        data: {
            labels: sortedRecords.map((record) => formatDateLabel(record.date)),
            datasets: [{
                label: '睡眠时长（小时）',
                data: sortedRecords.map((record) => Number(record.sleepDuration)),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                tension: 0.35,
                fill: true,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '睡眠时长'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '日期'
                    }
                }
            }
        }
    });
}
