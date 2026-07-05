import React from "react";

// Without this, any uncaught render error anywhere in the tree unmounts the
// entire React root and leaves a permanently blank white page with zero
// feedback — this was the actual cause behind "website sirf white page
// dikhata hai mobile par". Catching it here means users at least see a
// reload prompt instead of a dead page, and the error gets logged so future
// occurrences are diagnosable instead of silent.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Uncaught render error:", error, info);
    try {
      if (window.gtag) {
        window.gtag("event", "exception", { description: String(error?.message || error), fatal: true });
      }
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: "24px",
          textAlign: "center", fontFamily: "sans-serif", background: "#fff",
        }}>
          <h1 style={{ fontSize: "20px", marginBottom: "8px", color: "#3E2723" }}>Something went wrong</h1>
          <p style={{ color: "#666", marginBottom: "20px", fontSize: "14px" }}>
            Please reload the page. If this keeps happening, try clearing your browser cache.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#3E2723", color: "#fff", border: "none",
              padding: "12px 24px", borderRadius: "8px", fontSize: "14px", cursor: "pointer",
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
