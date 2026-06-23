import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

/**
 * index.js — The entry point of the React application.
 *
 * ReactDOM.createRoot() is the React 18 way to mount the app.
 * It mounts the <App /> component into the <div id="root"> in public/index.html.
 *
 * React.StrictMode:
 * - Highlights potential problems in development
 * - Renders components twice (in dev only) to detect side effects
 * - Has no effect in production builds
 */
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
