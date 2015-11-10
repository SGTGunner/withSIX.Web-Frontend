module MyApp.Play.Missions {
    interface IMissionScope extends IContentScopeT<IBreezeMission>, IHandleCommentsScope<IBreezeMissionComment> {
        download: () => any;
        toggleFollow: () => void;
    }

    class MissionController extends ContentModelController<IBreezeMission> {
        static $name = 'MissionController';
        static $inject = ['$scope', 'logger', '$routeParams', '$q', '$sce', 'ForwardService', '$timeout', '$location', 'localStorageService', 'w6', 'model'];

        constructor(public $scope: IMissionScope, logger, $routeParams, $q, $sce, forwardService: Components.ForwardService, private $timeout, $location: ng.ILocationService, localStorageService, w6, model: IBreezeMission) {
            super($scope, logger, $routeParams, $q, $sce, model);

            if (model.latestVersionId != null)
                model.entityAspect.loadNavigationProperty("latestVersion")
                    .catch(r => this.breezeQueryFailed(r));

            $scope.download = () => ContentDownloads.downloadInclClientCheck("pws://?game=" + model.game.id.toUpperCase() + "&mission_package=" + model.packageName,
                forwardService, localStorageService, w6);

            $scope.callToAction = () => {
                if ($scope.w6.userInfo.isPremium)
                    $scope.download();
                else
                    $location.url(this.$scope.header.contentPath + "/download#download");
            };

            $scope.toggleFollow = () => {
                if (this.$scope.followedMissions[model.id])
                    this.unfollow();
                else
                    this.follow();
            };
            this.setupComments();

            this.setupTitle("model.name", "{0} - " + model.game.name);

            this.setupEditing();

            if (debug) {
                $(window).data("scope-" + this.$scope.toShortId(model.id), this.$scope);
                $(window).data("scope", this.$scope);
            }
        }


        unfollow() {
            this.requestAndProcessResponse(UnfollowMissionCommand, { model: this.$scope.model })
                .then(r => {
                    delete this.$scope.followedMissions[this.$scope.model.id];
                    this.$scope.model.followersCount -= 1;
                });
        }

        follow() {
            this.requestAndProcessResponse(FollowMissionCommand, { model: this.$scope.model })
                .then(r => {
                    this.$scope.followedMissions[this.$scope.model.id] = true;
                    this.$scope.model.followersCount += 1;
                });
        }

        static menuItems: Array<{ header: string; segment: string; isDefault?: boolean }> = [
            { header: "Info", segment: "info", isDefault: true }
        ];

        setupContentHeader(content: IBreezeMission): IContentHeader {
            var contentPath = content.game.slug + "/missions";
            var shortPath = contentPath + "/" + this.$scope.toShortId(content.id);
            var fullPath = shortPath + "/" + content.slug;

            var header = <IContentHeader>{
                title: content.name,
                menuItems: this.getMissionMenuItems(content, false),
                contentType: "mission",
                avatar: content.avatar,
                getAvatar: (width, height) => this.getImageOrPlaceholder(this.getContentAvatarUrl(content.avatar), width, height),
                getBanner: (width, height) => this.getImageOrPlaceholder(this.getContentAvatarUrl(content.avatar), width, height),
                contentUrl: this.$scope.url.play + "/" + fullPath,
                shortContentUrl: this.$scope.url.play + "/" + shortPath,
                contentRootUrl: this.$scope.url.play + "/" + contentPath,
                contentPath: fullPath,
                tags: content.tags || []
            };

            return header;
        }

        getMissionMenuItems(content: IBreezeMission, editing: boolean): IMenuItem[] {
            var menuItems = angular.copy(MissionController.menuItems);
            //if (content.hasReadme)
            //    menuItems.push({ header: "Readme", segment: "readme" });
            //if (content.hasLicense)
            //    menuItems.push({ header: "License", segment: "license" });
            //if (content.hasLicense)
            //    menuItems.push({ header: "Changelog", segment: "changelog" });
            if (editing)
                menuItems.push({ header: "Settings", segment: "settings" });

            return this.getMenuItems(menuItems, "game.missionsShow");
        }

        private setupComments = () => {
            var $scope = this.$scope;
            this.$scope.addComment = newComment => {
                Debug.log('Add new comment', newComment);
                $scope.request(CreateMissionCommentCommand, { model: { replyTo: newComment.replyTo, contentId: $scope.model.id, message: newComment.message, replyToId: newComment.replyTo ? newComment.replyTo.id : undefined } });
                //WM<ICreateComment<IBreezeMissionComment>>
                newComment.message = "";
            };
            this.$scope.deleteComment = comment => this.$scope.request(DeleteMissionCommentCommand, { model: comment });
            this.$scope.saveComment = comment => {
                Debug.log("Saving comment", comment);
                this.$scope.request(SaveMissionCommentCommand, { model: comment });
            };
            this.$scope.reportComment = (comment) => {};

            if (this.$scope.environment != Tk.Environment.Production) {
                this.$scope.commentLikeStates = {};
                if (this.$scope.w6.userInfo.id) {
                    this.$timeout(() => this.$scope.request(GetMissionCommentLikeStateQuery, { missionId: this.$scope.model.id })
                        .then(results => this.subscriptionQuerySucceeded(results.lastResult, this.$scope.commentLikeStates))
                        .catch(this.breezeQueryFailed));
                }

                this.$scope.likeComment = comment => {
                    this.$scope.request(LikeMissionCommentCommand, { missionId: this.$scope.model.id, id: comment.id }).then(() => {
                        comment.likesCount += 1;
                        this.$scope.commentLikeStates[comment.id] = true;
                    });
                };
                this.$scope.unlikeComment = comment => {
                    this.$scope.request(UnlikeMissionCommentCommand, { missionId: this.$scope.model.id, id: comment.id }).then(() => {
                        comment.likesCount -= 1;
                        this.$scope.commentLikeStates[comment.id] = false;
                    });
                };
            }

            this.$timeout(() => this.$scope.request(GetMissionCommentsQuery, { missionId: this.$scope.model.id }));
        };
        private setupEditing = () => {
            this.setupEditConfig({
                canEdit: () => this.$scope.model.author.id == this.$scope.w6.userInfo.id,
                discardChanges: () => {
                    this.$scope.model.entityAspect.entityManager.getChanges().filter((x, i, arr) => {
                        return (x.entityType.shortName == "Mission") ? ((<IBreezeMission>x).id == this.$scope.model.id) : ((<any>x).missionId && (<any>x).missionId == this.$scope.model.id);
                    }).forEach(x => x.entityAspect.rejectChanges());
                }
            }, null,
            [
                BreezeEntityGraph.Mission.features().$name, BreezeEntityGraph.Mission.latestVersion().$name,
                BreezeEntityGraph.Mission.mediaItems().$name, BreezeEntityGraph.Mission.versions().$name
            ]);
        };
    }

    registerController(MissionController);


    interface IMissionInfoScope extends IMissionScope {
    }

    class MissionInfoController extends ContentController {
        static $name = 'MissionInfoController';

        constructor(public $scope: IMissionScope, logger, $routeParams, $q) {
            super($scope, logger, $routeParams, $q);

            this.setupTitle("model.name", "Info - {0} - " + $scope.model.game.name);
        }
    }

    registerController(MissionInfoController);
}