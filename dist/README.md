# grafana-track-map
Leaflet track map visualisation plugin

Grafana map plugin that allows you to draw tracks on Leaflet-based map on GeoJSON data from your Grafana backend database.


You have to manually install this under Grafanan plugins directory (/var/lib/grafana/plugins/) and build it with 
```
npm install
npm install -g grunt
grunt
```

The first command installs the needed dependencies, second installs `grunt` build tool and third runs the build.
