module MyApp {
    export interface ITagKey {
        text: string;
        key: string;
    }

    export interface IViewScope {
        totalPages: number;
        infiniteScroll: boolean;
        items: breeze.Entity[];
        filterTextPlaceholder: string;
        sort: { name: string; field: string }[];
        customSort: string;
        paging: { hasNext: boolean; hasPrevious: boolean; pages: number[]; startItem: number; endItem: number; totalServerItems: number };
        filterPrefixes: string[];
        filterFocused: boolean;
        tags: ITagKey[];
        grid: {
            overlays: Boolean[];
            itemTemplate: string;
            curPage: number;
        };
        list: {};
        otherOptions: { view: string };
        filterOptions: { text: string; size; timespan: number; useExternalFilter: boolean };
        pagingOptions: { pageSizes: number[]; pageSize: number; currentPage: number };
        sortOptions: { fields: string[]; directions: string[] };
        filter: { sizes: { name: string; eq: string; amount: number }[]; timespans: { name: string; hours: number }[]; subscriptions: { name: string; amount: number }[] };
        gridOptions: {};
        reverseSort: () => void;
        getPrefixes: (query) => any;
        toIsoDate: (date) => string;
        getImage: (img) => string;
        clearFilters: () => void;
        refreshImmediately: () => void;
        init: () => void;
    }

    export interface IBaseScope extends IRootScope {
        title: string;
        subtitle: string;
        first: boolean;
        menuItems: IMenuItem[];
        response;
    }

    export interface IBaseGameScope extends IBaseScope {
        gameUrl: string;
        game: MyApp.IBreezeGame;
        followedMods: {};
        followedMissions: {};
        subscribedCollections: {};
        modInfoes: { [id: string]: Components.ModInfo.IModInfo; };
        openAddModDialog: () => void;
        clientInfo: Components.ModInfo.IClientInfo;
        clientContentInfo: Components.ModInfo.IClientInfo2;
        directDownload: (item: { id: string; }) => Promise<void>;
        directDownloadCollection: (item: IBreezeCollection) => Promise<void>; // { id: string; }
        getItemStateClass: (item: MyApp.Components.Basket.IBasketItem) => string;
        canAddToBasket: () => boolean;
        showBusyState: () => boolean;
        openAddCollectionDialog: () => any;
    }

    export interface IHandleCommentsScope<TCommentType> {
        comments: TCommentType[];
        addComment: (newComment) => void;
        deleteComment: (comment) => void;
        saveComment: (comment) => void;
        reportComment: (comment) => void;
        commentLikeStates: {};
        likeComment: (comment) => void;
        unlikeComment: (comment) => void;
    }

    export interface IMenuItem {
        header: string;
        segment: string;
        mainSegment?: string;
        cls?: string;
        icon?: string;
        isRight?: boolean;
        isDefault?: boolean;
        url?: string;
    }

    export interface IContentModel<TContent> {
        header: IContentHeader;
        content: TContent;
    }

    export interface IContentHeader {
        title: string;
        avatar: string;
        getAvatar: (width, height) => string;
        contentType: string;
        contentUrl: string;
        contentPath: string;
        shortContentUrl: string;
        tags: Array<string>;
        menuItems: Array<IMenuItem>;
    }

    export interface IEditConfigurationExtends<TContent> {
        isEditing?: boolean;
        isManaging?: boolean;
        editMode?: boolean;
        canEdit: () => boolean;
        canManage?: () => boolean;
        enableEditing?: () => boolean;
        closeEditing?: () => boolean;
        saveChanges?: (entity?: breeze.Entity, ...entities: breeze.Entity[]) => Promise<breeze.SaveResult>;
        discardChanges: () => void;
        isEdited?: (key: string, model: TContent) => boolean;
        hasChanges?: () => boolean;
    }

    export interface IEditConfiguration<TContent> {
        isEditing: boolean;
        isManaging: boolean;
        editMode: boolean;
        canEdit: () => boolean;
        canManage: () => boolean;
        enableEditing: () => boolean;
        closeEditing: () => boolean;
        saveChanges: (entity?: breeze.Entity, ...entities: breeze.Entity[]) => Promise<breeze.SaveResult>;
        discardChanges: () => void;
        isEdited: (key: string, model: TContent) => boolean;
        hasChanges: () => boolean;
        hasChangesProperty: boolean; // Better to watch this from view instead of redo the function all the time over and over
    }

    export interface ICommentsScope<TComment> {
        comments: Array<TComment>;
        newComment: INewComment<TComment>;
        addComment: (newComment: INewComment<TComment>) => void;
        deleteComment: (comment: TComment) => any;
        saveComment: (comment: TComment) => void;
        reportComment: (comment: TComment) => void;
    }

    export interface INewComment<TComment> {
        message: string;
        replyTo: TComment;
    }

    export class BaseController extends Tk.Controller {
        static $inject = ['$scope', 'logger', '$q'];

        constructor(public $scope: IBaseScope, public logger: Components.Logger.ToastLogger, public $q: ng.IQService) {
            super($scope);
        }

        applyIfNeeded(func?) { return this.applyIfNeededOnScope(func, this.$scope); }

        applyIfNeededOnScope(func, scope) {
            if (!scope.$$phase) {
                scope.$apply(() => func ? func() : null);
            } else if (func) {
                func();
            }
        }

        public setupDefaultTitle() {
            var titleParts = [];
            var first = false;
            window.location.pathname.trim().split('/').reverse().forEach(x => {
                x = x.replace(/-/g, ' ').trim();
                if (!x) return;

                if (!first) {
                    x = x.toUpperCaseFirst();
                    first = true;
                }

                titleParts.push(x);
            });
            titleParts.push(this.$scope.url.siteTitle);
            this.$scope.setPageInfo({ title: titleParts.join(" - ") });
        }

