module MyApp.Play.ContentIndexes.Servers {
    // DEPRECATED: Convert to Queries/Commands
    export class ServerDataService extends W6ContextWrapper {
        static $name = 'serverDataService';
        public filterPrefixes = ["mod:", "user:", "tag:", "mission:", "island:", "mode:", "ip:", "country:"];

        constructor(public $http: ng.IHttpService, public $q: ng.IQService, public $timeout, public brz,
            public logger: Components.Logger.ToastLogger, public options, public userInfo, dbContext) {
            super($http, $q, $timeout, brz, logger, options, userInfo, dbContext);
        }

        public getAllServersByGame(gameSlug, options): Promise<breeze.QueryResult> {
            Debug.log("getting servers by game: " + gameSlug);
            var query = breeze.EntityQuery.from("Servers")
                .where("game.slug", breeze.FilterQueryOp.Equals, gameSlug);

            query = this.applyFiltering(query, options.filter, true);

            if (query == null)
                return <any> this.$q.reject("invalid query");

            query = query.orderBy(this.context.generateOrderable(options.sort));

            query = this.context.applyPaging(query, options.pagination);
            return this.context.executeQuery(query);
        }

        public getAllServersByAuthor(authorSlug, options): Promise<breeze.QueryResult> {
            Debug.log("getting servers by author: " + authorSlug);
            var query = breeze.EntityQuery.from("Servers")
                .where("owner.slug", breeze.FilterQueryOp.Equals, authorSlug);

            query = this.applyFiltering(query, options.filter, true);

            if (query == null)
                return <any> this.$q.reject("invalid query");

            query = query.orderBy(this.context.generateOrderable(options.sort));

            query = this.context.applyPaging(query, options.pagination);
            return this.context.executeQuery(query);
        }

        public getServerTagsByGame(gameSlug: string, name: string) {
            Debug.log("getting Servers by game: " + gameSlug + ", " + name);

            var op = this.context.getOpByKeyLength(name);
            var key = name.toLowerCase();

            var query = breeze.EntityQuery.from("Servers")
                .where(new breeze.Predicate("game.slug", breeze.FilterQueryOp.Equals, gameSlug).and(
                    new breeze.Predicate("toLower(name)", op, key)))
                .orderBy("name")
                .take(this.context.defaultTakeTag);
            return this.context.executeQuery(query);
        }

        public applyFiltering(query, filterOptions, inclAuthor) {
            if (filterOptions.minPlayers != -1)
                query = query.where("numPlayers", breeze.FilterQueryOp.GreaterThanOrEqual, filterOptions.minPlayers);

            if (filterOptions.maxPlayers != -1)
                query = query.where("maxPlayers", breeze.FilterQueryOp.LessThanOrEqual, filterOptions.maxPlayers);

            if (filterOptions.text != undefined && filterOptions.text != '') {
                query = this.queryText(query, filterOptions.text, inclAuthor);
                if (query == null)
                    return null;
            }

            return query;
        }


        public queryText(query, filterText, inclAuthor) {
            if (filterText == "")
                return query;

            var info = <any>W6Context.searchInfo(filterText, false, this.filterPrefixes);

            return this.context.buildPreds(query, [
                this.context.findInField(info.mod, ["mod"], undefined),
                this.context.getNameQuery(info.name),
                this.context.getTagsQuery(info.tag),
                this.context.getAuthorQuery(info.user),
                this.context.findInField(info.mission, ["missionName"], undefined),
                this.context.findInField(info.mode, ["gameMode"], undefined),
                this.context.findInField(info.island, ["islandName"], undefined),
                this.context.findInField(info.ip, ["ipAddress"], undefined)
            ]);
        }

        getServerTagsByAuthor(userSlug, name: string) {
            Debug.log("getting Servertags by user: " + userSlug + ", " + name);

            var op = this.context.getOpByKeyLength(name);
            var key = name.toLowerCase();

            var query = breeze.EntityQuery.from("Servers")
                .where(new breeze.Predicate("author.slug", breeze.FilterQueryOp.Equals, userSlug).and(
                    new breeze.Predicate("toLower(name)", op, key)))
                .orderBy("name")
                .take(this.context.defaultTakeTag);
            return this.context.executeQuery(query);
        }
    }

    registerService(ServerDataService);
}