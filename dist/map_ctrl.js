'use strict';

System.register(['./leaflet.js', 'lodash', 'moment', './css/map-panel.css!', './leaflet.css!', 'app/plugins/sdk', 'app/core/app_events', './flatten'], function (_export, _context) {
    "use strict";

    var _, moment, MetricsPanelCtrl, appEvents, flatten, _createClass, timeSrv, date_format, MapCtrl;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    return {
        setters: [function (_leafletJs) {}, function (_lodash) {
            _ = _lodash.default;
        }, function (_moment) {
            moment = _moment.default;
        }, function (_cssMapPanelCss) {}, function (_leafletCss) {}, function (_appPluginsSdk) {
            MetricsPanelCtrl = _appPluginsSdk.MetricsPanelCtrl;
        }, function (_appCoreApp_events) {
            appEvents = _appCoreApp_events.default;
        }, function (_flatten) {
            flatten = _flatten;
        }],
        execute: function () {
            _createClass = function () {
                function defineProperties(target, props) {
                    for (var i = 0; i < props.length; i++) {
                        var descriptor = props[i];
                        descriptor.enumerable = descriptor.enumerable || false;
                        descriptor.configurable = true;
                        if ("value" in descriptor) descriptor.writable = true;
                        Object.defineProperty(target, descriptor.key, descriptor);
                    }
                }

                return function (Constructor, protoProps, staticProps) {
                    if (protoProps) defineProperties(Constructor.prototype, protoProps);
                    if (staticProps) defineProperties(Constructor, staticProps);
                    return Constructor;
                };
            }();

            date_format = 'DD/MM/YYYY kk:mm:ss';

            _export('MapCtrl', MapCtrl = function (_MetricsPanelCtrl) {
                _inherits(MapCtrl, _MetricsPanelCtrl);

                function MapCtrl($scope, $injector) {
                    _classCallCheck(this, MapCtrl);

                    var _this = _possibleConstructorReturn(this, (MapCtrl.__proto__ || Object.getPrototypeOf(MapCtrl)).call(this, $scope, $injector));

                    timeSrv = $injector.get('timeSrv');
                    _this.scope = $scope;

                    _this.myMap = null;
                    _this.coords = [];
                    _this.data = null;

                    _this.panel.maxDataPoints = 1;
                    _this.panel.types = ['geoJSON', 'custom'];
                    _this.panel.dataType = _this.panel.dataType || _this.panel.types[0];
                    _this.panel.latField = _this.panel.latField || null;
                    _this.panel.lngField = _this.panel.lngField || null;
                    _this.panel.posField = _this.panel.posField || '';
                    if (_this.panel.dataField && !Array.isArray(_this.panel.dataField)) _this.panel.dataField = [_this.panel.dataField];
                    if (_this.panel.dataLabel && !Array.isArray(_this.panel.dataLabel)) _this.panel.dataLabel = [_this.panel.dataLabel];
                    _this.panel.dataField = _this.panel.dataField || [''];
                    _this.panel.dataLabel = _this.panel.dataLabel || ['value'];
                    _this.panel.linkPanel = _this.panel.linkPanel || false;
                    _this.panel.showProps = _this.panel.showProps || false;
                    _this.panel.tiles = [{ name: 'openstreet', url: '//tile.openstreetmap.org/{z}/{x}/{y}.png', maxZoom: 18 }, { name: 'opentopomap', url: '//{s}.tile.opentopomap.org/{z}/{x}/{y}.png', maxZoom: 17 }, { name: 'opencyclemap', url: '//{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png' }, { name: 'opencyclemap_transport', url: '//{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png' }, { name: 'opencyclemap_outdoors', url: '//{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png' }, { name: 'mapquest_aerial', url: '//tileproxy.cloud.mapquest.com/tiles/1.0.0/hyb/{z}/{x}/{y}.png', maxZoom: 18 }];
                    _this.panel.tileList = _this.panel.tiles.map(function (item) {
                        return item.name;
                    }, []);
                    _this.panel.mapTile = _this.panel.mapTile || _this.panel.tileList[0];
                    _this.panel.zoom = _this.panel.zoom || 12;
                    _this.panel.circle = _this.panel.circle || false;
                    _this.panel.circleColor = _this.panel.circleColor || 'red';
                    _this.panel.markerColor = _this.panel.markerColor || 'default';

                    _this.events.on('init-edit-mode', _this.onInitEditMode.bind(_this));

                    _this.events.on('panel-initialized', _this.render.bind(_this));

                    _this.events.on('data-received', function (data) {
                        _this.data = data;
                        _this.doMap();
                    });
                    return _this;
                }

                _createClass(MapCtrl, [{
                    key: 'doMap',
                    value: function doMap() {
                        var _this2 = this;

                        var data = this.data;
                        var panel = this.panel;
                        this.coords = [];
                        var minLat = 41.1432592728;
                        var maxLat = 47.247324252;
                        var minLon = 6.098126173;
                        var maxLon = 5.4859435558;

                        for (var k in data) {
                            var target = this.panel.targets[k].target;
                            console.log("data " + k + " target: ", target);
                            if (data[k].datapoints) {
                                console.log("   >datapoints: ", data[k].datapoints.length);
                                for (var i = 0; i < data[k].datapoints.length; i++) {
                                    // position
                                    var position,
                                        properties,
                                        values = [],
                                        ts;
                                    if (data[k].datapoints[i] && data[k].datapoints[i][1]) ts = data[k].datapoints[i][1];
                                    if (this.panel.dataType == "geoJSON") {
                                        // coordinates field of geoJSON
                                        var dataPoint = data[k].datapoints[i][0];
                                        if (this.panel.posField) {
                                            var geo = _.get(dataPoint, this.panel.posField); // lodash _.get(object, path, [defaultValue])
                                            position = geo.features[0].geometry.coordinates;
                                            if (this.panel.showProps) properties = geo.features[0].properties;
                                        } else if (dataPoint && dataPoint.features) {
                                            position = dataPoint.features[0].geometry.coordinates;
                                            if (this.panel.showProps) properties = dataPoint.features[0].properties;
                                        } else if (dataPoint && (dataPoint.latitude || dataPoint.lat)) {
                                            var lat = dataPoint.latitude || dataPoint.lat;
                                            var lng = dataPoint.longitude || dataPoint.lng;
                                            position = { lat: lat, lng: lng };
                                            properties = {};
                                        } else {
                                            // nothing
                                        }
                                        if (position) {
                                            position = { lat: position[1], lng: position[0] };
                                            minLat = Math.min(minLat, position.lat);
                                            minLon = Math.min(minLon, position.lng);
                                            maxLat = Math.max(maxLat, position.lat);
                                            maxLon = Math.max(maxLon, position.lng);
                                        }
                                    } else if (this.panel.dataType == "custom") {
                                        var dataPoint = data[k].datapoints[i][0];
                                        if (this.panel.latField && this.panel.lngField) {
                                            var lat = _.get(dataPoint, this.panel.latField);
                                            var lng = _.get(dataPoint, this.panel.lngField);
                                            position = { lat: lat, lng: lng };
                                            properties = {};
                                        } else if (dataPoint && (dataPoint.latitude || dataPoint.lat)) {
                                            var lat = dataPoint.latitude || dataPoint.lat;
                                            var lng = dataPoint.longitude || dataPoint.lng;
                                            position = { lat: lat, lng: lng };
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
                                                values.push({ 'label': this.panel.dataLabel[z], 'value': _.get(dataPoint, this.panel.dataField[z]) });
                                            }
                                        } else {
                                            // single value
                                            values.push({ 'label': this.panel.dataLabel, 'value': _.get(dataPoint, this.panel.dataField) });
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
                                console.log("doMap - no datapoint for " + k);
                            }
                        }

                        if (this.myMap) {
                            this.myMap.remove();
                        }
                        var points = this.coords.map(function (point) {
                            return point.position;
                        }, []);
                        var id = "map_" + this.panel.id;
                        if (points.length > 0) {
                            var bounds = L.latLngBounds(points);
                            var center = bounds.getCenter();
                            var zoom = this.panel.zoom;
                            this.myMap = L.map(id, {
                                center: center,
                                zoom: zoom
                            });
                            console.log("OK map for " + k + " target: ", target);
                        } else {
                            // no points
                            console.log("NO map for " + k + " target: ", target);
                            return;
                        }
                        try {
                            if (points.length > 1) this.myMap.fitBounds(bounds);
                        } catch (e) {
                            console.log("error fitBounds", e);
                        }

                        this.myMap.on("boxzoomend", function (e) {
                            var coordsInBox = this.coords.filter(function (coord) {
                                return coord.position && e.boxZoomBounds.contains(L.latLng(coord.position.lat, coord.position.lng));
                            });
                            var minTime = Math.min.apply(Math, coordsInBox.map(function (coord) {
                                return coord.timestamp;
                            }));
                            var maxTime = Math.max.apply(Math, coordsInBox.map(function (coord) {
                                return coord.timestamp;
                            }));

                            if (isFinite(minTime) && isFinite(maxTime)) {
                                timeSrv.setTime({
                                    from: moment.utc(minTime),
                                    to: moment.utc(maxTime)
                                });
                            }
                        });

                        var mapTile = _.find(this.panel.tiles, ['name', this.panel.mapTile]);
                        var layer = L.tileLayer(mapTile.url, {
                            maxZoom: mapTile.maxZoom
                        });
                        layer.addTo(this.myMap);

                        this.coords.forEach(function (point) {
                            //console.log("point", point);
                            if (point.position) {
                                if (_this2.panel.circle) {
                                    point.marker = L.circleMarker(point.position, {
                                        color: _this2.panel.circleColor,
                                        //stroke: 'false',
                                        fillColor: 'none',
                                        fillOpacity: 0.5,
                                        radius: 10,
                                        title: point.target
                                    });
                                } else {
                                    // marker
                                    var marker = _this2.panel.markerColor == 'default' ? "" : "-" + _this2.panel.markerColor;
                                    var customIcon = L.icon({
                                        iconUrl: '/grafana/public/plugins/grafana-map-panel/images/marker-icon' + marker + '.png',
                                        iconSize: [25, 41] // size of the icon
                                    });
                                    point.marker = L.marker(point.position, {
                                        icon: customIcon,
                                        title: point.target
                                    });
                                }
                                point.marker.addTo(_this2.myMap);
                                var obj = { date: moment(point.timestamp) };
                                for (var k in point.values) {
                                    obj[point.values[k].label] = point.values[k].value;
                                }
                                obj = _.merge(obj, point.properties);
                                var html = _this2._toHtml(obj);
                                var panel = point.target ? _this2._findPanelByTarget(point.target) : null;
                                console.log("point > panel", panel);
                                if (_this2.panel.linkPanel && panel) {
                                    var ts_range = "&from=" + timeSrv.timeRange().from.valueOf() + "&to=" + timeSrv.timeRange().to.valueOf();
                                    var url = "/grafana/dashboard-solo/db/" + _this2.dashboard.title + "?panelId=" + panel.id + "&theme=light" + ts_range;
                                    html += "<div class='link-panel'>";
                                    html += "<hr><b>Data Graph for " + point.target + "</b>";
                                    //html += "<a class='link-panel' href='"+panel.id+"'>panel "+panel.id+"</>";
                                    html += "<iframe src='" + url + "' class='link-panel'></iframe>";
                                    html += "</div>";
                                }
                                point.marker.bindPopup(html);
                            }
                        });
                    }
                }, {
                    key: '_toHtml',
                    value: function _toHtml(obj) {
                        var html = "";
                        for (var k in obj) {
                            if (obj[k] && !Array.isArray(obj[k])) {
                                html += "<div class='prop'>";
                                html += "<b>" + k + "</b>: ";
                                if (typeof obj[k] == 'string' && obj[k].indexOf("http") != -1) {
                                    html += "<a href='" + obj[k] + "' target='_blank'>" + obj[k] + "</a>: ";
                                } else if (moment.isMoment(obj[k])) {
                                    html += obj[k].format(date_format);
                                } else {
                                    html += obj[k];
                                }
                                html += "</div>";
                            }
                        }
                        return html;
                    }
                }, {
                    key: '_findPanelByTarget',
                    value: function _findPanelByTarget(target) {
                        for (var r in this.dashboard.rows) {
                            for (var p in this.dashboard.rows[r].panels) {
                                var panel = this.dashboard.rows[r].panels[p];
                                if (panel.targets["0"].target == target && panel.type == "graph") {
                                    return panel;
                                }
                            }
                        }
                        return null;
                    }
                }, {
                    key: 'addDataField',
                    value: function addDataField() {
                        console.log('addDataField');
                        this.panel.dataField.push('');
                        this.panel.dataLabel.push('value');
                    }
                }, {
                    key: 'removeDataField',
                    value: function removeDataField(key) {
                        console.log('removeDataField: ' + key);
                        this.panel.dataField.splice(key, 1);
                        this.panel.dataLabel.splice(key, 1);
                        this.doMapAndRender();
                    }
                }, {
                    key: 'showJson',
                    value: function showJson() {
                        var _this3 = this;

                        var target = this.panel.targets[0].target;
                        console.log("   >target", target);
                        this.datasource.metricGetJson(target).then(function (json_sample) {
                            console.log("   >json_sample", json_sample);
                            console.log("showJson");
                            var modalScope = _this3.scope.$new(true);
                            modalScope.tabs = { index: 0 };
                            modalScope.json_orig = JSON.stringify(json_sample, null, 2);
                            modalScope.json_flat = JSON.stringify(JSON.flatten(json_sample), null, 2);
                            appEvents.emit('show-modal', {
                                src: 'public/plugins/grafana-hist-json-datasource/partials/json.sample.html',
                                //modalClass: 'confirm-modal',
                                scope: modalScope
                            });
                        });
                    }
                }, {
                    key: 'doMapAndRender',
                    value: function doMapAndRender() {
                        this.doMap();
                        this.render();
                    }
                }, {
                    key: 'onInitEditMode',
                    value: function onInitEditMode() {
                        this.addEditorTab('Options', 'public/plugins/grafana-map-panel/editor.html', 2);
                    }
                }, {
                    key: 'addPanel',
                    value: function addPanel() {
                        console.log("dashboard", this.dashboard);
                        console.log("panel", this.panel);

                        //        this.dashboard.rows["0"].panels["0"].targets["0"].target
                    }
                }, {
                    key: 'link',
                    value: function link(scope, elem) {
                        var _this4 = this;

                        this.events.on('render', function () {

                            var $panelContainer = elem.find('.panel-container');

                            if (_this4.panel.bgColor) {
                                $panelContainer.css('background-color', _this4.panel.bgColor);
                            } else {
                                $panelContainer.css('background-color', '');
                            }
                        });
                    }
                }]);

                return MapCtrl;
            }(MetricsPanelCtrl));

            _export('MapCtrl', MapCtrl);

            MapCtrl.templateUrl = 'module.html';
        }
    };
});
//# sourceMappingURL=map_ctrl.js.map
