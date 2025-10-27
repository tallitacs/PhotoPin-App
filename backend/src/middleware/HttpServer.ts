// Simple HttpServer interface for now
export interface HttpServer {
    get(path: string, handler: Function): void;
    post(path: string, handler: Function): void;
    put(path: string, handler: Function): void;
    delete(path: string, handler: Function): void;
    // Add other HTTP methods as needed
}