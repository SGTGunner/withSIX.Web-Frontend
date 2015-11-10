module MyApp.Play.ContentIndexes.Servers {
    export interface IServersScope extends IContentIndexScope {
        userLocation;
        getDistance: (server, user) => any;
        playerFilter: { min: number;max: number };
        openAddServerDialog: () => any;
    }

    export class ServersController extends ContentsController {
        static $name = 'ServersController';
        static $inject = [
            '$q', '$scope', '$timeout',
            '$cookieStore', '$location', '$routeParams', 'w6',
            'serverDataService', 'modDataService', 'logger',
            'geoService', 'signalrService', 'promiseCache', 'debounce', 'DoubleClick'
        ];

        constructor(public $q: ng.IQService, public $scope: IServersScope, public $timeout: ng.ITimeoutService,
            public $cookieStore, public $location: ng.ILocationService, public $routeParams: ng.route.IRouteParamsService, w6,
            public dataService: ServerDataService, private modDataService: Mods.ModDataService, public logger: Components.Logger.ToastLogger, private geoService,
            private signalrService, private promiseCache, private debounce, public dfp) {

            super(dataService, $q, $scope, w6, $routeParams, logger, $cookieStore, $location, $timeout, dfp);

            $scope.getDistance = this.getDistance;
            $scope.playerFilter = { min: -1, max: -1 };
            $scope.openAddServerDialog = () => $scope.request(Servers.OpenAddServerDialogQuery, { gameSlug: $routeParams['gameSlug'] });

            this.bouncePlayerFilter = debounce(() => {
                $scope.views.filterOptions.minPlayers = $scope.playerFilter.min;
                $scope.views.filterOptions.maxPlayers = $scope.playerFilter.max;
            }, 250);

            $scope.$watch('playerFilter', this.playerFilterChanged, true);

            this.serversHub = this.signalrService.client.createHubProxy('ServersHub');

            // It seems we need to slightly delay to make the spinner appear (is that since angular 1.3?)
            $timeout(() => {
                this.geoService.getMyInfo()
                    .then((response) => { this.$scope.userLocation = new LatLon(response.data.latitude, response.data.longitude); })
                    .catch((reason) => Debug.log("geo failed: " + reason));
                this.refresh();
            });
        }

        private playerFilterChanged = (newVal, oldVal) => {
            if (newVal !== oldVal) this.bouncePlayerFilter(newVal);
        };

        public handleVariants() {
            this.cookiePrefix = 'servers';
            this.$scope.title = "Servers";
            this.$scope.subtitle = this.getSubtitle();

            this.defaultFilterOptions = {
                text: "",
                //minPlayers: -1,
                //maxPlayers: -1,
                useExternalFilter: true
            };

            this.$scope.views.grid.itemTemplate = this.getViewInternal('play/servers', '_server_grid');
            this.$scope.views.additionalFilterTemplate = this.getViewInternal('play/servers', '_additional_filters');
        }

        public getItems() {
            this.$scope.cancelOutstandingRequests();
            return this.getData()
                .then(this.querySucceededWrapper)
                .catch(this.breezeQueryFailed);
        }

        public querySucceededWrapper = (data) => {
            this.querySucceeded(data);
            this.signalrService.clientPromise().done((d) => {
                for (var i in data.results) {
                    var server = data.results[i];
                    this.getPing(server);
                }
            });
        };

        public getPrefixes(query) {
            /*
            if (query.startsWith("tag:")) {
                var name = query.substring(4);
                if (name.length > 0)
                    return this.getTagTags(name);
                return this.defaultPrefixes();
            }
            */

            if (query.startsWith("mod:")) {
                var name = query.substring(4);
                if (name.length > 0)
                    return this.getModTags(name);
                return this.defaultPrefixes();
            }

            if (query.startsWith("user:")) {
                var name = query.substring(5);
                if (name.length > 0)
                    return this.getUserTags(name);
                return this.defaultPrefixes();
            }

            if (query.length > 2)
                return this.getSelfTags(query);

            return this.defaultPrefixes();
        }

        private getModTags(name: string) {
            return this.$scope.request(Mods.GetModTagsQuery, { gameSlug: this.$routeParams['gameSlug'], query: name })
                .then((d) => this.processModsWithPrefix(d.lastResult, "mod:"))
                .catch((reason) => this.breezeQueryFailed(reason));
        }

        private getSelfTags(name: string) {
            return ((this.$routeParams['gameSlug'] == null)
                    ? this.dataService.getServerTagsByAuthor(this.getUserSlug(), name)
                    : this.dataService.getServerTagsByGame(this.$routeParams['gameSlug'], name))
                .then((d) => this.processNames(d.results))
                .catch((reason) => this.breezeQueryFailed(reason));
        }

        private getPing(server) {
            // TODO: Single request ??
            this.promiseCache({
                promise: () => this.serversHub.invoke('getPing', server.ipAddress, server.queryPort, server.port),
                key: "pingService-" + server.ipAddress //+ ":" + server.queryPort + ":" + server.port
            }).done((ping) => {
                this.$scope.$evalAsync(() => server.ping = ping);
            });
        }

        public getDistance = (server, user) => {
            if (server == null || user == null) return -1;
            var s = new LatLon(server.latitude, server.longitude);
            return s.distanceTo(user);
        };

        private getData() {
            return (this.$routeParams['gameSlug'] == null)
                ? this.dataService.getAllServersByAuthor(this.$routeParams['userSlug'] || this.$scope.w6.userInfo.slug, this.getOptions())
                : this.dataService.getAllServersByGame(this.$routeParams['gameSlug'], this.getOptions());
        }

        public getItemUrl(item): string {
            return this.w6.url.play + "/" + item.game.slug + "/servers/" + Tools.toShortId(item.id) + "/" + item.slug;
        }

        public getSorts() {
            return ServersController.sorts;
        }

        static sorts = [
            {
                name: "Name",
                field: "name"
            },
            {
                name: "Followers",
                field: "followersCount"
            },
            {
                name: "NumPlayers",
                field: "numPlayers"
            },
            {
                name: "MaxPlayers",
                field: "maxPlayers"
            },
            {
                name: "UpdatedAt",
                field: "updatedAt"
            },
            {
                name: "CreatedAt",
                field: "createdAt"
            }
        ];

        public getDefaultSortOptions() {
            return {
                fields: ["numPlayers", "name"],
                directions: ["desc", "asc"]
            };
        }

        public getGridOptions() {
            var data = this.defaultGridOptions();
            data.columnDefs = [
                { field: "avatar", displayName: "", pinnable: false, cellTemplate: "<a href='{{getItemUrl(row.entity)}}' target='_self'><img ng-src='{{getImage(row.getProperty(col.field))}}' /></a>" },
                { field: "ipAddress", displayName: "IP", pinnable: true },
                { field: "queryPort", displayName: "QPort", pinnable: true },
                { field: "name", displayName: "Name", pinnable: true },
                { field: "description", displayName: "Description", pinnable: false },
                { field: "numPlayers", displayName: "#", pinnable: false },
                { field: "maxPlayers", displayName: "Max", pinnable: false },
                { field: "tags", displayName: "Tags", pinnable: false },
                { field: "country", displayName: "C", pinnable: false },
                { field: "mod", displayName: "Mods", pinnable: false },
                { field: "followersCount", displayName: "Followers", pinnable: false, width: "120" }
            ];
            return data;
        }

        serversHub;
        bouncePlayerFilter;
    }

    registerController(ServersController);
}