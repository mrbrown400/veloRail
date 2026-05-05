import type { ModeFilter } from '@/types';

interface ModeSelectProps {
  value: ModeFilter;
  onChange: (mode: ModeFilter) => void;
}

export function ModeSelect({ value, onChange }: ModeSelectProps) {
  return (
    <select
      className="search-option-select"
      value={value}
      aria-label="Route mode"
      onChange={(e) => onChange(e.target.value as ModeFilter)}
    >
      <option value="all">All Options</option>
      <option value="bike">Bike + Rail</option>
      <option value="walk">Walk + Rail</option>
      <option value="driving">Driving</option>
    </select>
  );
}
