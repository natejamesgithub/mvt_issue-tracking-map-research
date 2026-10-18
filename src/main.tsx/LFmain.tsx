import React from "react";
import ReactDOM from "react-dom/client";
import Leaflet from "../maps/Leaflet";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Could not find the root element.");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <Leaflet />
  </React.StrictMode>
);