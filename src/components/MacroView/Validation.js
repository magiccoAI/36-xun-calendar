export class MacroViewValidator {
    static validatePeriod(period) {
        if (!period) {
            throw new Error('Period is required');
        }
        
        if (!period.index || typeof period.index !== 'number') {
            throw new Error('Period must have a valid index');
        }
        
        if (!period.startDate || !(period.startDate instanceof Date)) {
            throw new Error('Period must have a valid startDate');
        }
        
        if (!period.endDate || !(period.endDate instanceof Date)) {
            throw new Error('Period must have a valid endDate');
        }
        
        if (period.startDate > period.endDate) {
            throw new Error('Period startDate must be before endDate');
        }
        
        return true;
    }

    static validateUserData(userData) {
        if (!userData) {
            throw new Error('User data is required');
        }
        
        if (typeof userData !== 'object') {
            throw new Error('User data must be an object');
        }
        
        return true;
    }

    static validateGoal(goal) {
        // Handle null, undefined, and empty strings
        if (goal === null || goal === undefined || goal === '') {
            return true; // Empty goals are valid
        }
        
        if (typeof goal !== 'string') {
            throw new Error('Goal must be a string');
        }
        
        if (goal.length > 200) {
            throw new Error('Goal must be less than 200 characters');
        }
        
        return true;
    }

    static validateRemarks(remarks) {
        if (remarks && typeof remarks !== 'string') {
            throw new Error('Remarks must be a string');
        }
        
        if (remarks && remarks.length > 500) {
            throw new Error('Remarks must be less than 500 characters');
        }
        
        return true;
    }

    static validateContainer(container) {
        if (!container) {
            throw new Error('Container element is required');
        }
        
        if (!(container instanceof HTMLElement)) {
            throw new Error('Container must be an HTMLElement');
        }
        
        return true;
    }

    static sanitizeInput(input) {
        if (typeof input !== 'string') {
            return ''; // Handle null, undefined, and non-string inputs
        }
        
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/javascript:/gi, '') // Remove potential JS URLs
            .replace(/on\w+=/gi, ''); // Remove potential event handlers
    }

    static validateXunPeriods(xunPeriods) {
        if (!Array.isArray(xunPeriods)) {
            throw new Error('Xun periods must be an array');
        }
        
        if (xunPeriods.length === 0) {
            throw new Error('Xun periods array cannot be empty');
        }
        
        xunPeriods.forEach((period, index) => {
            try {
                this.validatePeriod(period);
            } catch (error) {
                throw new Error(`Invalid period at index ${index}: ${error.message}`);
            }
        });
        
        return true;
    }
}
