# MVT Issue Tracking Map Research

Basic prototypes comparing three mapping options for the MVT trail issue tracking feature:

- MapLibre
- Leaflet
- Google Maps

## Install Dependencies

From the project root:

```bash
npm install

npm install react react-dom
npm install maplibre-gl
npm install leaflet react-leaflet react-leaflet-cluster
npm install @vis.gl/react-google-maps
npm install @googlemaps/markerclusterer

npm install -D vite typescript @types/react @types/react-dom @types/leaflet @types/leaflet.markercluster
```
## View 
```bash
npx vite
```
Note that something like 
```http://localhost:1234/``` will appear. 

To view each proposal, you must append the respective html, such as: 
- ```http://localhost:1234/MLindex.html```
- ```http://localhost:1234/GMindex.html```
- ```http://localhost:1234/LFindex.html```

The Leaflet prototype groups nearby issues into numbered clusters. Click a cluster to zoom in; overlapping issues spread apart at maximum zoom. Event filtering updates cluster counts, and your current location stays separate.
