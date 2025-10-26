import { networkInterfaces } from 'os';

interface NetworkInterfaceInfo {
    family: string;
    internal: boolean;
    address: string;
}

export function myIPv4(): string {
    const nets = networkInterfaces();
    
    if (!nets) {
        return 'localhost';
    }

    for (const name of Object.keys(nets)) {
        const interfaces = nets[name];
        if (!interfaces) continue;

        for (const net of interfaces) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    
    return 'localhost';
}