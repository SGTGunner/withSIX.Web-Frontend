module MyApp.Play.Mods {
    export class OpenClaimDialogQuery extends DbQueryBase {
        static $inject = ['dbContext', '$modal', 'logger'];
        static $name = 'OpenClaimDialog';

        constructor(context: W6Context, private $modal, private logger) { super(context); }

        public execute = [
            'gameSlug', 'modId',
            (gameSlug, modId) => {
                Debug.log("getting mod by id: " + modId);
                var id = Tools.fromShortId(modId).toString();
                // TODO: Convert to entityKeyQuery
                var query = breeze.EntityQuery.from("Mods")
                    .where("id", breeze.FilterQueryOp.Equals, id)
                    .top(1);

                return DialogQueryBase.openDialog(this.$modal, ClaimDialogController, {
                    resolve: {
                        mod: () => this.context.executeQuery(query, "loadClaimDialog").then(result => result.results[0]),
                        supportsClaiming: () => this.context.getCustom<BooleanResult>("mods/" + id + "/supportsClaiming", { requestName: 'loadClaimDialog' })
                            .then(result => result.data.result)
                    }
                });
            }
        ];
    }

    export class GetForumPostQuery extends DbQueryBase {
        static $name = 'GetForumPost';
        public execute = ['forumUrl', forumUrl => this.context.getCustom('cool/forumPost', { params: { forumUrl: forumUrl }, requestName: 'getForumPost' }).then(r => r.data)];
    }

    registerCQ(GetForumPostQuery);

    export class GetModQuery extends DbQueryBase {
        static $name = 'GetMod';
        //this.$q.reject(rejection)
        public execute = [
            'modId', modId => this.executeKeyQuery<IBreezeMod>(
                () => this.getEntityQueryFromShortId("Mod", modId)
                .withParameters({ id: Tools.fromShortId(modId) })
                .expand(["dependencies", "mediaItems"])) //.then((result) => {
            //    debugger;
            //    return result;
            //}, (result) => {
            //    debugger;
            //}, (result) => {
            //            debugger;
            //})
        ];
    }

    export class GetModRelatedQuery extends DbQueryBase {
        static $name = 'GetModRelated';

        // CollectionInMod and DependentMod have no actual endpoints
        // CollectionInMod is also harder to query from the other direction
        // So we use a workaround - we actually re-get the mod but this time with collections+dependents, breeze will take care of merging with the existing object
        // and we only have slight overhead of grabbing the basic mod info again..
        public execute = [
            'modId', modId => this.executeKeyQuery<IBreezeMod>(
                () => this.getEntityQueryFromShortId("Mod", modId)
                .withParameters({ id: Tools.fromShortId(modId) })
                .expand(["collections", "dependents"]))
        ];
    }

    registerCQ(GetModRelatedQuery);

    export class GetModCreditsQuery extends DbQueryBase {
        static $name = 'GetModCredits';

        public execute = [
            'modId', modId => {
                var query = breeze.EntityQuery.from(BreezeEntityGraph.ModUserGroup.$name + "s")
                    .where("modId", breeze.FilterQueryOp.Equals, Tools.fromShortId(modId));
                return this.context.executeQuery(query);
            }
        ];
    }

    registerCQ(GetModCreditsQuery);

    export class GetEditModQuery extends DbQueryBase {
        static $name = 'GetEditMod';

        public execute = [
            'modId', modId => this.executeKeyQuery<IBreezeMod>(
                () => this.getEntityQueryFromShortId("Mod", modId)
                .withParameters({ id: Tools.fromShortId(modId) })
                .expand(["collections", "dependencies", "dependents", "info"]))
            .then(m => {
                if (!m.info) m.info = <IBreezeModInfo> this.context.createEntity("ModInfo", { modId: m.id });
                return m;
            })
        ];
    }

    registerCQ(GetEditModQuery);

    export class GetModCommentsQuery extends DbQueryBase {
        static $name = 'GetModComments';

        public execute = [
            'modId',
            (modId) => {
                Debug.log("getting modcomments by id: " + modId.toString());
                var query = breeze.EntityQuery.from("ModComments")
                    .where("modId", breeze.FilterQueryOp.Equals, modId)
                    .orderByDesc("created");
                return this.context.executeQuery(query)
                    .then((result) => result);
            }
        ];
    }

    export class GetModFileQuery extends DbQueryBase {
        static $name = 'GetModFile';
        public execute = [
            'gameSlug', 'modId', 'fileType', (gameSlug, modId, fileType) => this.executeKeyQuery<IBreezeMod>(
                () => this.getEntityQueryFromShortId("ModInfo", modId)
                .withParameters({ modId: Tools.fromShortId(modId) })
                .select(fileType))
            .then(info => {
                Debug.log("info", info);
                return {
                    fileTitle: fileType,
                    fileContent: info[fileType]
                };
            })
        ];
    }

    export class GetModUpdatesQuery extends DbQueryBase {
        static $name = 'GetModUpdates';

        public execute = [
            'modId',
            (modId) => {
                Debug.log("getting modupdates by id: " + modId.toString());
                var query = breeze.EntityQuery.from("ModUpdates")
                    .where("modId", breeze.FilterQueryOp.Equals, modId)
                    .orderByDesc("created");
                return this.context.executeQuery(query)
                    .then((result) => result);
            }
        ];
    }


    export class GetClaimQuery extends DbQueryBase {
        static $name = 'GetClaim';
        public execute = ['modId', (modId) => { return this.context.getCustom("mods/" + modId + "/claim", { requestName: 'getClaim' }); }];
    }

    export class VerifyClaimCommand extends DbCommandBase {
        static $name = 'VerifyClaim';
        public execute = ['modId', (modId) => { return this.context.postCustom("mods/" + modId + "/claim", undefined, { requestName: 'verifyToken' }); }];
    }

    export class SaveModCommand extends DbCommandBase {
        static $name = 'SaveMod';
        static $inject = ['dbContext', '$q', 'UploadService'];

        constructor(context: W6Context, $q, private uploadService: Components.Upload.UploadService) {
            super(context);
        }

        public execute = [
            'modId', 'data', 'editData', (modId, data, editData) => {
                if (debug) Debug.log(data, editData);
                data.dependencies.forEach(x => {
                    var found = false;
                    for (var i in editData.editDependencies) {
                        var d = editData.editDependencies[i];
                        if (d.key == x.name) {
                            found = true;
                            break;
                        }
                    }
                    if (!found)
                        x.entityAspect.setDeleted();
                });

                editData.editDependencies.forEach(x => {
                    var found = false;
                    for (var i in data.dependencies) {
                        var d = data.dependencies[i];
                        if (d.name == x.key) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) // data.dependencies.add(
                        this.context.createEntity("ModDependency", { id: x.id, modId: data.id, mod: data, name: x.key });
                });

                var tags = [];
                for (var i in editData.editCategories) {
                    var t = editData.editCategories[i];
                    tags.push(t.key);
                }

                data.tags = tags;

                var aliases = [];
                for (var i in editData.editAliases) {
                    var a = editData.editAliases[i];
                    aliases.push(a.key);
                }
                data.aliases = aliases.length == 0 ? null : aliases.join(";");

                // todo: Progresses for logo and gallery

                var promises = [];
                if (editData.logoToUpload)
                    promises.push(this.uploadLogo(modId, editData.logoToUpload));

                if (editData.galleryToUpload)
                    promises.push(this.uploadGallery(modId, editData.galleryToUpload));

                return this.context.$q.all(promises)
                    .then((result) => this.context.saveChanges('saveMod'));
            }
        ];

        private uploadLogo(modId, logo) {
            return this.uploadService.uploadToAmazon(logo, "mods/" + modId + "/logoupload", "ModLogo");
        }

        private uploadGallery(modId, gallery) {
            //this.$scope.upload = [];
            var promises = [];
            for (var i in gallery) {
                var file = gallery[i];
                promises.push(this.uploadService.uploadToAmazon(file, "mods/" + modId + "/galleryupload", "ModMediaItem"));
            }

            return this.context.$q.all(promises);
        }
    }

    //export class OpenDependenciesDialogQuery extends DialogQueryBase {
    //    static $name = 'OpenDependenciesDialog';
    //    public execute = ['mod', mod => this.openDialog(DependenciesDialogController, { size: "md", windowTemplateUrl: "app/components/dialogs/window-center-template.html", resolve: { model: () => mod } })]
    //}

    //export class OpenSetAuthorDialogQuery extends DialogQueryBase {
    //    static $name = 'OpenSetAuthorDialog';
    //    public execute = ['mod', mod => this.createDialog(SetAuthorDialogController, mod, { size: "" })]
    //}

    export class CreateModCommentCommand extends DbCommandBase implements ICQWM<ICreateComment<IBreezeModComment>> {
        static $name = 'CreateModComment';

        static $ModelType = null;
        public $ModelType: ICreateComment<IBreezeModComment> = null;

        public execute = [
            'model', (model: ICreateComment<IBreezeModComment>) => {
                var entity = <IBreezeModComment>this.context.createEntity("ModComment", { modId: model.contentId, authorId: this.context.userInfo.id, message: model.message, created: new Date(Date.now()), replyToId: model.replyToId });
                if (model.replyTo) model.replyTo.replies.push(entity); // weird, why is this not automatic since we set replyToId?
                return this.context.saveChanges(undefined, [entity]);
            }
        ];
    }

    export class DeleteModCommentCommand extends DbCommandBase {
        static $name = 'DeleteModComment';

        public execute = [
            'model', (model: IBreezeModComment) => {
                Debug.log('Delete comment', model);
                model.archivedAt = new Date(Date.now());
                return this.context.saveChanges(undefined, [model]);
            }
        ];
    }

    export class SaveModCommentCommand extends DbCommandBase {
        static $name = 'SaveModComment';

        public execute = [
            'model', (model: IBreezeModComment) => {
                //model.entityAspect.setDeleted();
                return this.context.saveChanges(undefined, [model]);
            }
        ];
    }

    export class GetModCommentLikeStateQuery extends DbQueryBase {
        static $name = 'GetModCommentLikeState';
        public execute = ['modId', modId => this.context.getCustom('comments/mods/' + modId + "/states")];
    }

    registerCQ(GetModCommentLikeStateQuery);

    export class LikeModCommentCommand extends DbCommandBase {
        static $name = 'LikeModCommentCommand';
        public execute = ['id', id => this.context.postCustom("comments/mod/" + id + "/" + "like")];
    }

    registerCQ(LikeModCommentCommand);

    export class UnlikeModCommentCommand extends DbCommandBase {
        static $name = 'UnlikeModCommentCommand';
        public execute = ['id', id => this.context.postCustom("comments/mod/" + id + "/" + "unlike")];
    }

    registerCQ(UnlikeModCommentCommand);

    export class FollowModCommand extends DbCommandBase {
        static $name = 'FollowModCommand';
        public execute = [
            'model', (model: IBreezeMod) =>
            this.context.postCustom("mods/" + model.id + "/follow")
        ];
    }

    registerCQ(FollowModCommand);

    export class UnfollowModCommand extends DbCommandBase {
        static $name = 'UnfollowModCommand';
        public execute = [
            'model', (model: IBreezeMod) =>
            this.context.postCustom("mods/" + model.id + "/unfollow")
        ];
    }

    export class CancelUploadRequestQuery extends DbCommandBase {
        static $name = 'CancelUploadRequest';
        public execute = ['requestId', 'force', (requestId, force) => this.context.getCustom<BooleanResult>("cool/cancelUploadRequest", { requestName: 'cancelUploadRequest', params: { requestId: requestId, force: force } }).then(result => result.data.result)];
    }

    registerCQ(CancelUploadRequestQuery);

    export class ApproveUploadRequestQuery extends DbCommandBase {
        static $name = 'ApproveUploadRequest';
        public execute = ['requestId', (requestId) => this.context.getCustom<BooleanResult>("cool/approveUpload", { requestName: 'approveUpload', params: { requestId: requestId } }).then(result => result.data.result)];
    }

    registerCQ(ApproveUploadRequestQuery);

    export class DenyUploadRequestQuery extends DbCommandBase {
        static $name = 'DenyUploadRequest';
        public execute = ['requestId', (requestId) => this.context.getCustom<BooleanResult>("cool/denyUpload", { requestName: 'denyUpload', params: { requestId: requestId } }).then(result => result.data.result)];
    }

    registerCQ(DenyUploadRequestQuery);

    registerCQ(UnfollowModCommand);

    registerCQ(GetModQuery);
    registerCQ(GetModCommentsQuery);
    registerCQ(GetModUpdatesQuery);
    registerCQ(GetModFileQuery);
    registerCQ(CreateModCommentCommand);
    registerCQ(DeleteModCommentCommand);
    registerCQ(SaveModCommentCommand);
    registerCQ(GetClaimQuery);
    registerCQ(OpenClaimDialogQuery);
    registerCQ(VerifyClaimCommand);
    registerCQ(SaveModCommand);

//registerCQ(OpenDependenciesDialogQuery);
    //registerCQ(OpenSetAuthorDialogQuery);


    export class OpenModDeleteRequestDialogQuery extends DialogQueryBase {
        static $name = 'OpenModDeleteRequestDialog';

        public execute = ['model', (model) => this.openDialog(ModDeleteRequestDialogController, { /*windowTemplateUrl: "/cdn_source/app/components/dialogs/window-center-template.html",*/ resolve: { model: () => model } })];
    }

    registerCQ(OpenModDeleteRequestDialogQuery);

    export class OpenModUploadDialogQuery extends DialogQueryBase {
        static $name = 'ModUploadDialog';

        public execute = ['model', (model) => this.openDialog(UploadVersionDialogController, { /*windowTemplateUrl: "/cdn_source/app/components/dialogs/window-center-template.html",*/ resolve: { model: () => model } })];
    }

    registerCQ(OpenModUploadDialogQuery);

    export class ModVersionHistoryDialogQuery extends DialogQueryBase {
        static $name = 'ModVersionHistoryDialog';

        public execute = ['model', (model) => this.openDialog(ModVersionHistoryDialogController, { /*windowTemplateUrl: "/cdn_source/app/components/dialogs/window-center-template.html",*/ resolve: { model: () => model } })];
    }

    registerCQ(ModVersionHistoryDialogQuery);

    export class NewModVersionCommand extends DbCommandBase {
        static $name = 'NewModVersion';
        public execute = ['data', data => this.context.postCustom("mods/" + data.modId + "/versions", data, { requestName: 'postNewModUpload' })];
    }

    registerCQ(NewModVersionCommand);

    export class OpenNewModWelcomeDialogQuery extends DialogQueryBase {
        static $name = 'OpenNewModWelcomeDialog';

        public execute = ['model', 'editConfig', (model, editConfig) => this.openDialog(ModNewModWelcomeDialogController, { /*windowTemplateUrl: "/cdn_source/app/components/dialogs/window-center-template.html",*/ resolve: { model: () => model, editConfig: () => editConfig } })];
    }

    registerCQ(OpenNewModWelcomeDialogQuery);

    export class OpenArchiveModDialogQuery extends DialogQueryBase {
        static $name = 'ArchiveModDialog';

        public execute = ['model', (model) => this.openDialog(ArchiveModDialogController, { /*windowTemplateUrl: "/cdn_source/app/components/dialogs/window-center-template.html",*/ resolve: { model: () => model } })]; //public execute = ['model', (model) => this.openDialog(ArchiveModDialogController, { size: 'sm|lg', resolve: { model: () => model } })]
        //public execute = ['model', (model) => this.createDialog(ArchiveModDialogController, model, {size: 'sm|lg'})]
        //public execute = (model) => this.createDialog(ArchiveModDialogController, {size: 'sm|lg'})
    }

    registerCQ(OpenArchiveModDialogQuery);


    export class UploadVersionDialogQuery extends DialogQueryBase {
        static $name = 'UploadVersionDialog';

        public execute = ['model', (model) => this.openDialog(UploadVersionDialogController, { /*windowTemplateUrl: "/cdn_source/app/components/dialogs/window-center-template.html",*/ resolve: { model: () => model } })]; //public execute = ['model', (model) => this.openDialog(ArchiveModDialogController, { size: 'sm|lg', resolve: { model: () => model } })]
        //public execute = ['model', (model) => this.createDialog(ArchiveModDialogController, model, {size: 'sm|lg'})]
        //public execute = (model) => this.createDialog(ArchiveModDialogController, {size: 'sm|lg'})
    }

    registerCQ(UploadVersionDialogQuery);

    export class ModExistsQuery extends DbQueryBase {
        static $name = "ModExists";
        public execute = [
            'packageName', packageName => {
                if (!packageName || packageName.length == 0) return false;
                //var cache = this.context.getModExistsCache(mod);
                //if (cache === false || cache === true) return cache;

                return <any>this.context.getCustom("mods/package-name-exists", { params: { packageName: packageName } })
                    .then(result => (<any>result.data).result);
            }
        ];
    }

    registerCQ(ModExistsQuery);
}

