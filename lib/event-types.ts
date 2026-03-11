import { EventTypeConfig } from './types';

export const EVENT_TYPES: EventTypeConfig[] = [
  {
    id: 'lunch',
    name: 'BBQ Catering',
    description: 'Smoked meats, soulful sides, and everything BBQ',
    icon: '🔥',
    suggestedItems: ['rib tips', 'brisket', 'pulled pork', 'smoked chicken', 'mac n cheese'],
  },
  {
    id: 'dessert',
    name: 'Desserts & Drinks',
    description: 'Sweet endings and refreshing beverages',
    icon: '🍰',
    suggestedItems: ['banana pudding', 'peach cobbler', 'lemonade', 'cookies'],
  },
];

export function getEventTypeConfig(id: string): EventTypeConfig | undefined {
  return EVENT_TYPES.find((et) => et.id === id);
}

export function getEventTypeName(id: string): string {
  return getEventTypeConfig(id)?.name || id;
}
