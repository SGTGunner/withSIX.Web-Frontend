module MyApp.Play.Missions {

    export class GetMissionQuery extends DbQueryBase {
        static $name = 'GetMission';

        public execute = [
            'missionId', missionId => this.executeKeyQuery<IBreezeMission>(
                () => this.getEntityQueryFromShortId("Mission", missionId)
                .withParameters({ id: Tools.fromShortId(missionId) })
                .expand(['features', 'mediaItems']))
/*
                .then(r => {
                    // currently loading asynchronously and without error handling...
                    r.entityAspect.loadNavigationProperty("latestVersion");
                    return r;
                })
*/
        ];
    }

    export class GetMissionVersionQuery extends DbQueryBase {
        static $name = 'GetMissionVersion';

        public execute = [
            'model',
            (model) => this.executeKeyQuery<IBreezeMissionVersion>(
                () => this.getEntityQuery("MissionVersion", model)
                .withParameters({ id: model }))
        ];
    }

    export class GetMissionCommentsQuery extends DbQueryBase {
        static $name = 'GetMissionComments';

        public execute = [
            'missionId',
            (missionId) => {
                Debug.log("getting missioncomments by id: " + missionId.toString());
                var query = breeze.EntityQuery.from("MissionComments")
                    .where("missionId", breeze.FilterQueryOp.Equals, missionId)
                    .orderByDesc("created");
                return this.context.executeQuery(query)
                    .then((result) => result.results);
            }
        ];
    }

    export class CreateMissionCommentCommand extends DbCommandBase {
        static $name = 'CreateMissionComment';

        public execute = [
            'model', (model: ICreateComment<IBreezeMissionComment>) => {
                Debug.log(model);
                var entity = <IBreezeMissionComment>this.context.createEntity("MissionComment", { missionId: model.contentId, authorId: this.context.userInfo.id, message: model.message, created: new Date(Date.now()), replyToId: model.replyToId });
                if (model.replyTo) model.replyTo.replies.push(entity); // weird, why is this not automatic since we set replyToId?
                return this.context.saveChanges(undefined, [entity]);
            }
        ];

    }

    export class EditMissionQuery extends DbQueryBase {
        static $name = 'EditMission';

        public execute = [
            'missionId',
            (missionid) => {
                Debug.log("getting edit mission by id: " + missionid.toString());
                return this.context.getCustom("missions/" + Tools.fromShortId(missionid) + "/edit", {})
                    .then((result) => result.data);
            }
        ];
    }

    export class GetPublishMissionVersionQuery extends DbQueryBase {
        static $name = 'GetPublishMissionVersion';

        public execute = [
            'missionId', 'versionSlug',
            (missionId, versionSlug) => {
                Debug.log("getting publish mission version by id: " + missionId + ", and versionSlug: " + versionSlug);
                return this.context.getCustom("missions/" + Tools.fromShortId(missionId) + "/versions/" + versionSlug, {})
                    .then((result) => result.data);
            }
        ];
    }

    export class NewMissionQuery extends DbQueryBase {
        static $name = 'NewMission';
        static $inject = ['dbContext', 'userInfo'];

        // tODO: more flexible if we don't inject userInfo in the constructor, but from the router??
        constructor(context: W6Context, private userInfo) {
            super(context);
        }

        public execute = [
            () => {
                Debug.log("getting missions by author: " + this.userInfo.slug);
                var query = breeze.EntityQuery.from("Missions")
                    .where("author.slug", breeze.FilterQueryOp.Equals, this.userInfo.slug)
                    .select(["name", "slug", "id"]);
                return this.context.executeQuery(query)
                    .then((data) => data.results);
            }
        ];
    }

    export class UpdateMissionCommand extends DbCommandBase {
        static $name = "UpdateMission";

        public execute = [
            'missionId', 'data', 'files', (missionId, data, files) => {
                var path = "missions/" + missionId;
                return this.context.postCustom(path, data, { requestName: 'editMission' })
                    .then((response) => {
                        if (files && files.length > 0)
                            return this.context.postCustomFormData(path + "/images",
                                this.context.getFormDataFromFiles(files));
                        else
                            return response;
                    })
                    .then(result => this.respondSuccess("Mission edited"))
                    .catch(this.respondError);;
            }
        ];
    }

    export class PublishMissionCommand extends DbCommandBase {
        static $name = "PublishMission";

        public execute = [
            'missionId', 'versionSlug', 'data', (missionId, versionSlug, data) =>
            this.context.postCustom("missions/" + missionId + "/versions/" + versionSlug, data, { requestName: 'publishMission' })
            .then(result => this.respondSuccess("Mission published"))
            .catch(this.respondError)
        ];
    }

    export class UploadNewMissionVersionCommand extends DbCommandBase {
        static $name = "UploadNewMissionVersion";

        public execute = [
            'missionId', 'files', (missionId, files) => this.context.postCustomFormData("missions/" + missionId + "/versions", this.context.getFormDataFromFiles(files), { requestName: 'uploadNewVersion' })
            .then(result => this.respondSuccess("Mission uploaded"))
            .catch(this.respondError)
        ];
    }

    export class UploadNewMissionCommand extends DbCommandBase {
        static $name = "UploadNewMission";

        public execute = [
            'missionName', 'gameSlug', 'files', (missionName, gameSlug, files) => {
                var fd = this.context.getFormDataFromFiles(files);
                fd.append('name', missionName);
                fd.append('type', gameSlug);
                return this.context.postCustomFormData("missions", fd, { requestName: 'uploadNewMission' })
                    .then(result => this.respondSuccess("Mission uploaded"))
                    .catch(this.respondError);
            }
        ];
    }

    export class GetMissionCommentLikeStateQuery extends DbQueryBase {
        static $name = 'GetMissionCommentLikeState';
        public execute = ['missionId', missionId => this.context.getCustom('comments/missions/' + missionId + "/states")];
    }

    registerCQ(GetMissionCommentLikeStateQuery);

    export class LikeMissionCommentCommand extends DbCommandBase {
        static $name = 'LikeMissionCommentCommand';
        public execute = ['id', id => this.context.postCustom("comments/mission/" + id + "/" + "like")];
    }

    registerCQ(LikeMissionCommentCommand);

    export class UnlikeMissionCommentCommand extends DbCommandBase {
        static $name = 'UnlikeMissionCommentCommand';
        public execute = ['id', id => this.context.postCustom("comments/mission/" + id + "/" + "unlike")];
    }

    registerCQ(UnlikeMissionCommentCommand);

    export class FollowMissionCommand extends DbCommandBase {
        static $name = 'FollowMissionCommand';
        public execute = [
            'model', (model: IBreezeMission) =>
            this.context.postCustom("missions/" + model.id + "/follow")
        ];
    }

    registerCQ(FollowMissionCommand);

    export class UnfollowMissionCommand extends DbCommandBase {
        static $name = 'UnfollowMissionCommand';
        public execute = [
            'model', (model: IBreezeMission) =>
            this.context.postCustom("missions/" + model.id + "/unfollow")
        ];
    }

    registerCQ(UnfollowMissionCommand);

    registerCQ(GetMissionQuery);
    registerCQ(GetMissionVersionQuery);
    registerCQ(GetMissionCommentsQuery);
    registerCQ(CreateMissionCommentCommand);
    registerCQ(EditMissionQuery);
    registerCQ(UpdateMissionCommand);
    registerCQ(PublishMissionCommand);
    registerCQ(UploadNewMissionVersionCommand);
    registerCQ(UploadNewMissionCommand);
    registerCQ(GetPublishMissionVersionQuery);
    registerCQ(NewMissionQuery);


    export class DeleteMissionCommentCommand extends DbCommandBase {
        static $name = 'DeleteMissionComment';

        public execute = [
            'model', (model: IBreezeMissionComment) => {
                model.archivedAt = new Date(Date.now());
                return this.context.saveChanges(undefined, [model]);
            }
        ];
    }

    registerCQ(DeleteMissionCommentCommand);

    export class SaveMissionCommentCommand extends DbCommandBase {
        static $name = 'SaveMissionComment';

        public execute = [
            'model', (model: IBreezeMissionComment) => {
                //model.entityAspect.setDeleted();
                return this.context.saveChanges(undefined, [model]);
            }
        ];
    }

    registerCQ(SaveMissionCommentCommand);
}