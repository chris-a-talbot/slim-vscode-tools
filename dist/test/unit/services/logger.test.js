"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const logger_1 = require("../../../src/utils/logger");
function createMockConnection() {
    return {
        console: {
            log: vitest_1.vi.fn(),
            error: vitest_1.vi.fn(),
        },
    };
}
(0, vitest_1.describe)('logger', () => {
    (0, vitest_1.it)('logs to console logger by default', () => {
        const spyLog = vitest_1.vi.spyOn(console, 'log').mockImplementation(() => { });
        const spyErr = vitest_1.vi.spyOn(console, 'error').mockImplementation(() => { });
        (0, logger_1.log)('info');
        (0, logger_1.logError)('oops');
        (0, vitest_1.expect)(spyLog).toHaveBeenCalled();
        (0, vitest_1.expect)(spyErr).toHaveBeenCalled();
        spyLog.mockRestore();
        spyErr.mockRestore();
    });
    (0, vitest_1.it)('uses connection logger after initialization', () => {
        const conn = createMockConnection();
        (0, logger_1.initializeLogger)(conn);
        (0, logger_1.log)('hello');
        (0, logger_1.logError)('bad');
        (0, vitest_1.expect)(conn.console.log).toHaveBeenCalledWith('hello');
        (0, vitest_1.expect)(conn.console.error).toHaveBeenCalledWith('bad');
    });
    (0, vitest_1.it)('logErrorWithStack logs message and stack', () => {
        const conn = createMockConnection();
        (0, logger_1.initializeLogger)(conn);
        const error = new Error('boom');
        (0, logger_1.logErrorWithStack)(error, 'context');
        const messages = conn.console.error.mock.calls.map((c) => c[0]);
        (0, vitest_1.expect)(messages.some((m) => m.includes('context: boom'))).toBe(true);
    });
});
//# sourceMappingURL=logger.test.js.map