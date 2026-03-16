'use client';

import { useCatering } from '@/context/CateringContext';
import { EVENT_TYPES } from '@/lib/event-types';
import EventTypeCard from './EventTypeCard';

export default function EventTypeStep() {
  const { state, dispatch } = useCatering();

  const handleSelect = (eventTypeId: string) => {
    dispatch({
      type: 'SET_EVENT_TYPE',
      payload: eventTypeId as 'breakfast' | 'lunch' | 'alacarte',
    });
  };

  return (
    <div className="animate-fade-up">
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-brown mb-4 font-display">
          What type of event are you catering?
        </h1>
        <p className="text-base sm:text-lg text-charcoal/70 max-w-2xl mx-auto">
          Select your event type to help us recommend the perfect items for your gathering
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
        {EVENT_TYPES.map((eventType, index) => (
          <div
            key={eventType.id}
            className="animate-scale-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <EventTypeCard
              eventType={eventType}
              isSelected={state.eventType === eventType.id}
              onSelect={() => handleSelect(eventType.id)}
            />
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-light-brown mt-8">
        Click on an event type to continue
      </p>
    </div>
  );
}
