import type { TransportMode, WorkSettings } from '../types';

export const defaultWorkSettings: WorkSettings = {
  day: {
    workStart: '07:40',
    workEnd: '18:00',
    preShiftPrepMinutes: 45,
    departureBufferMinutes: 15,
    commuteToMinutes: 60,
    commuteToTransport: 'drive',
    postShiftPrepMinutes: 10,
    commuteFromMinutes: 60,
    commuteFromTransport: 'drive',
    postCommuteWindDownMinutes: 20,
    postNapBufferMinutes: 0,
  },
  night: {
    workStart: '17:40',
    workEnd: '08:00',
    preShiftPrepMinutes: 40,
    departureBufferMinutes: 10,
    commuteToMinutes: 60,
    commuteToTransport: 'drive',
    postShiftPrepMinutes: 15,
    commuteFromMinutes: 60,
    commuteFromTransport: 'drive',
    postCommuteWindDownMinutes: 30,
    postNapBufferMinutes: 20,
  },
};

export const transportOptions: readonly { value: TransportMode; label: string }[] = [
  { value: 'drive', label: '자가운전' },
  { value: 'transit', label: '대중교통' },
  { value: 'walk', label: '도보' },
  { value: 'bike', label: '자전거' },
  { value: 'other', label: '기타' },
];

export function copyWorkSettings(settings: WorkSettings): WorkSettings {
  return {
    day: { ...settings.day },
    night: { ...settings.night },
  };
}
