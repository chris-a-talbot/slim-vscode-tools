"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeLogger = initializeLogger;
exports.log = log;
exports.logError = logError;
exports.logErrorWithStack = logErrorWithStack;
/**
 * Console-based logger (fallback when connection is not available)
 */
class ConsoleLogger {
    constructor() {
        this.prefix = '[SLiM Language Server]';
    }
    log(message) {
        console.log(`${this.prefix} ${message}`);
    }
    error(message) {
        console.error(`${this.prefix} ${message}`);
    }
}
/**
 * Connection-based logger (preferred when connection is available)
 */
class ConnectionLogger {
    constructor(connection) {
        this.connection = connection;
    }
    log(message) {
        this.connection.console.log(message);
    }
    error(message) {
        this.connection.console.error(message);
    }
}
// Global logger instance (initialized as console logger, can be upgraded to connection logger)
let logger = new ConsoleLogger();
/**
 * Initializes the logger with a connection (upgrades from console logger)
 * @param connection - The language server connection
 */
function initializeLogger(connection) {
    logger = new ConnectionLogger(connection);
}
/**
 * Logs an informational message
 * @param message - The message to log
 */
function log(message) {
    logger.log(message);
}
/**
 * Logs an error message
 * @param message - The error message to log
 */
function logError(message) {
    logger.error(message);
}
/**
 * Logs an error with optional stack trace
 * @param error - The error object or message
 * @param context - Optional context string
 */
function logErrorWithStack(error, context) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const prefix = context ? `${context}: ` : '';
    logger.error(`${prefix}${errorMessage}`);
    if (errorStack) {
        logger.error(`Stack: ${errorStack}`);
    }
}
//# sourceMappingURL=logger.js.map