        public setupTitle = (scopeWatch: string, template?: string) => {
            if (!template) template = "{0}";

            var siteSuffix = this.$scope.url.siteTitle;
            this.$scope.$watch(scopeWatch, (newValue: string, oldValue: string, scope) => {
                this.$scope.setPageInfo({ title: template.replace("{0}", newValue) + " - " + siteSuffix });
            });
        };
        public getImage = (img: string, updatedAt: Date): string => {
            if (!img || img == "")
                return this.$scope.url.cdn + "/img/noimage.png";
            return Tools.uriHasProtocol(img) ? img : this.$scope.url.getUsercontentUrl(img, updatedAt);
        };
        subscriptionQuerySucceeded = (result, d) => {
            for (var v in result.data)
                d[result.data[v]] = true;
        };
        public requestAndProcessResponse = (command, data?) => {
            this.$scope.response = undefined;
            return this.$scope.request(command, data)
                .then(this.successResponse)
                .catch(this.errorResponse);
        };
        public successResponse = (commandResult) => {
            Debug.log("success response");
            var result = commandResult.lastResult;
            this.$scope.response = result;
            this.logger.success(result.message, "Action completed");

            return result;
        };
        public errorResponse = (result) => {
            this.$scope.response = result;
            var httpFailed = result.httpFailed;
            this.logger.error(httpFailed[1], httpFailed[0]);

            return this.$q.reject(result);
        }; // TODO: Make this available on the root $scope ??
        public requestAndProcessCommand = (command, pars?, message?) => {
            return this.processCommand(this.$scope.request(command, pars), message);
        };
        public processCommand = <TType>(q: TType, message?): TType => {
            return (<any>q).then((result) => {
                this.logger.success(message || "Saved", "Action completed");
                return result;
            }).catch(reason => {
                var defer = this.$q.defer();
                this.httpFailed(reason);
                defer.reject(reason);
                return defer.promise;
            });
        };
        public breezeQueryFailed2 = (reason) => {
            this.logger.error(reason.message, "Query failed");
            this.$scope.first = true;
        };
        public breezeQueryFailed = (reason) => {
          this.breezeQueryFailed2(reason);
          return <any>null;
        }
        public httpFailed = (reason) => {
            this.$scope.first = true;
            Debug.log("Reason:", reason);
            var msg = LoadingFailedController.getErrorMsg(reason);
            this.logger.error(msg[0], msg[1]);
        };

        public forward(url, $window: ng.IWindowService, $location: ng.ILocationService) {
            this.forwardFull($location.protocol() + ":" + url, $window, $location);
        }

        public forwardFull(fullUrl, $window: ng.IWindowService, $location: ng.ILocationService) {
            Debug.log("changing URL: " + fullUrl);
            $window.location.href = fullUrl;
        }

        public processNames(results) {
            var obj = [];
            angular.forEach(results, item => obj.push({ text: item.name, key: item.name }));
            return obj;
        }

        public processNamesWithPrefix(results, prefix) {
            var obj = [];
            angular.forEach(results, item => obj.push({ text: prefix + item.name, key: prefix + item.name }));
            return obj;
        }

        public getMenuItems(items: Array<IMenuItem>, mainSegment: string, parentIsDefault?: boolean): IMenuItem[] {
            var menuItems = [];
            angular.forEach(items, item => {
                var main = item.mainSegment || item.mainSegment == "" ? item.mainSegment : mainSegment;
                var fullSegment = main && main != "" ? main + "." + item.segment : item.segment;
                var segment = item.isDefault ? main : fullSegment; // This will make menu links link to the parent where this page is default
                var menuItem = <any>angular.copy(item);
                menuItem.segment = segment;
                menuItem.fullSegment = fullSegment;
                menuItem.cls = item.cls;
                if (item.isRight) menuItem.cls = item.cls ? item.cls + ' right' : 'right';
                menuItems.push(menuItem);
            });
            return menuItems;
        }
    }

    export interface IBaseScopeT<TModel> extends IBaseScope, IHaveModel<TModel> {
    }

    export class BaseQueryController<TModel> extends BaseController {
        static $inject = ['$scope', 'logger', '$q', 'model'];

        constructor(public $scope: IBaseScopeT<TModel>, public logger, $q, model: TModel) {
            super($scope, logger, $q);

            $scope.model = model;
        }
    }

    export interface IContentScope extends IBaseGameScope {
    }

    export interface IHaveModel<TModel> {
        model: TModel;
    }

    export interface IContentScopeT<TModel> extends IContentScope {
        model: TModel;
        header: IContentHeader;
        reportContent: () => void;
        editConfig?: IEditConfiguration<TModel>;
        trustedDescriptionFullHtml: string;
        callToAction: () => void;
    }


    export interface IContentIndexScope extends IBaseGameScope {
        getItemUrl: (item) => string;
        getDescription: (item) => string;
        views; //: IViewScope;
        getTagLink: (item, tag) => string;
        ads: number[];
        getImage: (img: string, updatedAt?: Date) => string;
        shareUrl: string;
    }

    // TODO: Convert to the content-gallery-directive...
    export class ContentBaseController extends BaseController {
        defPageSize = 12;
        static sanitize = {
            filter: ["text", "size", "timespan"], // , "subscribers"
            paging: ["currentPage", "pageSize"],
            sort: ["fields", "directions"],
            other: ["view"]
        };

        static sanitize_cookie = {
            filter: <string[]> [],
            paging: <string[]> [],
            sort: ["fields", "directions"],
            other: ["view"]
        };

        ads = [
            [3, 5],
            [5, 8],
            [2, 4],
            [4, 6]
        ];

