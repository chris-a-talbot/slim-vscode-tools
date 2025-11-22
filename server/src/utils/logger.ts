import { Connection } from 'vscode-languageserver';

/**
 * Logger interface that abstracts logging operations
 */
interface Logger {
    log(message: string): void;
    error(message: string): void;
}

/**
 * Console-based logger (fallback when connection is not available)
 */
class ConsoleLogger implements Logger {
    private readonly prefix = '[SLiM Language Server]';

    log(message: string): void {
        console.log(`${this.prefix} ${message}`);
    }

    error(message: string): void {
        console.error(`${this.prefix} ${message}`);
    }
}

/**
 * Connection-based logger (preferred when connection is available)
 */
class ConnectionLogger implements Logger {
    constructor(private readonly connection: Connection) {}

    log(message: string): void {
        this.connection.console.log(message);
    }

    error(message: string): void {
        this.connection.console.error(message);
    }
}

// Global logger instance (initialized as console logger, can be upgraded to connection logger)
let logger: Logger = new ConsoleLogger();

/**
 * Initializes the logger with a connection (upgrades from console logger)
 * @param connection - The language server connection
 */
export function initializeLogger(connection: Connection): void {
    logger = new ConnectionLogger(connection);
}

/**
 * Logs an informational message
 * @param message - The message to log
 */
export function log(message: string): void {
    logger.log(message);
}

/**
 * Logs an error message
 * @param message - The error message to log
 */
export function logError(message: string): void {
    logger.error(message);
}

/**
 * Logs an error with optional stack trace
 * @param error - The error object or message
 * @param context - Optional context string
 */
export function logErrorWithStack(error: unknown, context?: string): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const prefix = context ? `${context}: ` : '';
    
    logger.error(`${prefix}${errorMessage}`);
    if (errorStack) {
        logger.error(`Stack: ${errorStack}`);
    }
}

