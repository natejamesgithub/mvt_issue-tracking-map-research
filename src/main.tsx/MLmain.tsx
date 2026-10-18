import React from "react";
import ReactDOM from "react-dom/client";
import MapLibre from "../maps/MapLibre";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <MapLibre />
  </React.StrictMode>
);