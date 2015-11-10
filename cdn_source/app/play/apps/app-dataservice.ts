module MyApp.Play.ContentIndexes.Apps {
    // DEPRECATED: Convert to Queries/Commands
    export class AppDataService extends W6ContextWrapper {
        static $name = 'appDataService';
        public filterPrefixes = ["tag:", "user:"];

        constructor(public $http: ng.IHttpService, public $q: ng.IQService, public $timeout, public brz,
            public logger: Components.Logger.ToastLogger, public options, public userInfo, context) {
            super($http, $q, $timeout, brz, logger, options, userInfo, context);
        }

        public getAllAppsByGame(gameSlug, options): Promise<IQueryResult<IBreezeApp>> {
            Debug.log("getting apps by game: " + gameSlug);
            // TODO: THis doesnt really work, we need to somehow query for the Slug of a game containing the GameSlug, but get an error ;-)
            var query = breeze.EntityQuery.from("Apps")
                .where("games.slug", breeze.FilterQueryOp.Contains, gameSlug);

            return this.applyQuery(query, options);
        }

        public getAllAppsByUser(userSlug, options): Promise<IQueryResult<IBreezeApp>> {
            Debug.log("getting apps by user: " + userSlug);
            var query = breeze.EntityQuery.from("Apps")
                .where("author.slug", breeze.FilterQueryOp.Equals, userSlug);

            return this.applyQuery(query, options);
        }

        public getAllApps(options): Promise<IQueryResult<IBreezeApp>> {
            Debug.log("getting apps");
            var query = breeze.EntityQuery.from("Apps");

            return this.applyQuery(query, options);
        }

        applyQuery(query, options): Promise<IQueryResult<IBreezeApp>> {
            query = this.applyFiltering(query, options.filter, true);

            if (query == null)
                return <any> this.$q.reject("invalid query");

            query = query.orderBy(this.context.generateOrderable(options.sort));

            query = this.context.applyPaging(query, options.pagination);
            return this.context.executeQueryT<IBreezeApp>(query);
        }
    }

    registerService(AppDataService);
}