import { useState, useEffect } from 'react';

interface TimeSelectorProps {
  value?: Date;
  onChange: (date: Date) => void;
}

export function TimeSelector({ onChange }: TimeSelectorProps) {
  const [mode, setMode] = useState<'now' | 'depart'>('now');
  const [customTime, setCustomTime] = useState('');

  // Initialize custom time with current time
  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setCustomTime(now.toISOString().slice(0, 16));
  }, []);

  const handleModeChange = (newMode: 'now' | 'depart') => {
    setMode(newMode);
    if (newMode === 'now') {
      onChange(new Date());
    } else if (customTime) {
      onChange(new Date(customTime));
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value;
    setCustomTime(timeValue);
    if (timeValue) {
      onChange(new Date(timeValue));
    }
  };

  return (
    <div className="time-selector">
      <label className="time-option">
        <input
          type="radio"
          name="departure-time"
          checked={mode === 'now'}
          onChange={() => handleModeChange('now')}
        />
        <span>Leave now</span>
      </label>
      <label className="time-option">
        <input
          type="radio"
          name="departure-time"
          checked={mode === 'depart'}
          onChange={() => handleModeChange('depart')}
        />
        <span>Depart at</span>
      </label>
      {mode === 'depart' && (
        <input
          type="datetime-local"
          className="custom-time-input"
          value={customTime}
          onChange={handleTimeChange}
          aria-label="Departure time"
        />
      )}
    </div>
  );
}
