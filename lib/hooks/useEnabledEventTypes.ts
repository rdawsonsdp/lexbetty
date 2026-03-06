'use client';

import { useState, useEffect } from 'react';
import { EVENT_TYPES } from '@/lib/event-types';
import { EventTypeConfig } from '@/lib/types';

export function useEnabledEventTypes(): { eventTypes: EventTypeConfig[]; loading: boolean } {
  const [disabledCategories, setDisabledCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.disabled_categories)) {
          setDisabledCategories(data.disabled_categories);
        }
      })
      .catch(() => {
        // On error, show all categories
      })
      .finally(() => setLoading(false));
  }, []);

  const eventTypes = EVENT_TYPES.filter((et) => !disabledCategories.includes(et.id));

  return { eventTypes, loading };
}

export function useDisabledCategories(): { disabledCategories: string[]; loading: boolean } {
  const [disabledCategories, setDisabledCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.disabled_categories)) {
          setDisabledCategories(data.disabled_categories);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { disabledCategories, loading };
}
