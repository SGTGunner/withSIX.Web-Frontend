module MyApp.Play.ContentIndexes.Collections {
    export interface ICollectionsScope extends IContentIndexScope {
        subscribed: {}
        collectionUpload: boolean;
    }

    export class CollectionsController extends ContentsController {
        static $name = 'CollectionsController';
        static $inject = [
            '$q', '$scope', '$timeout',
            '$cookieStore', '$location', '$routeParams', 'w6',
            'collectionDataService', 'logger', 'modDataService', 'DoubleClick'
        ];

        constructor(public $q: ng.IQService, public $scope: ICollectionsScope, public $timeout: ng.ITimeoutService,
            public $cookieStore, public $location: ng.ILocationService, public $routeParams, w6,
            public dataService: CollectionDataService, public logger: Components.Logger.ToastLogger, private modDataService, public dfp) {

            super(dataService, $q, $scope, w6, $routeParams, logger, $cookieStore, $location, $timeout, dfp);

            $scope.subscribed = $scope.subscribedCollections;
            $scope.$on('$destroy', () => $scope.cancelOutstandingRequests());
            $scope.collectionUpload = $scope.w6.enableBasket;
            // It seems we need to slightly delay to make the spinner appear (is that since angular 1.3?)
            $timeout(() => this.refresh());
        }

        public handleVariants() {
            this.cookiePrefix = 'collections';
            this.$scope.views.grid.itemTemplate = this.getViewInternal('play/collections', '_collection_grid');
            this.$scope.title = "Collections";
            this.$scope.subtitle = this.getSubtitle();
        }

        public getSorts() {
            return CollectionsController.sorts;
        }

        static sorts = [
            {
                name: "Name",
                field: "name"
            },
            {
                name: "Author",
                field: "author"
            },
            {
                name: "Subscribers",
                field: "subscribersCount"
            },
            {
                name: "Mods",
                field: "modsCount"
            },
            {
                name: "Size",
                field: "size"
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
                fields: ["subscribersCount", "name"],
                directions: ["desc", "asc"]
            };
        }

        public getItems() {
            this.$scope.cancelOutstandingRequests();
            return this.getData()
                .then(this.querySucceeded)
                .catch(this.breezeQueryFailed);
        }

        public getPrefixes(query) {
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

            if (query.startsWith("tag:")) {
                // TODO
                return this.defaultPrefixes();
            }

            if (query.length > 2)
                return this.getSelfTags(query);

            return this.defaultPrefixes();
        }

        private getModTags(name: string) {
            return this.$scope.request(Mods.GetModTagsQuery, { gameSlug: this.$routeParams.gameSlug, query: name })
                .then((d) => this.processModsWithPrefix(d.lastResult, "mod:"))
                .catch((reason) => this.breezeQueryFailed(reason));
        }

        private getSelfTags(name: string) {
            return ((this.$routeParams['gameSlug'] == null)
                    ? this.dataService.getCollectionTagsByAuthor(this.getUserSlug(), name)
                    : this.dataService.getCollectionTagsByGame(this.$routeParams['gameSlug'], name))
                .then((d) => this.processNames(d.results))
                .catch((reason) => this.breezeQueryFailed(reason));
        }

        private isInSpecial(needle, hayStack) {
            return needle.length >= W6Context.minFilterLength
                ? hayStack.containsIgnoreCase(needle)
                : hayStack.startsWithIgnoreCase(needle);
        }

        public getItemUrl(item): string {
            return this.w6.url.play + "/" + item.game.slug + "/collections/" + Tools.toShortId(item.id) + "/" + item.slug;
        }

        private getData(): Promise<IQueryResult<IBreezeCollection>> {
            return (this.$routeParams['gameSlug'] == null)
                ? (this.$routeParams['userSlug'] == null ?
                    this.dataService.getCollectionsByMe(this.getOptions())
                    : this.dataService.getCollectionsByAuthor(this.$routeParams['userSlug'] || this.$scope.w6.userInfo.slug, this.getOptions()))
                : this.dataService.getCollectionsByGame(this.$routeParams['gameSlug'], this.getOptions());
        }

        public getGridOptions() {
            var data = this.defaultGridOptions();
            data.columnDefs = [
                { field: "avatar", displayName: "", pinnable: false, cellTemplate: "<a href='{{getItemUrl(row.entity)}}' target='_self'><img ng-src='{{getImage(row.getProperty(col.field))}}' /></a>" },
                { field: "name", displayName: "Name", pinnable: true },
                { field: "description", displayName: "Description", pinnable: false },
                { field: "tags", displayName: "Tags", pinnable: false },
                { field: "modsCount", displayName: "Mods", pinnable: false },
                { field: "size", displayName: "Size", width: "100", pinnable: false, cellFilter: "bytes:2:2" },
                { field: "subscribersCount", displayName: "Subscribers", pinnable: false, width: "120" },
                { field: "author", displayName: "Author", pinnable: false, width: "180", cellTemplate: "<a href='{{::url.getUserUrl(row.getProperty(col.field))}}' target='_self'><img align='left' alt='{{row.getProperty(col.field).displayName}}' ng-src='{{row.getProperty(col.field).avatar}}' />&nbsp;{{row.getProperty(col.field).displayName}}</a>" },
                { field: "updatedAt", displayName: "Updated At", width: "140", pinnable: false, cellTemplate: this.timeAgoTemplate },
                { field: "createdAt", displayName: "Created At", width: "140", pinnable: false, cellTemplate: this.timeAgoTemplate }
            ];
            return data;
        }
    }

    registerController(CollectionsController);
}
