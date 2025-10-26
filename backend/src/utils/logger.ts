export type Level =
    'error' |
    'warn' |
    'info' |
    'http' |
    'verbose' |
    'debug';

function getTimestamp(): string {
    return new Date().toISOString();
}

export function log(message: string, level: Level = 'info'): void {
    const timestamp = getTimestamp();
    const logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    switch (level) {
        case 'error':
            console.error(logMessage);
            break;
        case 'warn':
            console.warn(logMessage);
            break;
        case 'debug':
            console.debug(logMessage);
            break;
        default:
            console.log(logMessage);
            break;
    }
}

export function logDebug(message: string): void {
    log(message, "debug");
}

export function logWarn(message: string): void {
    log(message, "warn");
}

export function logInfo(message: string): void {
    log(message, "info");
}

export function logError(message: string): void {
    log(message, "error");
}