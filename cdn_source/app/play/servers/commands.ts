module MyApp.Play.Servers {
    export class GetServerQuery extends DbQueryBase {
        static $name = 'GetServer';

        public execute = [
            'gameSlug', 'serverId', (gameSlug, serverId) => this.executeKeyQuery<IBreezeServer>(
                () => this.getEntityQueryFromShortId("Server", serverId)
                .withParameters({ id: Tools.fromShortId(serverId) })
                .expand("players"))
        ];
    }

    registerCQ(GetServerQuery);
}

module MyApp.Play.ContentIndexes.Servers {
    export class OpenAddServerDialogQuery extends DialogQueryBase {
        static $name = 'OpenAddServerDialog';
        public execute = ['gameSlug', gameSlug => this.openDialog(AddServerDialogController, { resolve: { gameSlug: gameSlug } })];
    }

    export class AddServerCommand extends DbCommandBase {
        static $name = 'AddServer';

        public execute = [
            'address', 'gameSlug', 'isQueryPort',
            (address, gameSlug, isQueryPort) => this.context.postCustom("/servers/add", { address: address, gameSlug: gameSlug, isQueryPort: isQueryPort })
        ];
    }

    registerCQ(OpenAddServerDialogQuery);
    registerCQ(AddServerCommand);

}