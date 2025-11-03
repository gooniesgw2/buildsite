import pako from 'pako';
import type { BuildData } from '../types/gw2';

/**
 * Encode build data to a URL-safe base64 string
 */
export function encodeBuild(build: BuildData): string {
  try {
    const json = JSON.stringify(build);
    const compressed = pako.deflate(json);
    const base64 = btoa(String.fromCharCode(...compressed));
    // Make URL-safe
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch (error) {
    console.error('Failed to encode build:', error);
    throw error;
  }
}

/**
 * Decode build data from a URL-safe base64 string
 */
export function decodeBuild(encoded: string): BuildData {
  try {
    // Restore standard base64
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const decompressed = pako.inflate(bytes, { to: 'string' });
    return JSON.parse(decompressed);
  } catch (error) {
    console.error('Failed to decode build:', error);
    throw error;
  }
}

/**
 * Get shareable URL for current build
 */
export function getShareableUrl(build: BuildData): string {
  const encoded = encodeBuild(build);
  const url = new URL(window.location.href);
  url.searchParams.set('build', encoded);
  return url.toString();
}

/**
 * Load build from URL if present
 */
export function loadBuildFromUrl(): BuildData | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const buildParam = params.get('build');
    if (buildParam) {
      return decodeBuild(buildParam);
    }
  } catch (error) {
    console.error('Failed to load build from URL:', error);
  }
  return null;
}
