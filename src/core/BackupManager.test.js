
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Define mocks BEFORE importing the modules that use them
jest.unstable_mockModule('./State.js', () => ({
    store: {
        getState: jest.fn(),
        setState: jest.fn()
    }
}));

jest.unstable_mockModule('../config.js', () => ({
    CONFIG: {
        STORAGE_KEYS: {
            USER_DATA: 'user_data',
            MACRO_GOALS: 'macro_goals'
        }
    }
}));

// Dynamic imports
const { BackupManager } = await import('./BackupManager.js');
const { store } = await import('./State.js');

describe('BackupManager', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock FileReader
        global.FileReader = class {
            readAsText(file) {
                if (file.content) {
                    this.onload({ target: { result: file.content } });
                } else {
                    this.onerror();
                }
            }
        };
    });

    describe('createBackup', () => {
        it('should create a valid backup JSON', () => {
            const mockState = {
                userData: { test: 1 },
                macroGoals: { goal: 'test' },
                customEmotions: [],
                customNourishments: []
            };
            store.getState.mockReturnValue(mockState);

            const json = BackupManager.createBackup();
            const parsed = JSON.parse(json);

            expect(parsed.version).toBe(BackupManager.CURRENT_VERSION);
            expect(parsed.timestamp).toBeDefined();
            expect(parsed.data).toEqual(mockState);
        });
    });

    describe('validateAndImport', () => {
        it('should reject if file is too large', async () => {
            const largeFile = { size: 6 * 1024 * 1024 };
            await expect(BackupManager.validateAndImport(largeFile))
                .rejects.toThrow('文件大小超过 5MB 限制');
        });

        it('should reject invalid JSON', async () => {
            const file = { size: 1000, content: '{ invalid json' };
            await expect(BackupManager.validateAndImport(file))
                .rejects.toThrow('无法解析 JSON 文件');
        });

        it('should reject missing version or data', async () => {
            const file = { size: 1000, content: JSON.stringify({ foo: 'bar' }) };
            await expect(BackupManager.validateAndImport(file))
                .rejects.toThrow('无效的备份文件格式');
        });

        it('should reject version mismatch', async () => {
            const content = {
                version: '0.9',
                data: {}
            };
            const file = { size: 1000, content: JSON.stringify(content) };
            await expect(BackupManager.validateAndImport(file))
                .rejects.toThrow('版本不兼容');
        });

        it('should reject missing required keys', async () => {
            const content = {
                version: BackupManager.CURRENT_VERSION,
                data: { userData: {} } // Missing macroGoals
            };
            const file = { size: 1000, content: JSON.stringify(content) };
            await expect(BackupManager.validateAndImport(file))
                .rejects.toThrow('无效的数据结构');
        });

        it('should resolve with data if valid', async () => {
            const validData = {
                userData: {},
                macroGoals: {},
                customEmotions: [],
                customNourishments: []
            };
            const content = {
                version: BackupManager.CURRENT_VERSION,
                data: validData
            };
            const file = { size: 1000, content: JSON.stringify(content) };
            
            const result = await BackupManager.validateAndImport(file);
            expect(result).toEqual(validData);
        });
    });

    describe('restoreData', () => {
        it('should update store with restored data', () => {
            const data = {
                userData: { restored: true },
                macroGoals: {},
                customEmotions: [],
                customNourishments: []
            };
            
            BackupManager.restoreData(data);
            
            expect(store.setState).toHaveBeenCalledWith({
                userData: data.userData,
                macroGoals: data.macroGoals,
                customEmotions: data.customEmotions,
                customNourishments: data.customNourishments
            });
        });
    });
});
