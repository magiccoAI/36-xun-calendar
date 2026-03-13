import { buildXunSummary, getRangeLabel } from '../core/XunSummary.js';
import { store } from '../core/State.js';

const emotionRows = (emotionFrequency) => {
    const entries = Object.entries(emotionFrequency).sort((a, b) => b[1] - a[1]);
    if (!entries.length) {
        return '<p class="text-sm text-gray-500">No emotion tags recorded in this Xun.</p>';
    }

    return `
        <div class="space-y-2">
            ${entries.map(([emotion, count]) => `
                <div class="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                    <span class="text-sm text-gray-700">${emotion}</span>
                    <span class="text-xs font-semibold text-gray-500">${count}</span>
                </div>
            `).join('')}
        </div>
    `;
};

export class SummaryView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render() {
        if (!this.container) return;

        const summary = buildXunSummary(new Date());
        const rangeLabel = getRangeLabel(summary.startDate, summary.endDate);

        this.container.innerHTML = `
            <div class="mx-auto w-full max-w-6xl p-4 md:p-8">
                <div class="mb-6 flex items-center justify-between">
                    <button data-action="go-detail" class="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition hover:border-blue-300 hover:text-blue-600">
                        ← Back
                    </button>
                    <div class="rounded-full bg-white px-4 py-1 text-xs text-gray-500 shadow-sm border border-gray-100">${rangeLabel}</div>
                </div>

                <header class="mb-8 text-center">
                    <h2 class="text-3xl font-light text-gray-800">本旬小结 · Xun Summary</h2>
                    <p class="mt-2 text-sm text-gray-500">${summary.recordCount} day(s) recorded in this Xun</p>
                </header>

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <section class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h3 class="mb-4 text-base font-medium text-gray-700">1. Overview</h3>
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div class="rounded-xl bg-gray-50 p-3"><p class="text-gray-500">Avg Sleep</p><p class="text-xl text-gray-800">${summary.avgSleep}h</p></div>
                            <div class="rounded-xl bg-gray-50 p-3"><p class="text-gray-500">Avg Energy</p><p class="text-xl text-gray-800">${summary.avgEnergy}</p></div>
                            <div class="rounded-xl bg-gray-50 p-3"><p class="text-gray-500">Total Exercise</p><p class="text-xl text-gray-800">${summary.totalExercise}m</p></div>
                            <div class="rounded-xl bg-gray-50 p-3"><p class="text-gray-500">Total Reading</p><p class="text-xl text-gray-800">${summary.totalReading}m</p></div>
                        </div>
                    </section>

                    <section class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h3 class="mb-4 text-base font-medium text-gray-700">2. Activity Frequency</h3>
                        <div class="space-y-2 text-sm text-gray-700">
                            <p>Exercise days: <strong>${summary.exerciseDays}</strong></p>
                            <p>Reading days: <strong>${summary.readingDays}</strong></p>
                            <p>Low-sleep days (&lt; 6h): <strong>${summary.lateSleepDays}</strong></p>
                        </div>
                    </section>

                    <section class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h3 class="mb-4 text-base font-medium text-gray-700">3. Emotion Distribution</h3>
                        ${emotionRows(summary.emotionFrequency)}
                    </section>

                    <section class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h3 class="mb-4 text-base font-medium text-gray-700">4. High Energy Days</h3>
                        <div class="space-y-2 text-sm text-gray-700">
                            <p>Days with energy ≥ 7: <strong>${summary.highEnergyDays}</strong></p>
                            <p>Avg sleep on high-energy days: <strong>${summary.highEnergyAverageSleep}h</strong></p>
                            <p>Avg exercise on high-energy days: <strong>${summary.highEnergyAverageExercise}m</strong></p>
                        </div>
                    </section>

                    <section class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:col-span-2">
                        <h3 class="mb-4 text-base font-medium text-gray-700">5. System Insights</h3>
                        <ul class="list-disc space-y-2 pl-5 text-sm text-gray-700">
                            ${summary.insights.map((insight) => `<li>${insight}</li>`).join('')}
                        </ul>
                    </section>
                </div>
            </div>
        `;

        this.container.querySelector('[data-action="go-detail"]')?.addEventListener('click', () => {
            store.setState({ currentView: 'detail' });
        });
    }
}
