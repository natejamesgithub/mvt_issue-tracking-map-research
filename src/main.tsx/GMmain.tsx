import React from "react";
import ReactDOM from "react-dom/client";
import GoogleMaps from "../maps/GoogleMaps";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Could not find the root element.");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <GoogleMaps />
  </React.StrictMode>,
);