import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop component that scrolls the page to the top
 * whenever the route changes
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top when route changes (instant, no animation)
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;

