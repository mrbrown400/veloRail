import { useState, useCallback, useEffect, useRef } from 'react';
import {
  loadBikeSettings,
  saveBikeSettings,
  DEFAULT_BIKE_SETTINGS,
  type BikeSettings as BikeSettingsType
} from '@/services/bikeDurationService';
import { CloseIcon, IconButton } from '@/components/ui';
import { useUIStore } from '@/stores';

interface BikeSettingsProps {
  onSettingsChange?: (settings: BikeSettingsType) => void;
}

export function BikeSettings({ onSettingsChange }: BikeSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<BikeSettingsType>(DEFAULT_BIKE_SETTINGS);
  const {
    activeBottomSurface,
    openBikeSettingsSurface,
    closeBikeSettingsSurface
  } = useUIStore();
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const panelId = 'bike-settings-panel';
  const titleId = 'bike-settings-title';
  const speedId = 'bike-settings-speed';
  const weightId = 'bike-settings-weight';

  const openPanel = useCallback(() => {
    setIsOpen(true);
    openBikeSettingsSurface();
  }, [openBikeSettingsSurface]);

  const closePanel = useCallback(() => {
    setIsOpen(false);
    closeBikeSettingsSurface();
    window.requestAnimationFrame(() => {
      toggleRef.current?.focus();
    });
  }, [closeBikeSettingsSurface]);

  // Load settings on mount
  useEffect(() => {
    const saved = loadBikeSettings();
    setSettings(saved);
  }, []);

  useEffect(() => {
    if (isOpen && activeBottomSurface !== 'bike-settings') {
      setIsOpen(false);
    }
  }, [activeBottomSurface, isOpen]);

  useEffect(() => {
    if (!isOpen || activeBottomSurface !== 'bike-settings') return undefined;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      event.preventDefault();
      event.stopPropagation();
      closePanel();
    };

    window.addEventListener('keydown', closeOnEscape);

    return () => {
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [activeBottomSurface, closePanel, isOpen]);

  const handleSpeedChange = (value: number) => {
    const newSettings = { ...settings, baseSpeedKmh: value };
    setSettings(newSettings);
    saveBikeSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const handleWeightChange = (value: number) => {
    const newSettings = { ...settings, riderWeightKg: value };
    setSettings(newSettings);
    saveBikeSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const getSpeedLabel = (speed: number): string => {
    if (speed <= 15) return 'Casual';
    if (speed <= 20) return 'Moderate';
    if (speed <= 25) return 'Brisk';
    if (speed <= 30) return 'Fast';
    return 'Very Fast';
  };

  return (
    <div className="bike-settings">
      <button
        ref={toggleRef}
        type="button"
        className="bike-settings-toggle"
        onClick={() => {
          if (isOpen) {
            closePanel();
          } else {
            openPanel();
          }
        }}
        title="Bike Settings"
        aria-controls={panelId}
        aria-expanded={isOpen && activeBottomSurface === 'bike-settings'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v4m0 14v4m11-11h-4M5 12H1m16.95-6.95l-2.83 2.83M8.88 15.12l-2.83 2.83m0-11.31l2.83 2.83m8.24 8.24l2.83 2.83" />
        </svg>
        <span>Bike</span>
      </button>

      {isOpen && (
        <div
          id={panelId}
          className="bike-settings-panel"
          role="region"
          aria-labelledby={titleId}
          data-bottom-surface="bike-settings"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              closePanel();
            }
          }}
        >
          <div className="bike-settings-header">
            <span id={titleId}>Bike Settings</span>
            <IconButton
              className="bike-settings-close"
              onClick={closePanel}
              aria-label="Close bike settings"
            >
              <CloseIcon />
            </IconButton>
          </div>

          <div className="bike-settings-content">
            {/* Speed Slider */}
            <div className="setting-group">
              <label className="setting-label" htmlFor={speedId}>
                <span>Cruising Speed</span>
                <span className="setting-value">
                  {settings.baseSpeedKmh} km/h
                  <span className="setting-hint">({getSpeedLabel(settings.baseSpeedKmh)})</span>
                </span>
              </label>
              <input
                id={speedId}
                type="range"
                min="10"
                max="40"
                step="1"
                value={settings.baseSpeedKmh}
                onChange={(e) => handleSpeedChange(Number(e.target.value))}
                className="setting-slider"
                aria-valuetext={`${settings.baseSpeedKmh} kilometers per hour, ${getSpeedLabel(settings.baseSpeedKmh)}`}
              />
              <div className="slider-labels">
                <span>10</span>
                <span>25</span>
                <span>40</span>
              </div>
            </div>

            {/* Weight Slider */}
            <div className="setting-group">
              <label className="setting-label" htmlFor={weightId}>
                <span>Rider + Bike Weight</span>
                <span className="setting-value">{settings.riderWeightKg} kg</span>
              </label>
              <input
                id={weightId}
                type="range"
                min="50"
                max="150"
                step="5"
                value={settings.riderWeightKg}
                onChange={(e) => handleWeightChange(Number(e.target.value))}
                className="setting-slider"
              />
              <div className="slider-labels">
                <span>50 kg</span>
                <span>100 kg</span>
                <span>150 kg</span>
              </div>
            </div>

            <p className="settings-note">
              These settings adjust bike time estimates based on elevation changes.
              Heavier riders are slower uphill but similar downhill.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