        constructor(public dataService: W6ContextWrapper, public $q, public $scope: IContentIndexScope, public w6: W6,
            public $routeParams, public logger, public $cookieStore: ng.cookies.ICookiesService, public $location: ng.ILocationService, public $timeout: ng.ITimeoutService, public dfp) {
            super($scope, logger, $q);

            $scope.first = false;

            $scope.getImage = this.getImage;
            $scope.getDescription = this.getDescription;
            $scope.getTagLink = this.getTagLink;
            $scope.getItemUrl = (item) => this.getItemUrl(item);

            $scope.ads = [];
            this.setRandomAds();

            this.defaultFilterOptions = {
                text: "",
                size: null,
                timespan: null,
                useExternalFilter: true
            };
            $scope.views = {
                totalPages: 1,
                infiniteScroll: false,
                filterFocused: false,
                customSort: '',
                filterTextPlaceholder: $routeParams['userSlug'] == null ? 'name, tag, author or mod' : 'name, tag or mod',
                additionalFilterTemplate: this.getViewInternal('components', '_default_additional_filters'),
                filterTemplate: this.getViewInternal('components', '_default_filters'),

                grid: {
                    overlays: [],
                    itemTemplate: this.getViewInternal('components', '_default_grid'),
                    curPage: 1,
                    itemClass: "col-sm-6 col-md-4 col-lg-3"
                },
                list: {},

                otherOptions: { view: 'grid' },
                gridOptions: {},
                filterOptions: { useExternalFilter: true },
                filterPrefixes: dataService.filterPrefixes,
                tags: [],
                items: [],
                filter: ContentBaseController.filters,
                sort: this.getSorts(),

                pagingOptions: {
                    pageSizes: [this.defPageSize, 24, 48], // [25, 50, 100],
                    pageSize: this.defPageSize,
                    currentPage: 1
                },
                paging: {
                    hasNext: false,
                    hasPrevious: false,
                    pages: [1],
                    startItem: 0,
                    endItem: 0,
                    totalServerItems: 0,
                },

                sortOptions: this.getDefaultSortOptions(),

                clearFilters: this.clearFilters,
                toIsoDate: this.toIsoDate,
                getView: this.getView,
                switchView: this.switchView,
                addMoreItems: this.addMoreItems,
                reverseSort: this.reverseSort,
                getPrefixes: (query) => this.getPrefixes(query) // workaround for lambda functions not overriding like methods, in sub classes.
            };

            this.handleVariants();
            $scope.views.filterOptions = angular.copy(this.defaultFilterOptions);
            this.restoreOptions();

            $scope.views.gridOptions = this.getGridOptions();

            $scope.$watch('views.pagingOptions', this.pagingOptionsChanged, true);
            /*
            $scope.$watch('pagingOptions.pageSize', () => {
                if (this.isValidFilterText($scope.filterOptions.text))
                    this.$scope.pagingOptions.currentPage = 1;

            }, true);
            */
            $scope.$watch('views.filterOptions', this.filterOptionsChanged, true);
            // sortOptions also contains columns, and columns change based on width etc, so we don't want to watch those...
            $scope.$watch('views.sortOptions.fields', this.sortOptionsChanged, true);
            $scope.$watch('views.sortOptions.directions', this.sortOptionsChanged, true);
            $scope.$watch('views.otherOptions', this.otherOptionsChanged, true);

            $scope.$watch('views.tags', (newVal, oldVal) => {
                if (newVal === oldVal)
                    return;
                var values = [];
                for (var t in $scope.views.tags) {
                    var v = $scope.views.tags[t];
                    var val: string = v.key ? v.key : v.text;
                    if (val.includes(" ") && (!val.startsWith("\"") && !val.endsWith("\"")))
                        values.push("\"" + val + "\"");
                    else
                        values.push(val);
                }
                $scope.views.filterOptions.text = values.join(" ");
            }, true);

            // TODO: Move to Directive..
            $('body').removeClass('game-profile');
        }

        public getUserSlug() {
            return this.$routeParams['userSlug'] || this.$scope.w6.userInfo.slug;
        }

        public processMods(results) {
            return this.processModsWithPrefix(results, "");
        }

        public processModsWithPrefix(results, prefix) {
            var obj = [];
            angular.forEach(results, mod => {
                if (mod.name && mod.name != mod.packageName && mod.name.startsWithIgnoreCase(name))
                    obj.push({
                        text: prefix + mod.name + " (" + mod.packageName + ")",
                        key: prefix + mod.packageName /*prefix + mod.name*/
                    });
                else if (mod.packageName.startsWithIgnoreCase(name))
                    obj.push({ text: prefix + mod.packageName + (mod.name ? " (" + mod.name + ")" : null), key: prefix + mod.packageName });
                else if (mod.name && mod.name != mod.packageName && mod.name.containsIgnoreCase(name))
                    obj.push({
                        text: prefix + mod.name + " (" + mod.packageName + ")",
                        key: prefix + mod.packageName /*prefix + mod.name*/
                    });
                else if (mod.packageName.containsIgnoreCase(name))
                    obj.push({ text: prefix + mod.packageName + (mod.name ? " (" + mod.name + ")" : null), key: prefix + mod.packageName });
            });
            return obj;
        }

        public handleVariants() { throw new Error("NotImplemented: handleVariants"); }

        public getItemUrl(item): string { throw new Error("NotImplemented: getItemUrl"); }

