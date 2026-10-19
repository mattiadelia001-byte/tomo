import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/figtree";
import "./styles.css";
import { windowLabel } from "./platform";

if (windowLabel === "widget") document.documentElement.classList.add("widget-mode");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Dev only: expose the store for automated tests.
if (import.meta.env.DEV) {
  import("./state/store").then((m) => { (window as any).__store = m.useStore; });
}
