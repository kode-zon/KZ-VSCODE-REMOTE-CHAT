import * as os from 'os';

export interface NetworkInfo {
  hostname: string;
  ipAddress: string;
  port: number;
  url: string;
}

export class NetworkInfoService {
  static getLocalHostname(): string {
    return os.hostname();
  }

  static getLocalIPAddress(): string {
    const interfaces = os.networkInterfaces();
    
    // Try to get IPv4 address (prefer non-loopback)
    for (const name of Object.keys(interfaces)) {
      const iface = interfaces[name];
      if (!iface) continue;
      
      for (const addr of iface) {
        // Skip loopback and IPv6
        if (addr.family === 'IPv4' && addr.address !== '127.0.0.1') {
          return addr.address;
        }
      }
    }
    
    // Fallback to localhost
    return 'localhost';
  }

  static getNetworkInfo(port: number): NetworkInfo {
    const ip = this.getLocalIPAddress();
    const hostname = this.getLocalHostname();
    
    return {
      hostname,
      ipAddress: ip,
      port,
      url: `http://${ip}:${port}`,
    };
  }

  static getNetworkInfos(port: number): NetworkInfo[] {
    const infos: NetworkInfo[] = [];
    const hostname = this.getLocalHostname();
    
    // Add localhost
    infos.push({
      hostname: 'localhost',
      ipAddress: 'localhost',
      port,
      url: `http://localhost:${port}`,
    });

    // Add all IPv4 addresses
    const interfaces = os.networkInterfaces();
    const ips = new Set<string>();
    
    for (const name of Object.keys(interfaces)) {
      const iface = interfaces[name];
      if (!iface) continue;
      
      for (const addr of iface) {
        if (addr.family === 'IPv4' && addr.address !== '127.0.0.1') {
          ips.add(addr.address);
        }
      }
    }

    for (const ip of ips) {
      infos.push({
        hostname,
        ipAddress: ip,
        port,
        url: `http://${ip}:${port}`,
      });
    }

    return infos;
  }
}
