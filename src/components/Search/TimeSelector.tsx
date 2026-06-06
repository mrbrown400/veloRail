import { useEffect, useState } from 'react';
import type { TimeMode } from '@/types';

interface TimeSelectorProps {
  value?: Date;
  timeMode: TimeMode;
  onChange: (date: Date) => void;
  onTimeModeChange: (mode: TimeMode) => void;
}

type SelectorMode = 'now' | 'scheduled';

function toDateTimeLocalValue(date: Date): string {
  const localDate = new Date(date);
  localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
  return localDate.toISOString().slice(0, 16);
}

export function TimeSelector({ value, timeMode, onChange, onTimeModeChange }: TimeSelectorProps) {
  const [selectorMode, setSelectorMode] = useState<SelectorMode>('now');
  const [customTime, setCustomTime] = useState('');

  useEffect(() => {
    setCustomTime(toDateTimeLocalValue(value || new Date()));
  }, [value]);

  const handleSelectorModeChange = (newMode: SelectorMode) => {
    setSelectorMode(newMode);
    if (newMode === 'now') {
      onTimeModeChange('departAt');
      onChange(new Date());
      return;
    }

    if (customTime) {
      onChange(new Date(customTime));
    }
  };

  const handleTimeModeChange = (newTimeMode: TimeMode) => {
    setSelectorMode('scheduled');
    onTimeModeChange(newTimeMode);
    if (customTime) {
      onChange(new Date(customTime));
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value;
    setCustomTime(timeValue);
    setSelectorMode('scheduled');
    if (timeValue) {
      onChange(new Date(timeValue));
    }
  };

  const scheduledLabel = timeMode === 'arriveBy' ? 'Arrival time' : 'Departure time';

  return (
    <div className="time-selector" aria-label="Route time controls">
      <fieldset className="time-selector-group time-selector-group--when">
        <legend className="sr-only">When to search</legend>
        <label className="time-option">
          <input
            type="radio"
            name="time-selector-mode"
            checked={selectorMode === 'now'}
            onChange={() => handleSelectorModeChange('now')}
          />
          <span>Leave now</span>
        </label>
        <label className="time-option">
          <input
            type="radio"
            name="time-selector-mode"
            checked={selectorMode === 'scheduled'}
            onChange={() => handleSelectorModeChange('scheduled')}
          />
          <span>Schedule</span>
        </label>
      </fieldset>

      <fieldset
        className="time-selector-group time-selector-group--time-mode"
        aria-label="Selected time means"
      >
        <legend className="time-mode-legend">Selected time means</legend>
        <label className="time-option time-option--pill">
          <input
            type="radio"
            name="route-time-mode"
            checked={timeMode === 'departAt'}
            onChange={() => handleTimeModeChange('departAt')}
          />
          <span>Depart at</span>
        </label>
        <label className="time-option time-option--pill">
          <input
            type="radio"
            name="route-time-mode"
            checked={timeMode === 'arriveBy'}
            onChange={() => handleTimeModeChange('arriveBy')}
          />
          <span>Arrive by</span>
        </label>
      </fieldset>

      {selectorMode === 'scheduled' && (
        <input
          type="datetime-local"
          className="custom-time-input"
          value={customTime}
          onChange={handleTimeChange}
          aria-label={scheduledLabel}
        />
      )}
    </div>
  );
}
