import { store } from '../../core/State.js';
import { Calendar } from '../../core/Calendar.js';
import { CONFIG, DATA_VALIDATION_RULES, DAY_RECORD_SCHEMA } from '../../config.js';

/**
 * Base class for Modal tabs
 * Provides common functionality for state management, UI updates, and data validation
 */
export class ModalTabBase {
    constructor(tabName, modal) {
        this.tabName = tabName;
        this.modal = modal;
        this.tabState = {};
        this.isHydrating = false;
    }

    /**
     * Initialize the tab with saved data
     * @param {Object} savedData - Data to populate the tab with
     */
    hydrate(savedData) {
        this.isHydrating = true;
        this.loadSavedData(savedData);
        this.isHydrating = false;
    }

    /**
     * Load saved data into the tab
     * Override this method in subclasses
     * @param {Object} savedData - Data to load
     */
    loadSavedData(savedData) {
        // Override in subclasses
    }

    /**
     * Get the current state of the tab
     * @returns {Object} Current tab state
     */
    getState() {
        return this.tabState;
    }

    /**
     * Update the tab state
     * @param {Object} newState - New state to merge
     */
    setState(newState) {
        this.tabState = { ...this.tabState, ...newState };
    }

    /**
     * Reset the tab to its initial state
     */
    reset() {
        this.tabState = {};
        this.resetUI();
    }

    /**
     * Reset the tab UI to its initial state
     * Override this method in subclasses
     */
    resetUI() {
        // Override in subclasses
    }

    /**
     * Validate the tab data
     * @returns {Object} Validation result { valid: boolean, errors: string[] }
     */
    validate() {
        return { valid: true, errors: [] };
    }

    /**
     * Get the data to save from this tab
     * @returns {Object} Data to save
     */
    getSaveData() {
        return this.tabState;
    }

    /**
     * Mark that user has interacted with this tab
     * @param {string} field - Field that was interacted with
     */
    onInteraction(field) {
        this.modal.onCheckinInteraction(this.tabName, field);
    }

    /**
     * Sync state from UI
     * Override this method in subclasses
     */
    syncStateFromUI() {
        // Override in subclasses
    }

    /**
     * Check if the tab has any data
     * @returns {boolean} True if tab has data
     */
    hasData() {
        return Object.keys(this.tabState).length > 0;
    }

    /**
     * Get tab status indicator (for showing completion status)
     * @returns {Object} Status indicator { hasData: boolean, isComplete: boolean }
     */
    getStatusIndicator() {
        return {
            hasData: this.hasData(),
            isComplete: false // Override in subclasses if needed
        };
    }
}
