declare var LatLon;
declare var google;

module MyApp.Play.Servers {
    export interface IServerScope extends IContentScopeT<IBreezeServer> {
        server;
        userLocation;
        getDistance: (server, user) => void;
        serverLocation;
        distance;
    }

    export class ServerController extends ContentModelController<IBreezeServer> {
        static $name = 'ServerController';
        static $inject = [
            '$q', '$scope', '$timeout',
            '$cookieStore', '$location', '$routeParams', 'w6',
            'logger', 'geoService', 'signalrService', 'DoubleClick', '$sce', 'model'
        ];

        constructor(public $q: ng.IQService, public $scope: IServerScope, public $timeout: ng.ITimeoutService,
            public $cookieStore, public $location: ng.ILocationService, public $routeParams, w6,
            public logger: Components.Logger.ToastLogger, private geoService: Components.Geo.GeoService, private signalrService, public dfp,
            $sce,
            model: IBreezeServer) {

            super($scope, logger, $routeParams, $q, $sce, model);

            $scope.getDistance = this.getDistance;

            $scope.$on('mapInitialized', (event, map) => {
                var position = new google.maps.LatLng($scope.serverLocation.lat, $scope.serverLocation.lon);
                var marker = new google.maps.Marker({
                    title: "Server location"
                });
                marker.setPosition(position);
                marker.setMap(map);


                var flightPath = new google.maps.Polyline({
                    path: [position, new google.maps.LatLng($scope.userLocation.lat, $scope.userLocation.lon)],
                    geodesic: true,
                    strokeColor: '#FF0000',
                    strokeOpacity: 1.0,
                    strokeWeight: 2
                });

                flightPath.setMap(map);

                map.setCenter(position);
            });

            this.geoService.getMyInfo2()
                .then((response) => {
                    this.$scope.userLocation = new LatLon(response.latitude, response.longitude);
                    this.$scope.distance = this.getDistance();
                })
                .catch((reason) => Debug.log("geo failed: " + reason));

            this.serversHub = this.signalrService.client.createHubProxy('ServersHub');

            // TODO: Like mods/missions
            $scope.model = <any>{
                server: model,
                content: {
                    header: model.name,
                    menuItems: this.getMenuItems([{ header: "Info", segment: "info", isDefault: true }], 'game.serversShow'),
                    url: this.getBaseUrl("server")
                }
            };
            this.$scope.server = model;
            this.$scope.serverLocation = new LatLon(model.latitude, model.longitude);

            this.signalrService.clientPromise().done((d) => {
                // not using generated proxies atm, shall we in the future? But how to load dynamically when we know it is available?
                this.serversHub.invoke('getPing', model.ipAddress, model.queryPort, model.port)
                    .done((ping) => this.$scope.$evalAsync(() => this.$scope.server.ping = ping));
            });
        }

        public getDistance = () => this.$scope.serverLocation.distanceTo(this.$scope.userLocation);
        serversHub;
    }

    registerController(ServerController);
}