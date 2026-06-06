import type { CSSProperties, ReactNode, RefObject } from 'react';
import { VehicleTrackingStatus } from './VehicleTrackingStatus';
import {
  BikeIcon,
  BusIcon,
  CarIcon,
  Chip,
  MapPinIcon,
  TrainIcon,
  WalkIcon
} from '@/components/ui';
import { formatDuration } from '@/services/routing';
import type { Location, Route, RouteLeg, Station, TravelMode } from '@/types';

interface RouteDetailsProps {
  route: Route;
  headingRef?: RefObject<HTMLHeadingElement>;
}

export function RouteDetails({ route, headingRef }: RouteDetailsProps) {
  const transferCount = getTransferCount(route.legs);
  const safetyScore = getBikeSafetyScore(route.legs);
  const headingId = `route-details-${route.label.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

  return (
    <section className="route-details" aria-labelledby={headingId}>
      <div className="route-details-header">
        <div>
          <h3 id={headingId} ref={headingRef} tabIndex={-1}>Selected itinerary: {route.label}</h3>
          <p>{route.summary}</p>
        </div>
        <span className="route-details-duration">{route.formattedDuration}</span>
      </div>

      <div className="route-details-stats" aria-label="Selected route totals">
        <span>
          <strong>{route.totalDistance.toFixed(1)} km</strong>
          Distance
        </span>
        <span>
          <strong>{transferCount}</strong>
          {transferCount === 1 ? 'Transfer' : 'Transfers'}
        </span>
        {safetyScore !== null && (
          <span>
            <strong>{safetyScore}</strong>
            Bike safety
          </span>
        )}
      </div>

      {route.isFuture && (
        <div className="route-details-future">
          <Chip tone="future">Future preview</Chip>
          <span>Available {route.expectedOpening || 'TBD'}</span>
        </div>
      )}

      {/* Vehicle Tracking Status (if applicable) */}
      <VehicleTrackingStatus route={route} />

      {/* Route Legs */}
      <ol className="route-legs" aria-label="Route segments">
        {route.legs.map((leg, index) => (
          <LegItem
            key={`${leg.mode}-${index}-${leg.duration}`}
            leg={leg}
            index={index}
            totalLegs={route.legs.length}
          />
        ))}
      </ol>
    </section>
  );
}

interface LegItemProps {
  leg: RouteLeg;
  index: number;
  totalLegs: number;
}

interface ModeMeta {
  label: string;
  icon: ReactNode;
}

function getPointName(point: Location | Station, fallback: string): string {
  if ('name' in point && point.name) return point.name;
  if ('display_name' in point && point.display_name) return point.display_name;
  return fallback;
}

function getLineName(leg: RouteLeg): string {
  if (!leg.line) return 'Transit';
  if (leg.line.startsWith('LADOT CE')) return leg.line;
  return leg.line.endsWith('Line') ? leg.line : `${leg.line} Line`;
}

function getModeMeta(mode: TravelMode): ModeMeta {
  switch (mode) {
    case 'bike':
      return { label: 'Bike', icon: <BikeIcon /> };
    case 'walk':
      return { label: 'Walk', icon: <WalkIcon /> };
    case 'transit':
      return { label: 'Rail', icon: <TrainIcon /> };
    case 'transit_bus':
      return { label: 'Commuter Express', icon: <BusIcon /> };
    case 'driving':
      return { label: 'Drive', icon: <CarIcon /> };
  }
}

function getTransferCount(legs: RouteLeg[]): number {
  return Math.max(0, legs.filter((leg) => leg.mode === 'transit' || leg.mode === 'transit_bus').length - 1);
}

function getBikeSafetyScore(legs: RouteLeg[]): number | null {
  const scores = legs
    .filter((leg) => leg.mode === 'bike' && leg.safety)
    .map((leg) => leg.safety!.score);

  if (scores.length === 0) return null;
  return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
}

function getInstruction(leg: RouteLeg): string {
  const toName = getPointName(leg.to, 'destination');

  switch (leg.mode) {
    case 'transit':
      return `Take ${getLineName(leg)} to ${toName}`;
    case 'bike':
      return `Bike to ${toName}`;
    case 'walk':
      return `Walk to ${toName}`;
    case 'transit_bus':
      return `Take ${getLineName(leg)} commuter express bus to ${toName}`;
    case 'driving':
      return `Drive to ${toName}`;
  }
}

function getWaitInfo(leg: RouteLeg): { text: string; isLive: boolean } | null {
  if (!leg.waitTime) return null;

  const minutes = Math.round(leg.waitTime / 60);

  if (leg.departureTime && (leg.isRealtimeSchedule || leg.isRealtime)) {
    const timeStr = leg.departureTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });

    const isLive = Boolean(leg.isRealtime);

    if (minutes < 1) return { text: `Departing now (${timeStr})`, isLive };
    if (minutes <= 15) return { text: `${minutes} min (${timeStr})`, isLive };
    return { text: `Next at ${timeStr}`, isLive };
  }

  if (minutes < 1) return { text: 'Arriving', isLive: false };
  return { text: `~${minutes} min wait`, isLive: false };
}

function getSafetyBadge(leg: RouteLeg): { label: string; tone: 'success' | 'warning' | 'danger' } | null {
  if (!leg.safety || leg.mode !== 'bike') return null;

  const score = leg.safety.score;
  if (score >= 70) return { label: `Safety ${score}`, tone: 'success' };
  if (score >= 40) return { label: `Safety ${score}`, tone: 'warning' };
  return { label: `Safety ${score}`, tone: 'danger' };
}

function getDelayTone(leg: RouteLeg): 'success' | 'warning' | 'danger' {
  if (leg.delayStatus === 'late') return 'danger';
  if (leg.delayStatus === 'early') return 'warning';
  return 'success';
}

function LegItem({ leg, index, totalLegs }: LegItemProps) {
  const mode = getModeMeta(leg.mode);
  const waitInfo = leg.mode === 'transit' || leg.mode === 'transit_bus' ? getWaitInfo(leg) : null;
  const safetyBadge = getSafetyBadge(leg);
  const fromName = getPointName(leg.from, index === 0 ? 'Origin' : 'Previous stop');
  const toName = getPointName(leg.to, index === totalLegs - 1 ? 'Destination' : 'Next stop');
  const lineStyle = leg.color
    ? ({ '--route-line-color': leg.color } as CSSProperties)
    : undefined;
  const stopCount = leg.stations && leg.stations.length > 1 ? leg.stations.length - 1 : null;

  return (
    <li className={`route-leg route-leg--${leg.mode}`}>
      <div className="route-leg-marker" aria-hidden="true">
        <span className="route-leg-icon" style={lineStyle}>
          {mode.icon}
        </span>
      </div>

      <div className="route-leg-content">
        <div className="route-leg-heading">
          <span className="route-leg-mode">{mode.label}</span>
          <span className="route-leg-instruction">{getInstruction(leg)}</span>
        </div>

        <div className="route-leg-endpoints">
          <MapPinIcon />
          <span>{fromName}</span>
          <span aria-hidden="true">to</span>
          <span>{toName}</span>
        </div>

        <div className="route-leg-details">
          <span>{leg.distance.toFixed(1)} km</span>
          <span>{formatDuration(leg.duration)}</span>

          {(leg.mode === 'transit' || leg.mode === 'transit_bus') && (
            <span className="route-line-chip" style={lineStyle}>
              {getLineName(leg)}
            </span>
          )}

          {stopCount !== null && (
            <span>
              {stopCount} stop{stopCount === 1 ? '' : 's'}
            </span>
          )}

          {waitInfo && (
            <Chip tone={waitInfo.isLive ? 'success' : 'neutral'} className="wait-time-badge">
              {waitInfo.isLive && <span>Live</span>}
              {waitInfo.text}
            </Chip>
          )}

          {leg.delayText && (
            <Chip tone={getDelayTone(leg)} className="delay-badge">
              {leg.delayText}
            </Chip>
          )}

          {leg.headsign && (
            <span className="route-leg-headsign">
              toward {leg.headsign}
            </span>
          )}

          {safetyBadge && (
            <Chip tone={safetyBadge.tone} className="safety-badge">
              {safetyBadge.label}
            </Chip>
          )}
        </div>
      </div>
    </li>
  );
}
