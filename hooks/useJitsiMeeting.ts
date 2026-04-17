import { useCallback } from 'react';

/**
 * Hook for managing Jitsi meeting operations
 * Provides utilities for creating meetings, generating room names, and handling meeting data
 */
export function useJitsiMeeting() {
  /**
   * Generate a unique room name
   * Format: meetme-{timestamp}-{random}
   */
  const generateRoomName = useCallback(() => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `meetme-${timestamp}-${random}`;
  }, []);

  /**
   * Parse room name to extract metadata
   */
  const parseRoomName = useCallback((roomName: string) => {
    const parts = roomName.split('-');
    return {
      prefix: parts[0],
      timestamp: parseInt(parts[1], 36),
      random: parts.slice(2).join('-'),
    };
  }, []);

  /**
   * Format display name safely (remove special chars that might cause issues)
   */
  const formatDisplayName = useCallback((name: string): string => {
    return name
      .replace(/[<>]/g, '') // Remove angle brackets
      .substring(0, 50) // Limit length
      .trim();
  }, []);

  /**
   * Validate Jitsi domain format
   */
  const isValidDomain = useCallback((domain: string): boolean => {
    try {
      // Remove protocol if present
      const cleanDomain = domain.replace(/^https?:\/\//, '');
      // Check basic domain format
      return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanDomain);
    } catch {
      return false;
    }
  }, []);

  return {
    generateRoomName,
    parseRoomName,
    formatDisplayName,
    isValidDomain,
  };
}