        public defaultGridOptions() {
            var options = {
                data: "views.items",
                columnDefs: [],
                enablePaging: true,
                enablePinning: true,
                enableColumnReordering: true,
                enableColumnResize: true,
                pagingOptions: this.$scope.views.pagingOptions,
                filterOptions: this.$scope.views.filterOptions,
                keepLastSelected: true,
                multiSelect: false,
                showColumnMenu: true,
                showFilter: true,
                showGroupPanel: true,
                showFooter: true,
                rowHeight: 48,
                rowTemplate: '<div ng-dblclick="doubleClicked(row.entity)" ng-style="{\'cursor\': row.cursor, \'z-index\': col.zIndex() }" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell {{col.cellClass}}" ng-cell></div>',
                sortInfo: this.$scope.views.sortOptions,
                totalServerItems: "views.paging.totalServerItems",
                useExternalSorting: true,
                i18n: "en"
            };
            return angular.copy(options);
        }

        public timeAgoTemplate = "<sx-time time='toIsoDate(row.getProperty(col.field))'></sx-time>";

        public getGridOptions() {
            return this.defaultGridOptions();
        }

        // TODO: How about making the name sort rather default added to the query, instead of configurable?
        public getDefaultSortOptions() {
            return { fields: ["stat.install", "name"], directions: ["desc", "asc"] };
        }

        public escapeIfNeeded(str) {
            if (str.indexOf(" ") != -1)
                return "\"" + str + "\"";
            return str;
        }

        public clearFilters = () => {
            this.$scope.views.tags.length = 0;
            this.$scope.views.filterOptions = angular.copy(this.defaultFilterOptions);
        };
        private pagingOptionsChanged = (newVal, oldVal) => {
            if (newVal === oldVal)
                return;
            Debug.log("pagingOptionsChanged");

            this.updatePagingClone();
            this.$cookieStore.put(this.getCookieKey(ContentBaseController.cookieKeys.pagingOptions), this.pagingClone);
            this.refresh();
        };

        public refresh() {
            this.$scope.cancelOutstandingRequests();
            var filterText = this.$scope.views.filterOptions.text;
            if (this.isValidFilterText(filterText)) {
                this.$scope.loadingStatus.increment();
                this.$scope.views.infiniteScroll = false;
                return this.getItems()
                    .then(() => this.$timeout(() => this.$scope.loadingStatus.decrement(), 500));
            }
            return null;
        }

        private filterOptionsChanged = (newVal, oldVal) => {
            if (newVal === oldVal)
                return;
            Debug.log("filterOptionsChanged");

            this.updateFilteringClone();
            this.$cookieStore.put(this.getCookieKey(ContentBaseController.cookieKeys.filterOptions), this.filteringClone);
            if (this.isValidFilterText(newVal.text))
                this.$scope.views.pagingOptions.currentPage = 1;

            this.refresh();
        };

        public isValidFilterText(text): boolean {
            if (text.length == 0)
                return true;

            var info = W6Context.searchInfo(text, true, this.$scope.views.filterPrefixes);

            // what would this be for?
            //if (info.author.length > 0 && info.dependency.length > 0 && info.name.length > 0 && info.tag.length > 0)
            //return false;

            return info.all.every(key => key.length >= W6Context.minFilterLength);
        }

        private sortOptionsChanged = (newVal, oldVal) => {
            if (newVal === oldVal)
                return;
            Debug.log("sortOptionsChanged");
            this.updateSortingClone();
            this.$cookieStore.put(this.getCookieKey(ContentBaseController.cookieKeys.sortOptions), this.sortingClone);
            this.refresh();
        };
        private pagingClone: string;

        private updatePagingClone() {
            var clone = angular.copy(this.$scope.views.pagingOptions);
            delete clone.pageSizes;

            this.pagingClone = clone;
        }

        private sortingClone: string;

        private updateSortingClone() {
            var clone = angular.copy(this.$scope.views.sortOptions);
            delete clone.columns;
            /*
                    clone.hiddenColumns = [];
                    for (var v in newVal.columns) {
                        if (!v.visible)
                            clone.hiddenColumns.push(v.field);
                    }
                    */
            this.sortingClone = clone;
        }

        private otherClone;

        private updateOtherClone() {
            var clone = angular.copy(this.$scope.views.otherOptions);
            this.otherClone = clone;
        }

        private otherOptionsChanged = (newVal, oldVal) => {
            if (newVal === oldVal)
                return;
            Debug.log("otherOptionsChanged");
            this.updateOtherClone();
            this.$cookieStore.put(this.getCookieKey(ContentBaseController.cookieKeys.otherOptions), this.otherClone);
            this.refreshQueryString();
        };
        private filteringClone: string;

        private updateFilteringClone() {
            var clone = angular.copy(this.$scope.views.filterOptions);
            delete clone.useExternalFilter;
            this.filteringClone = clone;
        }

        private toIsoDate = (date: string): string => {
            return new Date(date).toISOString();
        };
        public querySucceeded = (data) => {
            var page;
            if (this.$scope.views.infiniteScroll) {
                this.$scope.views.items.push.apply(this.$scope.views.items, data.results);
                page = this.$scope.views.grid.curPage;
            } else {
                this.$scope.views.items = data.results;
                page = this.$scope.views.pagingOptions.currentPage;
            }
            this.$scope.views.paging.totalServerItems = data.inlineCount;
            this.updatePaginationInfo();
            this.refreshQueryString();
            this.logger.info("Fetched " + this.$scope.views.items.length + " out of " + this.$scope.views.paging.totalServerItems + " items" + ". Page " + page + " out of " + this.$scope.views.totalPages);
            if (this.$scope.first && page == 1) {
                this.dealWithAds();
            }
            this.$scope.first = true;
        };

        public getOptions() {
            var filterOptions = angular.copy(this.$scope.views.filterOptions);
            var category = this.$routeParams['category'];
            if (category)
                filterOptions.text += " tag:\"" + category + "\"";

            var data = { filter: filterOptions, sort: this.$scope.views.sortOptions, pagination: angular.copy(this.$scope.views.pagingOptions) };
            if (this.$scope.views.infiniteScroll)
                data.pagination.currentPage = this.$scope.views.grid.curPage;
            return data;
        }


