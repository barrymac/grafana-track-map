import './leaflet.js'
import _ from 'lodash';
import moment from 'moment';
import './css/map-panel.css!';
import './leaflet.css!';
import { MetricsPanelCtrl } from 'app/plugins/sdk';
import appEvents from 'app/core/app_events';
import * as flatten from './flatten';

var timeSrv;
var date_format = 'DD/MM/YYYY kk:mm:ss';

export class MapCtrl extends MetricsPanelCtrl {
    
    constructor($scope, $injector) {
        super($scope, $injector);
        timeSrv = $injector.get('timeSrv')
        this.scope = $scope;
                
        this.myMap = null;
        this.coords = [];
        this.data = null;

        this.panel.maxDataPoints = 1;
        this.panel.types = ['geoJSON','custom'];
        this.panel.dataType = this.panel.dataType || this.panel.types[0];
        this.panel.latField = this.panel.latField || null;
        this.panel.lngField = this.panel.lngField || null;
        this.panel.posField = this.panel.posField || '';
        if (this.panel.dataField && !Array.isArray(this.panel.dataField)) this.panel.dataField = [this.panel.dataField];
        if (this.panel.dataLabel && !Array.isArray(this.panel.dataLabel)) this.panel.dataLabel = [this.panel.dataLabel];
        this.panel.dataField = this.panel.dataField || [''];
        this.panel.dataLabel = this.panel.dataLabel || ['value'];
        this.panel.linkPanel = this.panel.linkPanel || false;
        this.panel.showProps = this.panel.showProps || false;
        this.panel.tiles = [
            { name: 'openstreet', url: '//tile.openstreetmap.org/{z}/{x}/{y}.png', maxZoom: 18}, 
            { name: 'opentopomap', url: '//{s}.tile.opentopomap.org/{z}/{x}/{y}.png', maxZoom: 17}, 
            { name: 'opencyclemap', url: '//{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png'},
            { name: 'opencyclemap_transport', url: '//{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png'},
            { name: 'opencyclemap_outdoors', url: '//{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png'},
            { name: 'mapquest_aerial', url: '//tileproxy.cloud.mapquest.com/tiles/1.0.0/hyb/{z}/{x}/{y}.png', maxZoom: 18}, 
        ];
        this.panel.tileList = this.panel.tiles.map(function(item) {
            return item.name;
        }, []);
        this.panel.mapTile = this.panel.mapTile || this.panel.tileList[0];
        this.panel.zoom = this.panel.zoom || 12;
        this.panel.circle = this.panel.circle || false;
        this.panel.circleColor = this.panel.circleColor || 'red';
        this.panel.markerColor = this.panel.markerColor || 'default';
                
        this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
        
        this.events.on('panel-initialized', this.render.bind(this));
        
        this.events.on('data-received', (data) => {
            this.data = data;
            this.doMap();
        });
    }
    
