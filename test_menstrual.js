
// Mock LocalStorage and other browser globals BEFORE import
global.localStorage = {
  _data: {},
  getItem: function(key) { return this._data[key] || null; },
  setItem: function(key, value) { this._data[key] = value; },
  removeItem: function(key) { delete this._data[key]; }
};

// Mock CONFIG if needed, but State.js imports it. 
// Assuming CONFIG is pure JS object export, it should be fine.

async function runTest() {
    console.log("Starting Menstrual Logic Test...");
    
    // Dynamic import to ensure globals are set
    const { store } = await import('./src/core/State.js');

    // 1. Reset State
    // We need to inject initial state because constructor already ran with empty localStorage
    store.setState({ menstrualData: { cycles: [], avgLength: 28, avgDuration: 5, nextPrediction: null } });

    // 2. Add a cycle: 2026-01-01 to 2026-01-05
    console.log("Adding Cycle 1: 2026-01-01 Start");
    store.addPeriodStart('2026-01-01');
    store.addPeriodEnd('2026-01-05');

    let state = store.getState();
    console.log("Cycles:", JSON.stringify(state.menstrualData.cycles));
    console.log("Prediction:", JSON.stringify(state.menstrualData.nextPrediction));

    // Expect Prediction: 2026-01-01 + 28 days = 2026-01-29
    // Wait, initial avgLength is 28.
    // Logic: lastStart + avgLength.
    const expectedStart = '2026-01-29';
    if (state.menstrualData.nextPrediction && state.menstrualData.nextPrediction.start === expectedStart) {
        console.log("PASS: Prediction 1 correct.");
    } else {
        console.log("FAIL: Prediction 1 incorrect. Expected " + expectedStart + ", got " + (state.menstrualData.nextPrediction ? state.menstrualData.nextPrediction.start : 'null'));
    }

    // 3. Add another cycle: 2026-02-01 (Length = 31 days from Jan 1)
    console.log("Adding Cycle 2: 2026-02-01 Start");
    store.addPeriodStart('2026-02-01');
    store.addPeriodEnd('2026-02-06');

    state = store.getState();
    console.log("Avg Length:", state.menstrualData.avgLength);
    
    // Check if logic updated avgLength.
    // 2026-01-01 to 2026-02-01 is 31 days.
    // If logic works, avgLength should be 31.
    
    if (state.menstrualData.avgLength === 31) {
        console.log("PASS: Avg Length updated to 31.");
    } else {
        console.log("FAIL: Avg Length incorrect. Expected 31, got " + state.menstrualData.avgLength);
    }
    
    // Next prediction: Feb 1 + 31 days = March 4 (2026 is not leap year)
    // 2026-02-01 + 27 days = 2026-02-28.
    // + 4 days = 2026-03-04.
    const expectedStart2 = '2026-03-04';
    if (state.menstrualData.nextPrediction && state.menstrualData.nextPrediction.start === expectedStart2) {
        console.log("PASS: Prediction 2 correct.");
    } else {
        console.log("FAIL: Prediction 2 incorrect. Expected " + expectedStart2 + ", got " + (state.menstrualData.nextPrediction ? state.menstrualData.nextPrediction.start : 'null'));
    }

    console.log("Test Complete.");
}

runTest();
