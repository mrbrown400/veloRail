import { VehicleTrackingStatus } from './VehicleTrackingStatus';
import { formatDuration } from '@/services/routing';
import type { Route, RouteLeg } from '@/types';

interface RouteDetailsProps {
  route: Route;
}

export function RouteDetails({ route }: RouteDetailsProps) {
  return (
    <div className="route-details">
      <div className="route-details-header">
        <h3>Route Details</h3>
        <p style={{ fontSize: '12px', color: '#5f6368' }}>
          {route.totalDistance.toFixed(1)} km total
        </p>
      </div>

      {/* Vehicle Tracking Status (if applicable) */}
      <VehicleTrackingStatus route={route} />

      {/* Route Legs */}
      <div className="route-legs">
        {route.legs.map((leg, index) => (
          <LegItem key={index} leg={leg} />
        ))}
      </div>
    </div>
  );
}

interface LegItemProps {
  leg: RouteLeg;
}

function LegItem({ leg }: LegItemProps) {
  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'bike': return '\u{1F6B2}';
      case 'transit': return '\u{1F686}';
      case 'driving': return '\u{1F697}';
      case 'transit_bus': return '\u{1F68C}';
      case 'walk': return '\u{1F6B6}';
      default: return '\u{1F4CD}';
    }
  };

  const getInstruction = () => {
    const toName = 'name' in leg.to ? leg.to.name : leg.to.display_name || 'Destination';

    switch (leg.mode) {
      case 'transit': {
        const lineName = leg.line?.endsWith('Line') ? leg.line : `${leg.line} Line`;
        return `Take ${lineName} to ${toName}`;
      }
      case 'bike':
        return `Bike to ${toName}`;
      case 'walk':
        return `Walk to ${toName}`;
      case 'transit_bus':
        return `Take Bus to ${toName}`;
      case 'driving':
        return `Drive to Destination`;
      default:
        return String(leg.mode).toUpperCase();
    }
  };

  const formatWaitTime = () => {
    if (!leg.waitTime) return null;

    const minutes = Math.round(leg.waitTime / 60);

    if (leg.departureTime && (leg.isRealtimeSchedule || leg.isRealtime)) {
      const timeStr = leg.departureTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      });

      const isLive = leg.isRealtime;

      if (minutes < 1) return { text: `Departing now (${timeStr})`, isLive };
      if (minutes <= 15) return { text: `${minutes} min (${timeStr})`, isLive };
      return { text: `Next at ${timeStr}`, isLive };
    }

    if (minutes < 1) return { text: 'arriving', isLive: false };
    return { text: `~${minutes} min wait`, isLive: false };
  };

  const getSafetyBadge = () => {
    if (!leg.safety || leg.mode !== 'bike') return null;

    const score = leg.safety.score;
    if (score >= 70) return { label: 'Safe', className: 'good' };
    if (score >= 40) return { label: 'Moderate', className: 'moderate' };
    return { label: 'Caution', className: 'poor' };
  };

  const waitInfo = leg.mode === 'transit' ? formatWaitTime() : null;
  const safetyBadge = getSafetyBadge();

  return (
    <div className="route-leg">
      <span className="route-leg-icon" style={leg.color ? { color: leg.color } : undefined}>
        {getModeIcon(leg.mode)}
      </span>
      <div className="route-leg-content">
        <div className="route-leg-instruction">{getInstruction()}</div>
        <div className="route-leg-details">
          {leg.distance.toFixed(1)} km
          {' \u2022 '}
          {formatDuration(leg.duration)}

          {waitInfo && (
            <span className={`wait-time-badge ${waitInfo.isLive ? 'live' : ''}`}>
              {waitInfo.isLive && <span style={{ marginRight: '4px' }}>LIVE</span>}
              {waitInfo.text}
            </span>
          )}

          {leg.headsign && (
            <span style={{ marginLeft: '8px', color: '#5f6368', fontSize: '12px' }}>
              toward {leg.headsign}
            </span>
          )}

          {safetyBadge && (
            <span className={`safety-badge ${safetyBadge.className}`}>
              {safetyBadge.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