        public getTotalPages() {
            return this.totalPages(parseInt(this.$scope.views.paging.totalServerItems.toString()), parseInt(this.$scope.views.pagingOptions.pageSize.toString()));
        }

        private updatePaginationInfo() {
            var currentPage = <number>this.$scope.views.pagingOptions.currentPage;
            var totalPages = this.getTotalPages();

            this.$scope.views.totalPages = totalPages;

            var i = (currentPage - 1) * this.$scope.views.pagingOptions.pageSize;
            this.$scope.views.paging.startItem = this.$scope.views.items.length == 0 ? 0 : i + 1;
            this.$scope.views.paging.endItem = i + this.$scope.views.items.length;

            this.$scope.views.paging.hasNext = currentPage < totalPages;
            this.$scope.views.paging.hasPrevious = currentPage > 1;

            var pages = [];
            if (this.$scope.views.paging.hasPrevious) {
                var end = currentPage - 1;
                var start = end - 3;
                if (start < 1)
                    start = 1;
                var start = Math.min(start, 1);
                for (var i = start; i <= end; i++) {
                    pages.push(i);
                }
            }

            pages.push(currentPage);
            if (this.$scope.views.paging.hasNext) {
                var start = currentPage + 1;
                var end = Math.min(start + 3, start + totalPages - currentPage);
                for (var i = start; i < end; i++) {
                    pages.push(i);
                }
            }

            this.$scope.views.paging.pages = pages;
        }

        private totalPages(total, pageSize) {
            return Math.max(Math.ceil(total / pageSize.toFixed()), 1);
        }

        refreshQueryString() {
            var current = this.$location.search();

            var obj = <any>{};
            if (current.google_console)
                obj.google_console = current.google_console;
            if (current.google_force_console)
                obj.google_force_console = current.google_force_console;

            if (ContentBaseController.sanitize.filter.length != 0)
                Tools.mergeIntoWithFix(this.filteringClone, obj, "filter_", undefined, ContentBaseController.sanitize.filter);

            if (ContentBaseController.sanitize.sort.length != 0)
                Tools.mergeIntoWithFix(this.sortingClone, obj, "sort_", undefined, ContentBaseController.sanitize.sort);

            if (ContentBaseController.sanitize.paging.length != 0)
                Tools.mergeIntoWithFix(this.pagingClone, obj, "page_", undefined, ContentBaseController.sanitize.paging);

            if (ContentBaseController.sanitize.other.length != 0)
                Tools.mergeIntoWithFix(this.otherClone, obj, "other_", undefined, ContentBaseController.sanitize.other);
            //this.$location.search(obj);
            // TODO: Make shareUrl available instead to copy paste..
            this.$scope.shareUrl = this.$location.absUrl() + "?" + jQuery.param(obj);
        }

        restoreOptions() {
            this.restoreFromCookies();
            this.restoreFromQS();

            if (this.$scope.views.otherOptions.view != 'list') {
                this.$scope.views.pagingOptions.pageSize = this.defPageSize;
                this.$scope.views.pagingOptions.currentPage = 1;
            }

            this.restoreTagsField();
            this.sanitizeSortOptions();
            this.updateClones();
        }

        private restoreFromCookies() {
            if (ContentBaseController.sanitize_cookie.paging.length != 0) {
                var data = this.$cookieStore.get(this.getCookieKey(ContentBaseController.cookieKeys.pagingOptions));
                if (data != undefined)
                    Tools.mergeInto(data, this.$scope.views.pagingOptions, ContentBaseController.sanitize_cookie.paging);
            }

            if (ContentBaseController.sanitize_cookie.filter.length != 0) {
                data = this.$cookieStore.get(this.getCookieKey(ContentBaseController.cookieKeys.filterOptions));
                if (data != undefined)
                    Tools.mergeInto(data, this.$scope.views.filterOptions, ContentBaseController.sanitize_cookie.filter);
            }

            if (ContentBaseController.sanitize_cookie.sort.length != 0) {
                data = this.$cookieStore.get(this.getCookieKey(ContentBaseController.cookieKeys.sortOptions));
                if (data != undefined) {
                    Tools.mergeInto(data, this.$scope.views.sortOptions, ContentBaseController.sanitize_cookie.sort);
                    //if (data.hiddenColumns != undefined)
                    //for (var hc in data.hiddenColumns) {
                    //  $scope.views.sortOptions.columns
                    //}
                }
            }

            if (ContentBaseController.sanitize_cookie.other.length != 0) {
                data = this.$cookieStore.get(this.getCookieKey(ContentBaseController.cookieKeys.otherOptions));
                if (data != undefined)
                    Tools.mergeInto(data, this.$scope.views.otherOptions, ContentBaseController.sanitize.other);

            }
        }

        private parseInt(n) {
            var val = parseInt(n);
            return isNaN(val) ? null : val;
        }

