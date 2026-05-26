import { useCallback, useEffect, useRef, useState } from 'react';
import { RouteOption } from './RouteOption';
import { RouteDetails } from './RouteDetails';
import { AlertIcon, Button, CloseIcon, IconButton, Panel, TransitIcon, VeloRailMark } from '@/components/ui';
import { useRouteStore, useUIStore } from '@/stores';
import type { Route } from '@/types';

const ROUTE_RESULTS_PANEL_ID = 'route-results-panel';
const ROUTE_RESULTS_TITLE_ID = 'route-results-title';

export function ResultsSidebar() {
  const { routes, selectedRoute, selectRoute, isLoading, error } = useRouteStore();
  const {
    sidebarOpen,
    routeSheetState,
    setRouteSheetState,
    openRouteSheet,
    closeRouteSheet
  } = useUIStore();
  const panelRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const routeDetailsHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const reopenButtonRef = useRef<HTMLButtonElement | null>(null);
  const [shouldFocusReopen, setShouldFocusReopen] = useState(false);
  const hasRoutes = routes.length > 0;
  const isNoRoute = Boolean(error && /^no route/i.test(error));
  const hasSelectedRoute = Boolean(selectedRoute);

  const handleClose = useCallback(() => {
    if (routeSheetState === 'full') {
      setRouteSheetState('half');
      return;
    }

    setShouldFocusReopen(true);
    closeRouteSheet();
  }, [closeRouteSheet, routeSheetState, setRouteSheetState]);

  const handleSelectRoute = useCallback((route: Route) => {
    selectRoute(route);
  }, [selectRoute]);

  const handleOpenRouteSheet = useCallback(() => {
    openRouteSheet('half');
  }, [openRouteSheet]);

  const handleShowItinerary = useCallback(() => {
    setRouteSheetState('full');
    window.requestAnimationFrame(() => {
      routeDetailsHeadingRef.current?.focus();
    });
  }, [setRouteSheetState]);

  useEffect(() => {
    if (!sidebarOpen) return;

    window.requestAnimationFrame(() => {
      headingRef.current?.focus();
    });
  }, [sidebarOpen]);

  useEffect(() => {
    if (sidebarOpen || !shouldFocusReopen) return;

    window.requestAnimationFrame(() => {
      reopenButtonRef.current?.focus();
      setShouldFocusReopen(false);
    });
  }, [shouldFocusReopen, sidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (document.getElementById('map-overlay-metadata-panel')) return;
      if (!panelRef.current?.contains(document.activeElement)) return;

      event.preventDefault();
      handleClose();
    };

    window.addEventListener('keydown', closeOnEscape);

    return () => {
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [handleClose, sidebarOpen]);

  return (
    <>
      <Panel
        as="aside"
        id={ROUTE_RESULTS_PANEL_ID}
        ref={panelRef}
        className={`results-sidebar ${sidebarOpen ? 'open' : ''}`}
        ariaLabelledBy={ROUTE_RESULTS_TITLE_ID}
        isHidden={!sidebarOpen}
        data-testid="route-results-sheet"
        data-route-sheet-state={routeSheetState}
      >
        {sidebarOpen && (
          <>
            {/* Header */}
            <div className="sidebar-header">
              <div className="sidebar-title">
                <span className="search-logo">
                  <VeloRailMark />
                </span>
                <div className="sidebar-title-copy">
                  <h2
                    id={ROUTE_RESULTS_TITLE_ID}
                    ref={headingRef}
                    className="search-brand sidebar-heading"
                    tabIndex={-1}
                  >
                    Route results
                  </h2>
                  <span className="sidebar-subtitle">
                    {hasRoutes ? `${routes.length} option${routes.length === 1 ? '' : 's'}` : 'Search feedback'}
                  </span>
                </div>
              </div>
              <IconButton
                className="sidebar-close-btn"
                onClick={handleClose}
                title={routeSheetState === 'full' ? 'Show route options' : 'Close route results'}
                aria-label={routeSheetState === 'full' ? 'Show route options' : 'Close route results'}
              >
                <CloseIcon />
              </IconButton>
            </div>

            {hasRoutes && hasSelectedRoute && (
              <div className="route-sheet-controls" aria-label="Route sheet view">
                <Button
                  className="route-sheet-control"
                  size="sm"
                  variant="ghost"
                  pressed={routeSheetState === 'half'}
                  onClick={() => setRouteSheetState('half')}
                >
                  Options
                </Button>
                <Button
                  className="route-sheet-control"
                  size="sm"
                  variant="ghost"
                  pressed={routeSheetState === 'full'}
                  onClick={handleShowItinerary}
                >
                  Itinerary
                </Button>
              </div>
            )}

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
                <div className={`route-results-state ${isNoRoute ? 'route-results-state--no-route' : 'route-results-state--error'}`} role="alert">
                  <AlertIcon className="route-results-state__icon" />
                  <div>
                    <h3>{isNoRoute ? 'No route options found' : 'Route search failed'}</h3>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              {!isLoading && !error && hasRoutes && (
                <>
                  {/* Route Options */}
                  <div className="route-options" aria-label="Available route options">
                    <h3 className="route-options-heading">
                      Route options
                    </h3>
                    {routes.map((route, index) => (
                      <RouteOption
                        key={`${route.label}-${index}`}
                        route={route}
                        isSelected={selectedRoute === route}
                        onClick={() => handleSelectRoute(route)}
                      />
                    ))}
                  </div>

                  {/* Selected Route Details */}
                  {selectedRoute && (
                    <div className="route-details-shell">
                      <RouteDetails route={selectedRoute} headingRef={routeDetailsHeadingRef} />
                    </div>
                  )}
                </>
              )}

              {!isLoading && !error && !hasRoutes && (
                <div className="route-results-state route-results-state--empty">
                  <VeloRailMark />
                  <div>
                    <h3>No routes calculated yet</h3>
                    <p>Enter a start and destination to compare route options.</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </Panel>

      {!sidebarOpen && hasRoutes && (
        <Button
          ref={reopenButtonRef}
          className="results-sidebar-reopen"
          variant="secondary"
          size="sm"
          aria-controls={ROUTE_RESULTS_PANEL_ID}
          aria-expanded={sidebarOpen}
          onClick={handleOpenRouteSheet}
          leftIcon={<TransitIcon />}
        >
          Show {routes.length} route{routes.length === 1 ? '' : 's'}
        </Button>
      )}
    </>
  );
}