    doMap() {
        var data = this.data;
        var panel = this.panel;
        this.coords = [];
        var minLat = 41.1432592728;
        var maxLat = 47.247324252;
        var minLon = 6.098126173;
        var maxLon = 5.4859435558;
        
        for (var k in data) {
            var target = this.panel.targets[k].target;
            console.log("data "+k+" target: ",target);
            if (data[k].datapoints) {
                console.log("   >datapoints: ",data[k].datapoints.length);
                for (var i = 0; i < data[k].datapoints.length; i++) {
                    // position
                    var position, properties, values = [], ts;
                    if (data[k].datapoints[i] && data[k].datapoints[i][1]) ts = data[k].datapoints[i][1];
                    if (this.panel.dataType=="geoJSON") {
                        // coordinates field of geoJSON
                        var dataPoint = data[k].datapoints[i][0];
                        if (this.panel.posField) {
                            var geo = _.get(dataPoint, this.panel.posField);    // lodash _.get(object, path, [defaultValue])
                            position = geo.features[0].geometry.coordinates;
                            if (this.panel.showProps) properties = geo.features[0].properties;
                        } else if (dataPoint && dataPoint.features) {
                            position = dataPoint.features[0].geometry.coordinates;
                            if (this.panel.showProps) properties = dataPoint.features[0].properties;
                        } else if (dataPoint && (dataPoint.latitude || dataPoint.lat)) {
                            var lat = dataPoint.latitude || dataPoint.lat;
                            var lng = dataPoint.longitude || dataPoint.lng;
                            position = {lat: lat, lng: lng};
                            properties = {};
                        } else {
                            // nothing
                        }
                        if (position) {
                            position = {lat: position[1], lng: position[0]};
                            minLat = Math.min(minLat, position.lat);
                            minLon = Math.min(minLon, position.lng);
                            maxLat = Math.max(maxLat, position.lat);
                            maxLon = Math.max(maxLon, position.lng);
                        }
                    } else if (this.panel.dataType=="custom") {
                        var dataPoint = data[k].datapoints[i][0];
                        if (this.panel.latField && this.panel.lngField) {
                            var lat = _.get(dataPoint, this.panel.latField);
                            var lng = _.get(dataPoint, this.panel.lngField);
                            position = {lat: lat, lng: lng};
                            properties = {};
                        } else if (dataPoint && (dataPoint.latitude || dataPoint.lat)) {
                            var lat = dataPoint.latitude || dataPoint.lat;
                            var lng = dataPoint.longitude || dataPoint.lng;
                            position = {lat: lat, lng: lng};
                            properties = {};
                        } else {
                            // nothing
                        }
                    }
                    // datafield
                    if (this.panel.dataField) {
                        if (Array.isArray(this.panel.dataField)) {
                            // multiple values
                            for (var z in this.panel.dataField) {
                                values.push({ 'label': this.panel.dataLabel[z], 'value': _.get(dataPoint, this.panel.dataField[z])});
                            }
                        } else {
                            // single value
                            values.push({ 'label': this.panel.dataLabel, 'value': _.get(dataPoint, this.panel.dataField)});
                        }
                    } else {
                        values = [];
                    }
                    this.coords.push({
                        values: values,
                        position: position,
                        timestamp: ts,
                        properties: properties,
                        target: target
                    });
                }
            } else {
                console.log("doMap - no datapoint for "+k);
            }
        }

        if (this.myMap) {
            this.myMap.remove();
        }
        var points = this.coords.map(function(point) {
            return point.position;
        }, []);
        var id = "map_"+this.panel.id;
        if (points.length>0) {
            var bounds = L.latLngBounds(points);
            var center = bounds.getCenter();
            var zoom = this.panel.zoom;
            this.myMap = L.map(id, {
                center: center,
                zoom: zoom
            });
            console.log("OK map for "+k+" target: ",target);
        } else {
            // no points
            console.log("NO map for "+k+" target: ",target);
            return;
        }
        try {
            if (points.length>1) this.myMap.fitBounds(bounds);
        } catch(e) {
            console.log("error fitBounds", e)
        }
        
        this.myMap.on("boxzoomend", function (e) {
            const coordsInBox = this.coords.filter(coord =>
                coord.position && e.boxZoomBounds.contains(L.latLng(coord.position.lat, coord.position.lng))
            );
            const minTime = Math.min.apply(Math, coordsInBox.map(coord => coord.timestamp));
            const maxTime = Math.max.apply(Math, coordsInBox.map(coord => coord.timestamp));

            if (isFinite(minTime) && isFinite(maxTime)) {
                timeSrv.setTime({
                    from: moment.utc(minTime),
                    to: moment.utc(maxTime),
                });
            }
        });

        var mapTile = _.find(this.panel.tiles, ['name', this.panel.mapTile]);
        var layer = L.tileLayer(mapTile.url, {
            maxZoom: mapTile.maxZoom,
        });
        layer.addTo(this.myMap);

        this.coords.forEach(point => {
            //console.log("point", point);
            if (point.position) {
                if (this.panel.circle) {
                    point.marker = L.circleMarker(point.position, {
                        color: this.panel.circleColor,
                        //stroke: 'false',
                        fillColor: 'none',
                        fillOpacity: 0.5,
                        radius: 10,
                        title: point.target
                    });                    
                } else {
                    // marker
                    var marker = this.panel.markerColor=='default' ? "" : "-"+this.panel.markerColor;
                    var customIcon = L.icon({
                        iconUrl: '/grafana/public/plugins/grafana-map-panel/images/marker-icon'+marker+'.png',
                        iconSize: [25, 41], // size of the icon
                    });
                    point.marker = L.marker(point.position, {
                        icon: customIcon,
                        title: point.target
                    });
                }
                point.marker.addTo(this.myMap);
                var obj = { date: moment(point.timestamp) };
                for (var k in point.values) {
                    obj[point.values[k].label] = point.values[k].value;
                }
                obj = _.merge(obj, point.properties)
                var html = this._toHtml(obj);
                var panel = point.target ? this._findPanelByTargetOrTitle(point.target, point.values[0].value) : null;
                console.log("point > panel", panel);
                if (this.panel.linkPanel && panel) {
                    var ts_range = "&from="+timeSrv.timeRange().from.valueOf()+"&to="+timeSrv.timeRange().to.valueOf();
                    var url = "/grafana/dashboard-solo/db/"+this.dashboard.meta.slug+"?panelId="+panel.id+"&theme=light"+ts_range;
                    html += "<div class='link-panel'>";
                    html += "<hr><b>Data Graph for "+panel._label+"</b>";
                    //html += "<a class='link-panel' href='"+panel.id+"'>panel "+panel.id+"</>";
                    html += "<iframe src='"+url+"' class='link-panel'></iframe>";
                    html += "</div>";
                }
                point.marker.bindPopup(html);
            }
        });
    }
    