        private restoreFromQS() {
            // TODO: Make robust data models which are strict and enforce the appropriate data types etc
            var qs = this.$location.search();
            var filter = {};
            var sort = {};
            var paging = {};
            var other = {};

            for (var a in qs) {
                if (a.match("^filter_")) {
                    var val = qs[a];
                    if (a == "filter_timespan" || a == "filter_size")
                        val = this.parseInt(val);
                    filter[a] = val;
                }

                if (a.match("^sort_"))
                    sort[a] = qs[a];

                if (a.match("^other_"))
                    other[a] = qs[a];

                if (a.match("^page_")) {
                    var val = qs[a];
                    if (a == "page_currentPage" || a == "page_pageSize")
                        val = this.parseInt(val);
                    paging[a] = val;
                }
            }

            if (ContentBaseController.sanitize.filter.length != 0)
                Tools.mergeIntoRemovePrefix(filter, this.$scope.views.filterOptions, "filter_", ContentBaseController.sanitize.filter);

            if (ContentBaseController.sanitize.sort.length != 0)
                Tools.mergeIntoRemovePrefix(sort, this.$scope.views.sortOptions, "sort_", ContentBaseController.sanitize.sort);

            if (ContentBaseController.sanitize.paging.length != 0)
                Tools.mergeIntoRemovePrefix(paging, this.$scope.views.pagingOptions, "page_", ContentBaseController.sanitize.paging);

            if (ContentBaseController.sanitize.other.length != 0)
                Tools.mergeIntoRemovePrefix(other, this.$scope.views.otherOptions, "other_", ContentBaseController.sanitize.other);

            this.$location.search({});
        }

        private sanitizeSortOptions() {
            var sortOptions = {
                fields: [],
                directions: []
            }; // sanitize sort :/ workaround for cookie hassle?
            var original = this.$scope.views.sortOptions;
            var sorts = this.sortAr();
            angular.forEach(original.fields, (field, i) => {
                var dir = original.directions[i];
                if (!sorts.asEnumerable().contains(field))
                    field = "name";

                sortOptions.fields.push(field);
                sortOptions.directions.push(dir);
            });

            original.fields = sortOptions.fields;
            original.directions = sortOptions.directions;
        }

        private restoreTagsField() {
            var split = this.$scope.views.filterOptions.text.match(W6Context.splitRx);
            for (var v in split) {
                var vall = split[v];
                if (vall.startsWith("\"") && vall.endsWith("\""))
                    vall = vall.substring(1, vall.length - 1);
                this.$scope.views.tags.push({ text: vall, key: vall });
            }
        }

        private updateClones() {
            this.updatePagingClone();
            this.updateFilteringClone();
            this.updateSortingClone();
            this.updateOtherClone();
        }

        private sortAr() {
            var ar = [];
            var sorts = this.getSorts();
            angular.forEach(sorts, item => ar.push(item.field));

            return ar;
        }

        private reverseSort = () => {
            this.$scope.views.sortOptions.directions[0] = this.$scope.views.sortOptions.directions[0] == 'desc' ? 'asc' : 'desc';
        };

        private addMoreItems = () => {
            Debug.p.log(() => "addMoreItems: " + this.$scope.views.grid.curPage + ", " + this.$scope.views.totalPages + ", " + (this.$scope.canceler == null));

            if (this.$scope.views.grid.curPage < this.$scope.views.totalPages && this.$scope.canceler == null) {
                this.$scope.views.infiniteScroll = true;
                this.$scope.views.grid.curPage++;
                this.getItems();
            }
        };

        public getItems(): Promise<any> { return null; }

        private switchView = () => {
            this.$scope.views.otherOptions.view = this.$scope.views.otherOptions.view == 'grid' ? 'list' : 'grid';
        };
        private getView = () => this.getViewInternal("components", (<any>this.$scope).views.otherOptions.view);
        public getViewInternal = (path: string, view: string) => '/cdn_source/app/' + path + '/' + view + '.html';
        public getDescription = (item: any): string => item.description || item.descriptionFull || 'no description yet';
        private getTagLink = (item, tag: string): string => this.$scope.url.play + "/" + item.game.slug + "/mods/category/" + Tools.sluggifyEntityName(tag);

        public getPrefixes(query) {
            if (query.startsWith("user:")) {
                var name = query.substring(5);
                if (name.length > 0)
                    return this.getUserTags(name);
                return this.defaultPrefixes();
            }

            return this.defaultPrefixes();
        }

        public defaultPrefixes() {
            var prefixes = [];
            angular.forEach(this.dataService.filterPrefixes, p => prefixes.push({ text: p, key: p }));

            var deferred = this.$q.defer();
            this.$timeout(() => deferred.resolve(prefixes));
            return deferred.promise;
        }

        public getUserTags(name: string): Promise<any[]> {
            return this.$scope.dispatch(MyApp.Play.ContentIndexes.GetUserTagsQuery.$name, { query: name }).then(r => r.lastResult);
        }

        public cookiePrefix: string;

        private getCookieKey(key: string) { return this.cookiePrefix + "_" + key; }

        static cookieKeys = {
            pagingOptions: 'viewsPagingOptions',
            filterOptions: 'viewsFilterOptions',
            sortOptions: 'viewsSortOptions',
            otherOptions: 'viewsOtherOptions'
        };

        public getSorts() {
            // TODO: Get elsewhere?
            return Play.ContentIndexes.Missions.MissionsController.sorts;
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
                name: "Followers",
                field: "followersCount"
            },
            {
                name: "Installs",
                field: "stat.install"
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
        static filters = {
            sizes: [
                {
                    name: "< 500 MB",
                    eq: "<",
                    amount: 500
                }, {
                    name: "< 1 GB",
                    eq: "<",
                    amount: 1024
                }, {
                    name: "< 10 GB",
                    eq: "<",
                    amount: 10 * 1024
                }, {
                    name: "< 50 GB",
                    eq: "<",
                    amount: 50 * 1024
                }
            ],

            timespans: [
                {
                    name: "today",
                    hours: 24
                },
                {
                    name: "this week",
                    hours: 24 * 7
                },
                {
                    name: "this month",
                    hours: 24 * 31
                },
                {
                    name: "this year",
                    hours: 24 * 365
                }
            ],

            subscriptions: [
                {
                    name: "None",
                    amount: 0
                },
                {
                    name: "1 or more",
                    amount: 1
                },
                {
                    name: "5 or more",
                    amount: 5
                },
                {
                    name: "10 or more",
                    amount: 10
                },
                {
                    name: "100 or more",
                    amount: 100
                },
                {
                    name: "1000 or more",
                    amount: 1000
                }
            ]
        };
        defaultFilterOptions: { text: string;size?: string;timespan?;useExternalFilter: boolean };

        setRandomAds() {
            this.$scope.ads = this.ads[Math.floor(Math.random() * this.ads.length)];
        }

        dealWithAds() {
            this.setRandomAds();
        }
    }

