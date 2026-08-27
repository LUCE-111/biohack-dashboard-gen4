import type { WorkSettings } from '../types';

export const defaultWorkSettings: WorkSettings = {
  day: {
    workStart: '07:40',
    workEnd: '18:00',
    commuteToMinutes: 60,
    commuteFromMinutes: 60,
  },
  night: {
    workStart: '17:40',
    workEnd: '08:00',
    commuteToMinutes: 60,
    commuteFromMinutes: 60,
  },
};

export function copyWorkSettings(settings: WorkSettings): WorkSettings {
  return {
    day: { ...settings.day },
    night: { ...settings.night },
  };
}
