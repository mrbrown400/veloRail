import { useCallback } from 'react';
import { RouteOption } from './RouteOption';
import { RouteDetails } from './RouteDetails';
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
    <aside className={`results-sidebar ${sidebarOpen ? 'open' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-title">
          <span className="search-logo">{'\u{1F6B2}'} + {'\u{1F686}'}</span>
          <span className="search-brand">VeloRail</span>
        </div>
        <button
          className="sidebar-close-btn"
          onClick={handleClose}
          title="Close"
          type="button"
        >
          &times;
        </button>
      </div>

      {/* Content */}
      <div className="sidebar-content">
        {routes.length > 0 && (
          <>
            {/* Route Options */}
            <div className="route-options">
              <h3 style={{ padding: '16px 16px 8px', fontSize: '14px', color: '#5f6368' }}>
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
          <div style={{ padding: '24px', textAlign: 'center', color: '#5f6368' }}>
            No routes calculated yet.
          </div>
        )}
      </div>
    </aside>
  );
}