module MyApp.Play.ContentIndexes.Mods {

    export class GetModTagsQuery extends DbQueryBase {
        static $name = "GetModTags";

        public execute = [
            'gameSlug', 'query', (gameSlug, name) => {
                Debug.log("getting mods by game: " + gameSlug + ", " + name);

                var op = this.context.getOpByKeyLength(name);
                var key = name.toLowerCase();

                var query = breeze.EntityQuery.from("Mods")
                    .where(new breeze.Predicate("game.slug", breeze.FilterQueryOp.Equals, gameSlug).and(
                        new breeze.Predicate("toLower(packageName)", op, key)
                        .or(new breeze.Predicate("toLower(name)", op, key))))
                    .orderBy("packageName")
                    .select(["packageName", "name", "id"])
                    .take(this.context.defaultTakeTag);

                return this.context.executeQuery(query)
                    .then((data) => data.results);
            }
        ];
    }

    registerCQ(GetModTagsQuery);

    export class GetModTagsQueryByUser extends DbQueryBase {
        static $name = "GetModTagsByUser";

        public execute = [
            'userSlug', 'query', (userSlug, name) => {
                Debug.log("getting mods by user: " + userSlug + ", " + name);

                var op = this.context.getOpByKeyLength(name);
                var key = name.toLowerCase();

                var query = breeze.EntityQuery.from("Mods")
                    .where(new breeze.Predicate("author.slug", breeze.FilterQueryOp.Equals, userSlug).and(
                        new breeze.Predicate("toLower(packageName)", op, key)
                        .or(new breeze.Predicate("toLower(name)", op, key))))
                    .orderBy("packageName")
                    .select(["packageName", "name", "id"])
                    .take(this.context.defaultTakeTag);

                return this.context.executeQuery(query)
                    .then((data) => data.results);
            }
        ];
    }

