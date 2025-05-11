import { PresetEnvironment } from '../types/types';
import { presetEnvironments } from './presetEnvironments';

/**
 * Get a preset environment by key
 * @param presetKey The key of the preset environment to retrieve
 * @returns The preset environment or null if not found
 */
export const getPresetEnvironment = (presetKey: string): PresetEnvironment | null => {
  return presetEnvironments[presetKey] || null;
};
