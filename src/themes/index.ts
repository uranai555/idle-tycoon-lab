import type { ThemeConfig } from '../core/types';
import { junkRepairTheme } from './junkRepair';
import { aiSecretaryTheme } from './aiSecretary';
import { petRoomTheme } from './petRoom';

export const themes: Record<string, ThemeConfig> = {
  junk_repair: junkRepairTheme,
  ai_secretary: aiSecretaryTheme,
  pet_room: petRoomTheme,
};

export function getTheme(id: string): ThemeConfig | undefined {
  return themes[id];
}

export function getDefaultTheme(): ThemeConfig {
  return junkRepairTheme;
}

export type { ThemeConfig } from '../core/types';