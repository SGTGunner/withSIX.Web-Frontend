module MyApp.Play.ContentIndexes.Apps {
    export interface IAppsScope extends IContentIndexScope {
    }

    export class AppsController extends ContentsController {
        static $name = 'AppsController';
        static $inject = [
            '$q', '$scope', '$timeout',
            '$cookieStore', '$location', '$routeParams', 'w6',
            'appDataService', 'logger', 'promiseCache', 'DoubleClick'
        ];

        constructor(public $q: ng.IQService, public $scope: IAppsScope, public $timeout: ng.ITimeoutService,
            public $cookieStore, public $location: ng.ILocationService, public $routeParams: ng.route.IRouteParamsService, w6,
            public dataService: AppDataService, public logger: Components.Logger.ToastLogger, private promiseCache, public dfp) {

            super(dataService, $q, $scope, w6, $routeParams, logger, $cookieStore, $location, $timeout, dfp);

            // It seems we need to slightly delay to make the spinner appear (is that since angular 1.3?)
            $timeout(() => {
                this.refresh();
            });
        }

        public handleVariants() {
            this.cookiePrefix = 'apps';
            this.$scope.title = "Apps";
            this.$scope.subtitle = this.getSubtitle();
            //this.$scope.views.grid.itemTemplate = this.getViewInternal('play/servers', '_server_grid');
        }

        public getItems() {
            this.$scope.cancelOutstandingRequests();
            return this.getData()
                .then(this.querySucceeded)
                .catch(this.breezeQueryFailed);
        }

        private getData() {
            if (this.$routeParams['gameSlug'])
                return this.dataService.getAllAppsByGame(this.$routeParams['gameSlug'], this.getOptions());
            if (this.$routeParams['userSlug'])
                return this.dataService.getAllAppsByUser(this.$routeParams['userSlug'], this.getOptions());

            // TODO  || this.$scope.w6.userInfo.slug

            return this.dataService.getAllApps(this.getOptions());
        }

        public getItemUrl(item): string {
            return this.w6.url.play + this.getGameSlug(item) + "/apps/" + Tools.toShortId(item.id) + "/" + item.slug;
        }

        getGameSlug(item) {
            return this.$routeParams['gameSlug'] ? "/" + this.$routeParams['gameSlug'] : "";
        }

        public getSorts() {
            return AppsController.sorts;
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
                fields: ["followersCount", "name"],
                directions: ["desc", "asc"]
            };
        }

        public getGridOptions() {
            var data = this.defaultGridOptions();
            data.columnDefs = [
                { field: "avatar", displayName: "", pinnable: false, cellTemplate: "<a href='{{getItemUrl(row.entity)}}' target='_self'><img ng-src='{{getImage(row.getProperty(col.field))}}' /></a>" },
                { field: "name", displayName: "Name", pinnable: true },
                { field: "description", displayName: "Description", pinnable: false },
                { field: "tags", displayName: "Tags", pinnable: false },
                { field: "followersCount", displayName: "Followers", pinnable: false, width: "120" }
            ];
            return data;
        }
    }

    registerController(AppsController);
}