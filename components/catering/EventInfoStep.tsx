'use client';

import { useState, useEffect, useRef } from 'react';
import { useCatering } from '@/context/CateringContext';
import { EventInfo } from '@/lib/types';

type Phase = 'occasion' | 'datetime' | 'notes' | 'transition';

const OCCASION_SUGGESTIONS = ['Office Party', 'Wedding', 'Birthday', 'Corporate Lunch', 'Graduation', 'Family Reunion'];

const DELIVERY_TIMES = [
  '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM',
];

export default function EventInfoStep() {
  const { dispatch } = useCatering();
  const sectionRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<Phase>('occasion');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Track completed phases for summary display
  const [completedPhases, setCompletedPhases] = useState<Phase[]>([]);

  useEffect(() => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Scroll when phase changes
  useEffect(() => {
    setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [phase]);

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const advancePhase = (from: Phase, to: Phase) => {
    setCompletedPhases(prev => [...prev, from]);
    setPhase(to);
  };

  const handleOccasionNext = () => {
    advancePhase('occasion', 'datetime');
  };

  const handleDateTimeNext = () => {
    if (eventDate && eventTime) {
      advancePhase('datetime', 'notes');
    }
  };

  const handleFinish = () => {
    advancePhase('notes', 'transition');

    const eventInfo: EventInfo = {
      eventName: eventName || undefined,
      eventDate,
      eventTime,
      specialInstructions: specialInstructions || undefined,
    };

    // Brief pause to show transition message, then dispatch
    setTimeout(() => {
      dispatch({ type: 'SET_EVENT_INFO', payload: eventInfo });
    }, 2000);
  };

  const handleBack = () => {
    dispatch({ type: 'GO_BACK' });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
  };

  return (
    <div ref={sectionRef} className="bg-white py-12 sm:py-16 scroll-mt-4">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-10">
          <h2 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold text-[#1A1A1A] tracking-wider mb-4">
            TELL US ABOUT YOUR EVENT
          </h2>
          <p className="text-gray-600 text-base sm:text-lg">
            A few quick details so we can make everything perfect.
          </p>
        </div>

        <div className="space-y-6">
          {/* Completed phase summaries */}
          {completedPhases.includes('occasion') && phase !== 'occasion' && (
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-600 animate-fade-in">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{eventName ? `"${eventName}"` : 'Occasion set'}</span>
            </div>
          )}

          {completedPhases.includes('datetime') && phase !== 'datetime' && (
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-600 animate-fade-in">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{formatDate(eventDate)} at {eventTime}</span>
            </div>
          )}

          {/* Phase 1: Occasion */}
          {phase === 'occasion' && (
            <div className="animate-fade-in space-y-6">
              <h3 className="font-oswald text-2xl font-bold text-[#1A1A1A] tracking-wide">
                What&apos;s the occasion?
              </h3>
              <p className="text-gray-500 text-sm">Totally optional — helps us tailor the experience.</p>

              <div className="flex flex-wrap gap-2">
                {OCCASION_SUGGESTIONS.map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => setEventName(suggestion)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                      eventName === suggestion
                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#E8621A] hover:text-[#1A1A1A]'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={eventName}
                onChange={e => setEventName(e.target.value)}
                placeholder="Or type your own..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50 text-[#1A1A1A]"
              />

              <button
                onClick={handleOccasionNext}
                className="w-full bg-[#1A1A1A] text-white font-oswald font-bold px-8 py-4 rounded-lg hover:bg-gray-800 transition-colors text-lg tracking-wide"
              >
                {eventName ? 'NEXT' : 'SKIP'}
              </button>
            </div>
          )}

          {/* Phase 2: Date & Time */}
          {phase === 'datetime' && (
            <div className="animate-fade-in space-y-6">
              <h3 className="font-oswald text-2xl font-bold text-[#1A1A1A] tracking-wide">
                When is your event?
              </h3>

              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>All catering orders require a minimum of <strong>72 hours</strong> advance notice.</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  min={getMinDate()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50 text-[#1A1A1A]"
                />
                {eventDate && (() => {
                  const selected = new Date(eventDate + 'T00:00:00');
                  const now = new Date();
                  const hoursUntil = (selected.getTime() - now.getTime()) / (1000 * 60 * 60);
                  if (hoursUntil < 72) {
                    return (
                      <div className="flex items-start gap-3 p-4 mt-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 animate-fade-in">
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>This date is less than 72 hours away. We kindly request at least <strong>72 hours</strong> advance notice for catering orders. Please give us a call at <strong>(312) 600-8155</strong> to check availability for rush orders.</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {eventDate && (
                <div className="animate-fade-in">
                  <p className="font-oswald text-lg font-bold text-[#1A1A1A] mb-2">
                    And what time should we have everything ready?
                  </p>
                  <select
                    value={eventTime}
                    onChange={e => setEventTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50 text-[#1A1A1A]"
                  >
                    <option value="">Select a time...</option>
                    {DELIVERY_TIMES.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              )}

              {eventDate && eventTime && (
                <button
                  onClick={handleDateTimeNext}
                  className="w-full bg-[#1A1A1A] text-white font-oswald font-bold px-8 py-4 rounded-lg hover:bg-gray-800 transition-colors text-lg tracking-wide animate-fade-in"
                >
                  NEXT
                </button>
              )}
            </div>
          )}

          {/* Phase 3: Special Instructions */}
          {phase === 'notes' && (
            <div className="animate-fade-in space-y-6">
              <h3 className="font-oswald text-2xl font-bold text-[#1A1A1A] tracking-wide">
                Anything else we should know?
              </h3>
              <p className="text-gray-500 text-sm">
                Dietary needs, loading dock access, setup preferences — whatever helps us nail it.
              </p>

              <textarea
                value={specialInstructions}
                onChange={e => setSpecialInstructions(e.target.value)}
                rows={4}
                placeholder="e.g. Gluten-free options needed, use the service entrance on Oak St..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50 text-[#1A1A1A] resize-none"
              />

              <div className="flex gap-4">
                <button
                  onClick={handleFinish}
                  className="flex-1 bg-[#1A1A1A] text-white font-oswald font-bold px-8 py-4 rounded-lg hover:bg-gray-800 transition-colors text-lg tracking-wide"
                >
                  {specialInstructions ? 'CONTINUE' : 'SKIP & CONTINUE'}
                </button>
              </div>
            </div>
          )}

          {/* Phase 5: Transition */}
          {phase === 'transition' && (
            <div className="animate-fade-in text-center py-12">
              <h3 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold text-[#1A1A1A] tracking-wider animate-pulse">
                Ok. Let&apos;s plan your meal.
              </h3>
            </div>
          )}
        </div>

        {/* Back button (not shown during transition) */}
        {phase !== 'transition' && (
          <div className="mt-10 text-center">
            <button
              onClick={handleBack}
              className="font-oswald text-gray-500 hover:text-[#1A1A1A] transition-colors tracking-wide"
            >
              &larr; BACK TO EVENT TYPE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
