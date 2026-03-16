import { EventTypeConfig } from './types';

export const EVENT_TYPES: EventTypeConfig[] = [
  {
    id: 'lunch',
    name: 'Order Catering',
    description: 'Smoked meats, soulful sides, and everything BBQ',
    icon: '🔥',
    suggestedItems: ['rib tips', 'brisket', 'pulled pork', 'smoked chicken', 'mac n cheese'],
  },
  {
    id: 'alacarte',
    name: 'Order A La Carte',
    description: 'Pick exactly what you want from the full menu',
    icon: '🍽️',
    suggestedItems: ['brisket', 'pulled pork', 'rib tips', 'mac n cheese', 'banana pudding'],
  },
];

export function getEventTypeConfig(id: string): EventTypeConfig | undefined {
  return EVENT_TYPES.find((et) => et.id === id);
}

export function getEventTypeName(id: string): string {
  return getEventTypeConfig(id)?.name || id;
}
