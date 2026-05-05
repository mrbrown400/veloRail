import { useCallback } from 'react';
import { RouteOption } from './RouteOption';
import { RouteDetails } from './RouteDetails';
import { CloseIcon, IconButton, Panel, VeloRailMark } from '@/components/ui';
import { useRouteStore, useUIStore } from '@/stores';
import type { Route } from '@/types';

export function ResultsSidebar() {
  const { routes, selectedRoute, selectRoute } = useRouteStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

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
          <span className="search-brand">VeloRail</span>
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
        {routes.length > 0 && (
          <>
            {/* Route Options */}
            <div className="route-options">
              <h3 className="route-options-heading">
                Route Options
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

        {routes.length === 0 && sidebarOpen && (
          <div className="empty-state">
            No routes calculated yet.
          </div>
        )}
      </div>
    </Panel>
  );
}
