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
npm install leaflet react-leaflet
npm install @vis.gl/react-google-maps

npm install -D vite typescript @types/react @types/react-dom @types/leaflet
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