import { Connection } from 'vscode-languageserver';
/**
 * Initializes the logger with a connection (upgrades from console logger)
 * @param connection - The language server connection
 */
export declare function initializeLogger(connection: Connection): void;
/**
 * Logs an informational message
 * @param message - The message to log
 */
export declare function log(message: string): void;
/**
 * Logs an error message
 * @param message - The error message to log
 */
export declare function logError(message: string): void;
/**
 * Logs an error with optional stack trace
 * @param error - The error object or message
 * @param context - Optional context string
 */
export declare function logErrorWithStack(error: unknown, context?: string): void;
//# sourceMappingURL=logger.d.ts.map