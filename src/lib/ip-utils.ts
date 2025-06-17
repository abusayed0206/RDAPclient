import { Address4, Address6 } from 'ip-address';

export type IPVersion = 'IPv4' | 'IPv6';

export interface IPValidationResult {
  isValid: boolean;
  version?: IPVersion;
  normalized?: string;
  error?: string;
}

/**
 * Validate and normalize an IP address
 */
export function validateIP(ip: string): IPValidationResult {
  try {
    // Remove any surrounding whitespace
    const cleanIP = ip.trim();
    
    // Try IPv4 first
    try {
      const ipv4 = new Address4(cleanIP);
      if (ipv4.isValid()) {
        return {
          isValid: true,
          version: 'IPv4',
          normalized: ipv4.address
        };
      }
    } catch (e) {
      // Not IPv4, try IPv6
    }
    
    // Try IPv6
    try {
      const ipv6 = new Address6(cleanIP);
      if (ipv6.isValid()) {
        return {
          isValid: true,
          version: 'IPv6',
          normalized: ipv6.address
        };
      }
    } catch (e) {
      // Not IPv6 either
    }
    
    return {
      isValid: false,
      error: 'Invalid IP address format'
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error'
    };
  }
}

/**
 * Check if an IP address is in a private range
 */
export function isPrivateIP(ip: string): boolean {
  const validation = validateIP(ip);
  if (!validation.isValid || !validation.normalized) return false;
  
  if (validation.version === 'IPv4') {
    const ipv4 = new Address4(validation.normalized);
    
    // Private IPv4 ranges:
    // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
    // 127.0.0.0/8 (loopback), 169.254.0.0/16 (link-local)
    const privateRanges = [
      new Address4('10.0.0.0/8'),
      new Address4('172.16.0.0/12'),
      new Address4('192.168.0.0/16'),
      new Address4('127.0.0.0/8'),
      new Address4('169.254.0.0/16')
    ];
    
    return privateRanges.some(range => ipv4.isInSubnet(range));
  }
  
  if (validation.version === 'IPv6') {
    const ipv6 = new Address6(validation.normalized);
    
    // Private IPv6 ranges:
    // fc00::/7 (unique local), fe80::/10 (link-local), ::1/128 (loopback)
    const privateRanges = [
      new Address6('fc00::/7'),
      new Address6('fe80::/10'),
      new Address6('::1/128')
    ];
    
    return privateRanges.some(range => ipv6.isInSubnet(range));
  }
  
  return false;
}

/**
 * Check if an IP address is reserved/special use
 */
export function isReservedIP(ip: string): boolean {
  const validation = validateIP(ip);
  if (!validation.isValid || !validation.normalized) return false;
  
  if (validation.version === 'IPv4') {
    const ipv4 = new Address4(validation.normalized);
    
    // Reserved IPv4 ranges
    const reservedRanges = [
      new Address4('0.0.0.0/8'),      // "This" network
      new Address4('224.0.0.0/4'),    // Multicast
      new Address4('240.0.0.0/4'),    // Reserved for future use
      new Address4('255.255.255.255/32') // Broadcast
    ];
    
    return reservedRanges.some(range => ipv4.isInSubnet(range));
  }
  
  if (validation.version === 'IPv6') {
    const ipv6 = new Address6(validation.normalized);
    
    // Reserved IPv6 ranges
    const reservedRanges = [
      new Address6('ff00::/8'),       // Multicast
      new Address6('::/128'),         // Unspecified
    ];
    
    return reservedRanges.some(range => ipv6.isInSubnet(range));
  }
  
  return false;
}

/**
 * Get the IP version
 */
export function getIPVersion(ip: string): IPVersion | null {
  const validation = validateIP(ip);
  return validation.isValid ? validation.version! : null;
}

/**
 * Convert IPv4 to integer for range calculations
 */
export function ipv4ToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

/**
 * Check if IPv4 is in CIDR range
 */
export function isIPv4InCIDR(ip: string, cidr: string): boolean {
  try {
    const ipv4 = new Address4(ip);
    const range = new Address4(cidr);
    return ipv4.isInSubnet(range);
  } catch {
    return false;
  }
}

/**
 * Check if IPv6 is in CIDR range
 */
export function isIPv6InCIDR(ip: string, cidr: string): boolean {
  try {
    const ipv6 = new Address6(ip);
    const range = new Address6(cidr);
    return ipv6.isInSubnet(range);
  } catch {
    return false;
  }
}
