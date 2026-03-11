'use client';

import { useState, KeyboardEvent } from 'react';

const SUGGESTED_TAGS = [
  'popular', 'vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'halal',
  'spicy', 'healthy', 'comfort', 'southern', 'classic', 'protein',
  'grab-and-go', 'interactive', 'hearty', 'cajun', 'bbq',
];

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({ tags, onChange }: TagInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter(t => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const availableSuggestions = SUGGESTED_TAGS.filter(t => !tags.includes(t) && t.includes(input.toLowerCase()));

  return (
    <div>
      <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg min-h-[44px] focus-within:ring-2 focus-within:ring-[#E8621A] focus-within:border-transparent">
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-sm">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={tags.length === 0 ? 'Add tags...' : ''}
          className="flex-1 min-w-[100px] outline-none text-base bg-transparent"
        />
      </div>
      {showSuggestions && availableSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {availableSuggestions.slice(0, 10).map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="text-xs px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              + {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
