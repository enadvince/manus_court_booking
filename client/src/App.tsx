import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, useEffect } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import {
  BackToTop,
  CookieBanner,
  OutboundLinkTagger,
  ScrollProgress,
  SkipLink,
} from "./components/site/SiteChrome";
import { SiteSearch } from "./components/site/SiteSearch";
import { ThemeProvider } from "./contexts/ThemeContext";
import { loadAnalytics, readConsent } from "./lib/consent";
import Home from "./pages/Home";

const NotFound = lazy(() => import("@/pages/NotFound"));

function PageLoader() {
  return (
    <div className="page-loader" role="status">
      <span className="boot-ball" aria-hidden="true" />
      <span>LOADING</span>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/admin"} component={Home} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

/** Opens collapsed FAQ answers while printing, then restores them. */
function usePrintExpandsDetails() {
  useEffect(() => {
    let opened: HTMLDetailsElement[] = [];
    const before = () => {
      opened = Array.from(document.querySelectorAll("details:not([open])"));
      opened.forEach(details => (details.open = true));
    };
    const after = () => {
      opened.forEach(details => (details.open = false));
      opened = [];
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);
}

function App() {
  usePrintExpandsDetails();
  useEffect(() => {
    if (readConsent() === "accepted") loadAnalytics();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <SkipLink />
          <ScrollProgress />
          <Toaster />
          <Router />
          <BackToTop />
          <CookieBanner />
          <SiteSearch />
          <OutboundLinkTagger />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