    export class ContentController extends BaseController {
        static $inject = ['$scope', 'logger', '$routeParams', '$q'];

        constructor(public $scope: IContentScope, public logger, public $routeParams, $q) {
            super($scope, logger, $q);
        }

        public getBaseUrl(type) { return "/" + this.$routeParams.gameSlug + "/" + type + "s/" + this.$routeParams[type + "Id"] + "/" + this.$routeParams[type + "Slug"]; }
    }

    export class ContentModelController<TModel extends breeze.Entity> extends ContentController {
        static $inject = ['$scope', 'logger', '$routeParams', '$q', '$sce', 'model'];

        constructor(public $scope: IContentScopeT<TModel>, public logger, public $routeParams, $q: ng.IQService, $sce: ng.ISCEService, model: TModel) {
            super($scope, logger, $routeParams, $q);
            Debug.r.staging(() => {
                $(window).data("scope", this.$scope);
            });

            $scope.model = model;
            $scope.header = this.setupContentHeader(model);
            var anyModel = (<any>model);
            var keyWords = (anyModel.game ? anyModel.game.name + ", " : null)
                + $scope.header.contentType + ", " + $scope.header.title + ", "
                + (anyModel.tags ? anyModel.tags.join(', ') : null);

            $scope.setMicrodata({
                title: $scope.header.title,
                description: (<any>model).description || 'No description yet',
                image: 'https:' + $scope.header.getAvatar($scope.w6.imageSizes.bigRectangle.w, $scope.w6.imageSizes.bigRectangle.h),
                keywords: keyWords,
                currentPage: $scope.header.contentUrl
            });

            $scope.reportContent = () => {
                // TODO: Tell to login if not logged in...
                if (this.$scope.w6.userInfo.id) {
                    this.$scope.request(Components.Dialogs.OpenReportDialogQuery);
                };
            };

            this.entityManager = model.entityAspect.entityManager;

            this.editConfigDefaults = this._setupEditConfig({
                canEdit: () => {
                    throw new Error("Must Implement IEditConfigurationExtends.canEdit");
                    return false;
                },
                discardChanges: () => {
                    throw new Error("Must Implement IEditConfigurationExtends.discardChanges");
                    return false;
                }
            }, null, null);

            // TODO: Move to Directive..
            $scope.$on('$destroy', () => $('body').removeClass('game-profile'));
            $('body').removeClass('game-profile');
            $('body').addClass('game-profile');
        }

        public getContentAvatarUrl(avatar: string, updatedAt?: Date): string {
            if (!avatar || avatar == "")
                return null;
            return Tools.uriHasProtocol(avatar) ? avatar : this.$scope.url.getUsercontentUrl(avatar, updatedAt);
        }

        public getImageOrPlaceholder(image: string, width: number, height: number): string {
            return image == null ? this.$scope.url.getAssetUrl('img/play.withSIX/placeholders/' + width + 'x' + height + '.gif') : image;
        }

        public setupEditConfig = (editConfig: IEditConfigurationExtends<TModel>, watchForChanges: string[], changeGraph: string[]) => {
            this.$scope.editConfig = this._setupEditConfig(editConfig, watchForChanges, changeGraph);
        }; // TODO: This smells a lot like class material..
        // Either through a base controller class, or a separate class into which a controller and / or scope is passed into
        _setupEditConfig = (editConfig: IEditConfigurationExtends<TModel>, watchForChanges: string[], changeGraph: string[]): IEditConfiguration<TModel> => {
            var isEdited = (key, model) => {
                var entity = this.$scope.model;
                if (!(this.$scope.editConfig.canEdit() || this.$scope.editConfig.canManage()))
                    return false;
                if (model != null) {
                    return false;
                }

                return entity.entityAspect.originalValues.hasOwnProperty(key);
            };

            // TODO: These should be properties; generally this data does not change throughout a session
            // and if it does, it can be handled through events (scope.$broadcast, $emit, $on.  Or $watch etc).
            // See http://thenittygritty.co/angularjs-pitfalls-using-scopes on some reasons why functions should not be used, and properties/fields are preferred
            var canEdit = (() => {
                throw new Error("Must Implement IEditConfigurationExtends.canEdit");
                return () => { return false; };
            });
            var canManage = () => this.$scope.w6.userInfo.isAdmin || this.$scope.w6.userInfo.isManager;

            var closeEditing = () => {
                this.$scope.editConfig.editMode = false;
                this.$scope.editConfig.isManaging = false;
                return true;
            };
            var enableEditing = () => {
                if (!(this.$scope.editConfig.canEdit() || this.$scope.editConfig.canManage())) {
                    return false;
                }
                this.$scope.editConfig.editMode = true;
                this.$scope.editConfig.isManaging = this.$scope.editConfig.canManage();
                return true;
            };

            var discardChanges = (() => {
                throw new Error("Must Implement IEditConfigurationExtends.discardChanges");
                return () => { return false; };
            });

            var graphExpands = "";
            if (changeGraph) {
                graphExpands = changeGraph.join(",");
            }

            var saveChanges = (entity?: breeze.Entity, ...entities: breeze.Entity[]): Promise<breeze.SaveResult> => {
                var promise: Promise<breeze.SaveResult> = null;
                if (entity != null) {
                    var changedEntites: breeze.Entity[] = [];

                    entities.push(entity);

                    entities.forEach((v, i, arr) => {
                        if (!v.entityAspect.entityState.isUnchanged())
                            changedEntites.push(v);
                    });

                    promise = <any>this.entityManager.saveChanges(changedEntites);
                    promise.catch(reason => {
                        var reasons = (<string>(<any>breeze).saveErrorMessageService.getErrorMessage(reason)).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, "").replace(/[ ]\(\)[ ][-][ ]/g, ": ");

                        this.breezeQueryFailed({ message: 'Save failed, See Validation Errors Below:<br/><br/>' + reasons });
                        return (<breeze.SaveResult>{});
                    });
                } else {

                    var changedEntites: breeze.Entity[] = [];
                    var entities: breeze.Entity[] = (<any>this.entityManager).getEntityGraph(this.$scope.model, graphExpands);

                    entities.forEach((v, i, arr) => {
                        if (!v.entityAspect.entityState.isUnchanged())
                            changedEntites.push(v);
                    });

                    promise = <any>this.entityManager.saveChanges(changedEntites);
                    promise.catch(reason => {
                        var reasons = (<string>(<any>breeze).saveErrorMessageService.getErrorMessage(reason)).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, "").replace(/[ ]\(\)[ ][-][ ]/g, ": ");

                        this.breezeQueryFailed({ message: 'Save failed, See Validation Errors Below:<br/><br/>' + reasons });
                        return (<breeze.SaveResult>{});
                    });
                }
                return promise;
            };

