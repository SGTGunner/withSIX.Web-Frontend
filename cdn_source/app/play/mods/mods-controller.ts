module MyApp.Play.ContentIndexes.Mods {
    export interface IModsScope extends IContentIndexScope {
        items: breeze.Entity[];
        totalServerItems;
        pagingOptions: { currentPage: number };
        totalPages;
        otherOptions: { view: string };
        activeCollection: { name: string;items: { name: string;packageName: string }[] };
        showCollectionBasket: boolean;
        toggleCollectionBasket: () => boolean;
        followed: {};
        formatVersion: (model) => string;
        modUpload: boolean;
        addToBasket: (mod: any) => void;
        baskets: MyApp.Components.Basket.GameBaskets;
        isInBasket: (mod: IBreezeMod) => void;
    }

    export class ModsController extends ContentsController {
        static $name = 'ModsController';
        static $inject = [
            '$q', '$scope', '$timeout',
            '$cookieStore', '$location', '$routeParams', 'w6',
            'modDataService', 'logger', 'DoubleClick', '$rootScope', 'basketService'
        ];

        constructor(public $q: ng.IQService, public $scope: IModsScope, public $timeout: ng.ITimeoutService,
            public $cookieStore, public $location: ng.ILocationService, public $routeParams, w6,
            public dataService: ModDataService, public logger: Components.Logger.ToastLogger, public dfp, $rootScope, basketService: Components.Basket.BasketService) {

            super(dataService, $q, $scope, w6, $routeParams, logger, $cookieStore, $location, $timeout, dfp);

            var basket = $scope.game && basketService.getGameBaskets($scope.game.id);
            //$rootScope.$broadcast('someEvent1',[]);
            $scope.followed = $scope.followedMods;
            $scope.modUpload = true;

            $scope.addToBasket = (mod: IBreezeMod) => basketService.addToBasket($scope.game.id, Helper.modToBasket(mod));
            $scope.baskets = basket;
            $scope.isInBasket = (mod: IBreezeMod) => {
                return basket && basket.active.content.indexOf(mod.id) != -1;
            };

            $scope.activeCollection = {
                name: "Test collection",
                items: [
                    {
                        name: "Advanced Combat Environment (Core)",
                        packageName: "@ACE"
                    },
                    {
                        name: "Advanced Combat Environment (Xtras)",
                        packageName: "@ACEX"
                    }
                ]
            };
            $scope.toggleCollectionBasket = () => $scope.showCollectionBasket = !$scope.showCollectionBasket;
            $scope.showCollectionBasket = false;

            $scope.$on('$destroy', () => $scope.cancelOutstandingRequests());

            $scope.formatVersion = version => !version || version.startsWith('v') ? version : 'v' + version;

            // It seems we need to slightly delay to make the spinner appear (is that since angular 1.3?)
            $timeout(() => this.refresh());
        }

        public handleVariants() {
            this.cookiePrefix = 'mods';
            var title = "Mods";
            var category = this.$routeParams['category'];
            this.$scope.title = category ? category + " " + title : title;
            this.$scope.subtitle = this.getSubtitle();
            this.$scope.views.grid.itemTemplate = this.getViewInternal('play/mods', '_mod_grid');
        }

        public getItems() {
            this.$scope.cancelOutstandingRequests();
            return this.getData()
                .then(this.querySucceeded)
                .catch(this.breezeQueryFailed);
        }

        private getData() {
            return (this.$routeParams['gameSlug'] == null)
                ? this.dataService.getAllModsByAuthor(this.$routeParams['userSlug'] || this.$scope.w6.userInfo.slug, this.getOptions())
                : this.dataService.getAllModsByGame(this.$routeParams['gameSlug'], this.getOptions());
        }

        public getUserTags(name: string): Promise<any[]> {
            return this.$scope.dispatch(MyApp.Play.ContentIndexes.Mods.GetModUserTagsQuery.$name, { query: name, gameSlug: this.$routeParams.gameSlug }).then(r => r.lastResult);
        }

        public getPrefixes(query) {
            if (query.startsWith("tag:")) {
                var name = query.substring(4);
                if (name.length > 0)
                    return this.getTagTags(name);
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

        private getSelfTags(name: string) {
            return this.$scope.request(GetModTagsQuery, { gameSlug: this.$routeParams.gameSlug, userSlug: this.getUserSlug(), query: name })
                .then((d) => this.processMods(d.lastResult))
                .catch((reason) => this.breezeQueryFailed(reason));
        }

        private getTagTags(name: string) {
            return this.$scope.request(GetCategoriesQuery, { query: name })
                .then((d) => this.processNamesWithPrefix(d.lastResult, "tag:"))
                .catch((reason) => this.breezeQueryFailed(reason));
        }

        public getItemUrl(item): string {
            return this.w6.url.play + "/" + item.game.slug + "/mods/" + Tools.toShortId(item.id) + "/" + item.slug;
        }
    }

    registerController(ModsController);
}
