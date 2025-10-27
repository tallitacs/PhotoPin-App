// src/middleware/controllers/index.ts

// Define HttpServer interface based on what RootController uses
export interface HttpServer {
    get(path: string, handler: Function): void;
    post(path: string, handler: Function): void;
    put(path: string, handler: Function): void;
    delete(path: string, handler: Function): void;
    // Add other HTTP methods as needed
}

export interface Controller {
    initialize(httpServer: HttpServer): void;
}

// Export all controllers
export { PhotoController } from './PhotoController';