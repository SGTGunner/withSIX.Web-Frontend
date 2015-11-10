module MyApp.Play.Games {
    
    export class OpenAddModDialogQuery extends DbQueryBase {
        static $inject = ['dbContext', '$modal', 'logger'];
        static $name = 'OpenAddModDialog';

        constructor(context: W6Context, private $modal, private logger) { super(context); }

        public execute = [
            'gameSlug',
            (gameSlug) => {

                Debug.log(this.$modal);
                return DialogQueryBase.openDialog(this.$modal, AddModDialogController, {
                    resolve: {
                        game: () => this.findBySlug("Games", gameSlug, "getGame")
                    }
                });
            }
        ];
    }

    registerCQ(OpenAddModDialogQuery);

    export class OpenAddCollectionDialogQuery extends DbQueryBase {
        static $inject = ['dbContext', '$modal', 'logger'];
        static $name = 'OpenAddCollectionDialog';

        constructor(context: W6Context, private $modal, private logger) { super(context); }

        public execute = [
            'gameSlug',
            (gameSlug) => {

                Debug.log(this.$modal);
                return DialogQueryBase.openDialog(this.$modal, AddCollectionDialogController, {
                    resolve: {
                        game: () => this.findBySlug("Games", gameSlug, "getGame")
                    }
                });
            }
        ];
    }

    registerCQ(OpenAddCollectionDialogQuery);

    export class GetGamesQuery extends DbQueryBase {
        static $name = "GetGames";

        public execute = [
            () => this.context.executeQuery(breeze.EntityQuery.from("Games")
                .where("parentId", breeze.FilterQueryOp.Equals, null)
                .where("public", breeze.FilterQueryOp.Equals, true) // ... 
                .orderBy("name"))
            .then(data => data.results)
        ];
    }

    registerCQ(GetGamesQuery);

    export class GetGameQuery extends DbQueryBase {
        static $name = "GetGame";

        public execute = ['gameSlug', gameSlug => this.findBySlug("Games", gameSlug, "getGame")];
    }

    registerCQ(GetGameQuery);

    export class GetStreamQuery extends DbQueryBase {
        static $name = "GetStream";
        public execute = [
            'gameSlug', 'streamType', (gameSlug, streamType) => this.context.getCustom("games/" + gameSlug + "/stream?streamType=" + streamType)
            .then(result => result.data)
        ];
    }

    registerCQ(GetStreamQuery);

    export class NewModCommand extends DbCommandBase {
        static $name = 'NewMod';
        public execute = ['data', data => this.context.postCustom("mods", data, { requestName: 'postNewMod' }).then(r => r.data['result'])];
    }

    registerCQ(NewModCommand);
    export class NewImportedCollectionCommand extends DbCommandBase {
        static $name = 'NewImportedCollection';
        public execute = ['data', data => this.context.postCustom("collections/import-repo", data, { requestName: 'postNewCollection' })/*.then(r => r.data['result'])*/];
    }

    registerCQ(NewImportedCollectionCommand);

    export class NewMultiImportedCollectionCommand extends DbCommandBase {
        static $name = 'NewMultiImportedCollection';
        public execute = ['data', data => this.context.postCustom("collections/import-server", data, { requestName: 'postNewCollection' })/*.then(r => r.data['result'])*/];
    }

    registerCQ(NewMultiImportedCollectionCommand);

    export class GetCheckLinkQuery extends DbCommandBase {
        static $name = 'GetCheckLink';
        public execute = ['linkToCheck', linkToCheck => this.context.getCustom<BooleanResult>("cool/checkLink", { requestName: 'checkLink', params: { linkToCheck: linkToCheck } }).then(result => result.data.result)];
    }

    registerCQ(GetCheckLinkQuery);

    export class GetPersonalStreamQuery extends DbQueryBase {
        static $name = "GetPersonalStream";
        public execute = [
            'gameSlug', 'streamType', (gameSlug, streamType) => this.context.getCustom("games/" + gameSlug + "/stream/personal?streamType=" + streamType)
            .then(result => result.data)
        ];
    }

    registerCQ(GetPersonalStreamQuery);

    export class GetDashboardQuery extends DbQueryBase {
        static $name = "GetDashboard";

        public execute = [
            () => {
                throw new Error("Not implemented");
            }
        ];
    }

    registerCQ(GetDashboardQuery);
}