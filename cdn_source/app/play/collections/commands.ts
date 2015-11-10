module MyApp.Play.Collections {
    export class GetCollectionQuery extends DbQueryBase {
        static $name = "GetCollection";

        public execute = [
            'gameSlug', 'collectionId', (gameSlug, collectionId) => this.executeKeyQuery<IBreezeCollection>(
                () => this.getEntityQueryFromShortId("Collection", collectionId)
                    .withParameters({ id: Tools.fromShortId(collectionId) }).expand("latestVersion"))
        ];
    }

    export class GetCollectionCommentsQuery extends DbQueryBase {
        static $name = 'GetCollectionComments';

        public execute = [
            'collectionId',
            (collectionId) => {
                Debug.log("getting collectioncomments by id: " + collectionId.toString());
                var query = breeze.EntityQuery.from("CollectionComments")
                    // TODO: Allow loading 'leafs' on the fly? Or another form of pagination?
                    // S.O or endless query?
                    //.where("replyToId", breeze.FilterQueryOp.Equals, null)
                    //.expand("replies")
                    .where("collectionId", breeze.FilterQueryOp.Equals, collectionId)
                    .orderByDesc("created");
                return this.context.executeQuery(query)
                    .then((result) => result.results);
            }
        ];
    }
    export class OpenRepoCollectionDialogQuery extends DialogQueryBase {
        static $name = 'OpenRepoCollectionDialog';

        public execute = ['model', (model) => this.openDialog(RepoCollectionDialogController, { /*windowTemplateUrl: "/cdn_source/app/components/dialogs/window-center-template.html",*/ resolve: { model: () => model } })]; //public execute = ['model', (model) => this.openDialog(ArchiveModDialogController, { size: 'sm|lg', resolve: { model: () => model } })]
        //public execute = ['model', (model) => this.createDialog(ArchiveModDialogController, model, {size: 'sm|lg'})]
        //public execute = (model) => this.createDialog(ArchiveModDialogController, {size: 'sm|lg'})
    }

    registerCQ(OpenRepoCollectionDialogQuery);

    export class CreateCollectionCommentCommand extends DbCommandBase implements ICQWM<ICreateComment<IBreezeCollectionComment>> {
        static $name = 'CreateCollectionComment';

        static $ModelType: ICreateComment<IBreezeCollectionComment> = null;
        public $ModelType = null;

        public execute = [
            'model', (model: ICreateComment<IBreezeCollectionComment>) => {
                var entity = <IBreezeCollectionComment>this.context.createEntity("CollectionComment", { collectionId: model.contentId, authorId: this.context.userInfo.id, message: model.message, created: new Date(Date.now()), replyToId: model.replyToId });
                if (model.replyTo) model.replyTo.replies.push(entity); // weird, why is this not automatic since we set replyToId?
                return this.context.saveChanges(undefined, [entity]);
            }
        ];
    }

    export class OpenNewCollectionWelcomeDialogQuery extends DialogQueryBase {
        static $name = 'OpenNewCollectionWelcomeDialog';

        public execute = ['model', 'editConfig', (model, editConfig) => this.openDialog(CollectionNewCollectionWelcomeDialogController, { /*windowTemplateUrl: "/cdn_source/app/components/dialogs/window-center-template.html",*/ resolve: { model: () => model, editConfig: () => editConfig } })];
    }

    registerCQ(OpenNewCollectionWelcomeDialogQuery);

    export class CollectionNewCollectionWelcomeDialogController extends ModelDialogControllerBase<{model: IBreezeCollection, repoLanding: boolean}> {
        static $name = 'CollectionNewCollectionWelcomeDialogController';
        static $view = '/cdn_source/app/play/collections/dialogs/new-collection-welcome.html';

        static $inject = ['$scope', 'logger', '$modalInstance', '$q', 'model', 'editConfig'];

        constructor(public $scope, public logger, $modalInstance, $q, model: {model: IBreezeCollection, repoLanding: boolean}, editConfig: IEditConfiguration<IBreezeMod>) {
            super($scope, logger, $modalInstance, $q, model);

            //$scope.editconfig = editConfig;

            $scope.edit = () => {
                editConfig.enableEditing();
                $scope.$close();
            };
        }
    }

    registerController(CollectionNewCollectionWelcomeDialogController);

    export class DeleteCollectionCommentCommand extends DbCommandBase {
        static $name = 'DeleteCollectionComment';

        public execute = [
            'model', (model: IBreezeCollectionComment) => {
                Debug.log('Delete comment', model);
                model.archivedAt = new Date(Date.now());
                return this.context.saveChanges(undefined, [model]);
            }
        ];
    }

    export class GetForkedCollectionsQuery extends DbQueryBase {
        static $name = 'GetForkedCollections';

        // TOdo: mISSING IS:             if($scope.model.forkedCollectionId) $scope.model.entityAspect.loadNavigationProperty("forkedCollection");
        public execute = [
            'collectionId', 'gameSlug',
            (collectionId, gameSlug) => this.context.executeQuery(breeze.EntityQuery.from("Collections")
                .where(new breeze.Predicate("game.slug", breeze.FilterQueryOp.Equals, gameSlug).and(new breeze.Predicate("forkedCollectionId", breeze.FilterQueryOp.Equals, Tools.fromShortId(collectionId)))))
            .then(result => result.results)
        ];
    }


    export class SaveCollectionCommentCommand extends DbCommandBase implements ICQWM<IBreezeCollectionComment> {
        static $name = 'SaveCollectionComment';
        public $ModelType = null;

        public execute = [
            'model', (model: IBreezeCollectionComment) => {
                //model.entityAspect.setDeleted();
                return this.context.saveChanges(undefined, [model]);
            }
        ];
    }

    export class GetCollectionCommentLikeStateQuery extends DbQueryBase {
        static $name = 'GetCollectionCommentLikeState';
        public execute = ['collectionId', collectionId => this.context.getCustom('comments/collections/' + collectionId + "/states")];
    }

    registerCQ(GetCollectionCommentLikeStateQuery);

    export class LikeCollectionCommentCommand extends DbCommandBase {
        static $name = 'LikeCollectionCommentCommand';
        public execute = ['id', id => this.context.postCustom("comments/collection/" + id + "/" + "like")];
    }

    registerCQ(LikeCollectionCommentCommand);

    export class UnlikeCollectionCommentCommand extends DbCommandBase {
        static $name = 'UnlikeCollectionCommentCommand';
        public execute = ['id', id => this.context.postCustom("comments/collection/" + id + "/" + "unlike")];
    }

    registerCQ(UnlikeCollectionCommentCommand);

    export class SubscribeCollectionCommand extends DbCommandBase {
        static $name = 'SubscribeCollectionCommand';
        public execute = [
            'model', (model: IBreezeCollection) =>
            this.context.postCustom("collections/" + model.id + "/subscribe")
        ];
    }

    registerCQ(SubscribeCollectionCommand);

    export class UnsubscribeCollectionCommand extends DbCommandBase {
        static $name = 'UnsubscribeCollectionCommand';
        public execute = [
            'model', (model: IBreezeCollection) =>
            this.context.postCustom("collections/" + model.id + "/unsubscribe")
        ];
    }

    registerCQ(UnsubscribeCollectionCommand);

    export class GetCollectionContentTagsQuery extends DbQueryBase {
        static $name = 'GetCollectionContentTags';
        public execute = [
            'id', id => this.context.getCustom('collectionversions/' + id + '/contenttags')
            .then(r => r.data)
        ];
    }

    registerCQ(GetCollectionContentTagsQuery);

    registerCQ(GetForkedCollectionsQuery);
    registerCQ(GetCollectionQuery);
    registerCQ(GetCollectionCommentsQuery);
    registerCQ(CreateCollectionCommentCommand);
    registerCQ(DeleteCollectionCommentCommand);
    registerCQ(SaveCollectionCommentCommand);
}
