import type { KeyboardEvent, ReactNode } from "react";
import {
  BikeIcon,
  BusIcon,
  CarIcon,
  Chip,
  FutureRailIcon,
  TrainIcon,
  WalkIcon,
} from "@/components/ui";
import type { Route, RouteLeg, TravelMode } from "@/types";

interface RouteOptionProps {
  route: Route;
  isSelected: boolean;
  onClick: () => void;
}

function getModeLabel(mode: TravelMode): string {
  switch (mode) {
    case "bike":
      return "Bike";
    case "walk":
      return "Walk";
    case "transit":
      return "Rail";
    case "transit_bus":
      return "Bus";
    case "driving":
      return "Drive";
  }
}

function getModeIcon(mode: TravelMode): ReactNode {
  switch (mode) {
    case "bike":
      return <BikeIcon />;
    case "walk":
      return <WalkIcon />;
    case "transit":
      return <TrainIcon />;
    case "transit_bus":
      return <BusIcon />;
    case "driving":
      return <CarIcon />;
  }
}

function getTransferCount(legs: RouteLeg[]): number {
  return Math.max(0, legs.filter((leg) => leg.mode === "transit").length - 1);
}

function hasCommuterExpressLeg(legs: RouteLeg[]): boolean {
  return legs.some((leg) => leg.line?.startsWith("LADOT CE "));
}

function getBikeSafetyScore(legs: RouteLeg[]): number | null {
  const scores = legs
    .filter((leg) => leg.mode === "bike" && leg.safety)
    .map((leg) => leg.safety!.score);

  if (scores.length === 0) return null;
  return Math.round(
    scores.reduce((total, score) => total + score, 0) / scores.length,
  );
}

export function RouteOption({ route, isSelected, onClick }: RouteOptionProps) {
  const isFuture = route.isFuture;
  const transferCount = getTransferCount(route.legs);
  const safetyScore = getBikeSafetyScore(route.legs);
  const hasCommuterExpress = hasCommuterExpressLeg(route.legs);
  const segmentLabels = route.legs.map((leg) => getModeLabel(leg.mode));

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`route-option ${isSelected ? "selected" : ""} ${isFuture ? "future" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${route.label}, ${route.formattedDuration}, ${route.totalDistance.toFixed(1)} kilometers`}
      onKeyDown={handleKeyDown}
    >
      {isFuture && (
        <Chip tone="future" className="future-route-badge">
          <FutureRailIcon />
          <span>Future Route Preview</span>
        </Chip>
      )}

      <div className="route-option-content">
        <div className="route-option-header">
          <div className="route-option-title">
            <span className="route-option-label">{route.label}</span>
            <span className="route-option-type">{route.type}</span>
            {hasCommuterExpress && (
              <Chip tone="neutral" className="commuter-express-badge">
                LADOT Commuter Express · peak estimate
              </Chip>
            )}
          </div>
          <span className="route-option-duration">
            {route.formattedDuration}
          </span>
        </div>

        <div
          className="route-mode-sequence"
          aria-label={`Segments: ${segmentLabels.join(", ")}`}
        >
          {route.legs.map((leg, index) => (
            <span
              key={`${leg.mode}-${index}`}
              className={`route-mode-step route-mode-step--${leg.mode}`}
              title={getModeLabel(leg.mode)}
            >
              {getModeIcon(leg.mode)}
            </span>
          ))}
        </div>

        {isFuture && (
          <div className="route-option-summary route-option-summary--future">
            <span>Available {route.expectedOpening || "TBD"}</span>
            {route.timeSavings && route.timeSavings > 0 && (
              <span className="route-option-savings">
                Save ~{route.timeSavings} min
              </span>
            )}
          </div>
        )}

        {!isFuture && (
          <div className="route-option-summary">{route.summary}</div>
        )}

        <div className="route-option-metrics" aria-label="Route metrics">
          <span>{route.totalDistance.toFixed(1)} km</span>
          <span>
            {transferCount === 0
              ? "No transfers"
              : `${transferCount} transfer${transferCount === 1 ? "" : "s"}`}
          </span>
          {safetyScore !== null && <span>Bike safety {safetyScore}</span>}
        </div>
      </div>
    </div>
  );
}