            var hasChanges = () => {
                var graph = <breeze.Entity[]>(<any>this.entityManager).getEntityGraph(this.$scope.model, graphExpands);

                var changed = false;
                graph.forEach((v, i, arr) => {
                    changed = changed ? true : v.entityAspect.entityState.isAddedModifiedOrDeleted();
                });

                return changed;
            };

            var _editConfig = <IEditConfiguration<TModel>>{
                isEditing: editConfig.isEditing != null ? editConfig.isEditing : false,
                isManaging: editConfig.isManaging != null ? editConfig.isManaging : false,
                editMode: editConfig.editMode != null ? editConfig.editMode : false,
                canEdit: editConfig.canEdit != null ? editConfig.canEdit : canEdit(),
                canManage: editConfig.canManage != null ? editConfig.canManage : canManage,
                closeEditing: editConfig.closeEditing != null ? editConfig.closeEditing : closeEditing,
                enableEditing: editConfig.enableEditing != null ? editConfig.enableEditing : enableEditing,
                discardChanges: editConfig.discardChanges != null ? editConfig.discardChanges : discardChanges(),
                isEdited: editConfig.isEdited != null ? editConfig.isEdited : isEdited,
                saveChanges: editConfig.saveChanges != null ? editConfig.saveChanges : saveChanges,
                hasChanges: editConfig.hasChanges != null ? editConfig.hasChanges : hasChanges
            };

            var normalChangeWatch = ["model.author", "userInfo.id", "editConfig.isManaging", "editConfig.editMode"];

            if (watchForChanges != null)
                watchForChanges.forEach((value, index, array) => {
                    normalChangeWatch.push(value);
                });


            this.$scope.$watchGroup(normalChangeWatch, (newValue, oldValue, scope) => {
                this.$scope.editConfig.isEditing = ((this.$scope.editConfig.isManaging || this.$scope.editConfig.hasChanges()) && this.$scope.editConfig.canManage()) || (this.$scope.editConfig.canEdit() && this.$scope.editConfig.editMode);
            });

            this.$scope.$watch("editConfig.hasChanges()", (newValue: boolean, oldValue, scope) => {
                if (newValue == oldValue) return;

                this.$scope.editConfig.hasChangesProperty = newValue;

                if (newValue && !(this.$scope.editConfig.isEditing || this.$scope.editConfig.isManaging)) {
                    this.$scope.editConfig.enableEditing();
                }
            });

            return _editConfig;
        };
        public editConfigDefaults: IEditConfiguration<TModel> = null;

        public setupContentHeader(model: TModel): IContentHeader { throw new Error("setupContentHeader not implemented!"); }

        entityManager: breeze.EntityManager;
    }

    export class HelpItem<TScope> {
        constructor(public element: string, public data: IBsPopoverData, public conditional: ($scope: TScope) => boolean) {}

        public popover: any;
    }

    export interface IBsPopoverData {
        animation?: string;
        placement?: string;
        trigger?: string;
        title?: string;
        content?: string;
        html?: boolean;
        delay?: { show: number; hide: number; };
        container?: string;
        target?: string;
        template?: string;
        contentTemplate?: string;
        autoClose?: boolean;
        id?: string;
        viewport?: string;
    }

    export class ContentsController extends ContentBaseController {
        public getSubtitle() {
            var title = this.$routeParams['gameSlug'];
            if (title) title = title.toUpperCase();
            if (!title) title = this.$routeParams['userSlug'];
            if (title) title = title.replace("-", " ");
            return (title || 'Your');
        }
    }

    export class DialogControllerBase extends BaseController {
        static $inject = ['$scope', 'logger', '$modalInstance', '$q'];

        constructor($scope, logger, public $modalInstance, $q) {
            super($scope, logger, $q);

            $scope.$close = () => {
                $modalInstance.close();
            };
        }
    }

    export class ModelDialogControllerBase<TModel> extends DialogControllerBase {
        static $inject = ['$scope', 'logger', '$modalInstance', '$q', 'model'];

        constructor($scope, logger, public $modalInstance, $q, model: TModel) {
            super($scope, logger, $modalInstance, $q);
            $scope.model = model;
        }
    }
}
