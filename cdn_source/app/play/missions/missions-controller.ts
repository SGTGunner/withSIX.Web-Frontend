module MyApp.Play.ContentIndexes.Missions {
    export interface IMissionsScope extends IContentIndexScope {
        items: breeze.Entity[];
        totalServerItems;
        pagingOptions: { currentPage: number };
        totalPages;
        otherOptions: { view: string };
        followed: {};
        publishEnabled: boolean;
        currentUrl;
    }

    export class MissionsController extends ContentsController {
        static $name = 'MissionsController';
        static $inject = [
            '$q', '$scope', '$timeout',
            '$cookieStore', '$location', '$routeParams', 'w6',
            'missionDataService', 'logger', 'DoubleClick'
        ];

        constructor(public $q: ng.IQService, public $scope: IMissionsScope, public $timeout: ng.ITimeoutService,
            public $cookieStore, public $location: ng.ILocationService, public $routeParams: ng.route.IRouteParamsService, w6,
            public dataService: MissionDataService, public logger: Components.Logger.ToastLogger, public dfp) {

            super(dataService, $q, $scope, w6, $routeParams, logger, $cookieStore, $location, $timeout, dfp);

            $scope.followed = $scope.followedMissions;
            $scope.publishEnabled = true;
            $scope.currentUrl = this.$location.absUrl();

            $scope.$on('$destroy', () => $scope.cancelOutstandingRequests());

            // It seems we need to slightly delay to make the spinner appear (is that since angular 1.3?)
            $timeout(() => this.refresh());
        }

        public handleVariants() {
            this.cookiePrefix = 'missions';
            this.$scope.title = "Missions";
            this.$scope.subtitle = this.getSubtitle();
            this.$scope.views.grid.itemTemplate = this.getViewInternal('play/missions', '_mission_grid');
        }

        public getPrefixes(query) {
            if (query.startsWith("user:")) {
                var name = query.substring(5);
                if (name.length > 0)
                    return this.getUserTags(name);
                return this.defaultPrefixes();
            }

            if (query.startsWith("tag:")) {
                // TODO
                return this.defaultPrefixes();
            }

            if (query.length > 2)
                return this.getSelfTags(query);

            return this.defaultPrefixes();
        }

        private getSelfTags(name: string) {
            return ((this.$routeParams['gameSlug'] == null)
                    ? this.dataService.getMissionTagsByAuthor(this.getUserSlug(), name)
                    : this.dataService.getMissionTagsByGame(this.$routeParams['gameSlug'], name))
                .then((d) => this.processNames(d.results))
                .catch((reason) => this.breezeQueryFailed(reason));
        }

        public getItems() {
            this.$scope.cancelOutstandingRequests();
            return this.getData()
                .then(this.querySucceeded)
                .catch(this.breezeQueryFailed);
        }

        private getData() {
            return (this.$routeParams['gameSlug'] == null)
                ? this.dataService.getAllMissionsByAuthor(this.$routeParams['userSlug'] || this.$scope.w6.userInfo.slug, this.getOptions())
                : this.dataService.getAllMissionsByGame(this.$routeParams['gameSlug'], this.getOptions());
        }

        public getItemUrl(item): string {
            var baseUrl = this.w6.url.play + "/" + item.game.slug + "/missions/";
            return baseUrl + Tools.toShortId(item.id).toString() + "/" + item.slug;
        }
    }

    registerController(MissionsController);
}