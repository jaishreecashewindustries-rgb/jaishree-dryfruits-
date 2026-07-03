import { useEffect } from "react";

// Plain `overflow:hidden` on body doesn't reliably block scroll on mobile
// Safari/Chrome (background can still be dragged via touchmove). Locking the
// body to `position: fixed` while preserving scroll offset fixes that.
export default function useBodyScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked) return;

    const scrollY = window.scrollY;
    const { body } = document;
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    return () => {
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
}
