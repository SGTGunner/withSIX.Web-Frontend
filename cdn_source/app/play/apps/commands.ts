module MyApp.Play.Apps {
    export class GetAppQuery extends DbQueryBase {
        static $name = "GetApp";

        public execute = [
            'gameSlug', 'appId', (gameSlug, appId) => this.executeKeyQuery<IBreezeApp>(
                () => this.getEntityQueryFromShortId("App", appId)
                .withParameters({ id: Tools.fromShortId(appId) })
                .expand("games"))
        ];
    }

    registerCQ(GetAppQuery);
}