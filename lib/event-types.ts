import { EventTypeConfig } from './types';

export const EVENT_TYPES: EventTypeConfig[] = [
  {
    id: 'lunch',
    name: 'Build Your Event Menu',
    description: 'Pick your proteins, sides, and headcount — we handle the rest',
    icon: '🔥',
    suggestedItems: ['rib tips', 'brisket', 'pulled pork', 'smoked chicken', 'mac n cheese'],
  },
  {
    id: 'alacarte',
    name: 'Jump In and Order',
    description: 'Order exactly what you want, ready when your team is',
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