    _toHtml(obj) {
        var html = "";
        for (var k in obj) {
            if (obj[k] && !Array.isArray(obj[k])) {
                html += "<div class='prop'>";
                html += "<b>"+k+"</b>: ";
                if (typeof obj[k]=='string' && obj[k].indexOf("http")!=-1) {
                    html += "<a href='"+obj[k]+"' target='_blank'>"+obj[k]+"</a>: ";
                } else if(moment.isMoment(obj[k])) {
                    html += obj[k].format(date_format);
                } else {
                    html += obj[k];
                }
                html += "</div>";
            }
        }
        return html;
    }
    
    _findPanelByTargetOrTitle(target, title) {
        for (var r in this.dashboard.rows) {
            for (var p in this.dashboard.rows[r].panels) {
                var panel = this.dashboard.rows[r].panels[p];
                if ((panel.targets["0"].target==target || panel.title==title) && panel.type=="graph") {
					if (panel.title==title) panel._label = title; else panel._label = target;
                    return panel;
                }
            }
        }
        return null;
    }

    addDataField() {
        console.log('addDataField');
        this.panel.dataField.push('');
        this.panel.dataLabel.push('value');
    }
    
    removeDataField(key) {
        console.log('removeDataField: '+key);
        this.panel.dataField.splice(key, 1);
        this.panel.dataLabel.splice(key, 1);
        this.doMapAndRender();
    }
    
    showJson() {
        var target = this.panel.targets[0].target;
        console.log("   >target", target);
        this.datasource.metricGetJson(target).then(json_sample => {
            console.log("   >json_sample", json_sample);
            console.log("showJson");
            var modalScope = this.scope.$new(true);
            modalScope.tabs = { index: 0 };
            modalScope.json_orig = JSON.stringify(json_sample, null, 2);
            modalScope.json_flat = JSON.stringify(JSON.flatten(json_sample), null, 2)
            appEvents.emit('show-modal', {
              src: 'public/plugins/grafana-hist-json-datasource/partials/json.sample.html',
              //modalClass: 'confirm-modal',
              scope: modalScope
            });
        });
    }

    doMapAndRender() {
        this.doMap();
        this.render();
    }

    onInitEditMode() {
        this.addEditorTab('Options', 'public/plugins/grafana-map-panel/editor.html', 2);
    }

    addPanel() {
        console.log("dashboard",this.dashboard);
        console.log("panel",this.panel);
        
//        this.dashboard.rows["0"].panels["0"].targets["0"].target

    }
       
    link(scope, elem) {
        this.events.on('render', () => {

            const $panelContainer = elem.find('.panel-container');

            if (this.panel.bgColor) {
                $panelContainer.css('background-color', this.panel.bgColor);
            } else {
                $panelContainer.css('background-color', '');
            }
        });
    }
}

MapCtrl.templateUrl = 'module.html';
