import { useCallback } from 'react';
import { RouteOption } from './RouteOption';
import { RouteDetails } from './RouteDetails';
import { AlertIcon, CloseIcon, IconButton, Panel, VeloRailMark } from '@/components/ui';
import { useRouteStore, useUIStore } from '@/stores';
import type { Route } from '@/types';

export function ResultsSidebar() {
  const { routes, selectedRoute, selectRoute, isLoading, error } = useRouteStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const hasRoutes = routes.length > 0;

  const handleClose = useCallback(() => {
    setSidebarOpen(false);
    // Clear the selected route when closing the sidebar
    selectRoute(null);
  }, [setSidebarOpen, selectRoute]);

  const handleSelectRoute = useCallback((route: Route) => {
    selectRoute(route);
  }, [selectRoute]);

  return (
    <Panel
      as="aside"
      className={`results-sidebar ${sidebarOpen ? 'open' : ''}`}
      ariaLabel="Route results"
      isHidden={!sidebarOpen}
    >
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-title">
          <span className="search-logo">
            <VeloRailMark />
          </span>
          <div className="sidebar-title-copy">
            <span className="search-brand">VeloRail</span>
            <span className="sidebar-subtitle">Route results</span>
          </div>
        </div>
        <IconButton
          className="sidebar-close-btn"
          onClick={handleClose}
          title="Close"
          aria-label="Close route results"
        >
          <CloseIcon />
        </IconButton>
      </div>

      {/* Content */}
      <div className="sidebar-content">
        {isLoading && (
          <div className="route-results-state route-results-state--loading" role="status" aria-live="polite">
            <span className="loading-spinner" aria-hidden="true" />
            <div>
              <h3>Calculating route options</h3>
              <p>Comparing walk, bike, and transit segments.</p>
            </div>
          </div>
        )}

        {!isLoading && error && (
          <div className="route-results-state route-results-state--error" role="alert">
            <AlertIcon className="route-results-state__icon" />
            <div>
              <h3>Route search failed</h3>
              <p>{error}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && hasRoutes && (
          <>
            {/* Route Options */}
            <div className="route-options">
              <h3 className="route-options-heading">
                Route options
              </h3>
              {routes.map((route, index) => (
                <RouteOption
                  key={`${route.label}-${index}`}
                  route={route}
                  isSelected={selectedRoute?.label === route.label}
                  onClick={() => handleSelectRoute(route)}
                />
              ))}
            </div>

            {/* Selected Route Details */}
            {selectedRoute && <RouteDetails route={selectedRoute} />}
          </>
        )}

        {!isLoading && !error && !hasRoutes && sidebarOpen && (
          <div className="route-results-state route-results-state--empty">
            <VeloRailMark />
            <div>
              <h3>No routes calculated yet</h3>
              <p>Enter a start and destination to compare route options.</p>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