    registerCQ(GetModTagsQueryByUser);

    export class GetCategoriesQuery extends DbQueryBase {
        static $name = "GetCategories";

        public execute = [
            'query', (name) => {
                Debug.log("getting mod tags, " + name);
                var query = breeze.EntityQuery.from("ModTags")
                    .where(new breeze.Predicate("toLower(name)", breeze.FilterQueryOp.Contains, name.toLowerCase()))
                    .orderBy("name")
                    .select(["name"])
                    .take(24);
                return this.context.executeQuery(query)
                    .then((data) => data.results);
            }
        ];
    }

    registerCQ(GetCategoriesQuery);

    export class GetModUserTagsQuery extends DbQueryBase {
        static $name = "GetModUserTags";
        static $inject = ['dbContext', '$commangular'];

        constructor(context: W6Context, private $commangular) {
            super(context);
        }

        public escapeIfNeeded(str) {
            return str.indexOf(" ") != -1 ? "\"" + str + "\"" : str;
        }

        public execute = [
            'query', 'gameSlug', (name: string, gameSlug: string) => {
                if (gameSlug == null) return this.$commangular.dispatch(GetUserTagsQuery.$name, { query: name }).then(r => r.lastResult);

                return this.context.$q.all([
                        this.$commangular.dispatch(GetUsersQuery.$name, { query: name }).then(r => r.lastResult), this.context.executeQuery(breeze.EntityQuery.from("ModsByGame")
                            .withParameters({ gameSlug: gameSlug })
                            .where(new breeze.Predicate("toLower(authorText)", this.context.getOpByKeyLength(name), name.toLowerCase()))
                            .orderBy("authorText")
                            .select("authorText")
                            // TODO: Distinct
                            .take(this.context.defaultTakeTag))
                        .then((data) => data.results)
                    ])
                    .then(results => {
                        var obj = [];
                        var values = [];
                        angular.forEach(results[0], (user: any) => {
                            var val = this.escapeIfNeeded(user.displayName);
                            values.push(val);
                            obj.push({ text: "user:" + val, key: "user:" + val });
                        });
                        angular.forEach(results[1], (mod: IBreezeMod) => {
                            var val = this.escapeIfNeeded(mod.authorText);
                            if (values.indexOf(val) > -1) return;
                            values.push(val);
                            obj.push({ text: "user:" + val, key: "user:" + val });
                        });
                        return obj;
                    });
            }
        ];
    }

    registerCQ(GetModUserTagsQuery);
}