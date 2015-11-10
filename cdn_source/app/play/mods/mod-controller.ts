module MyApp.Play.Mods {

    export interface IModScope extends IContentScopeT<IBreezeMod> {
        addTag: (data) => boolean;
        removeTag: (data) => void;
        getCategories: (query) => any;
        types;
        getCurrentTags: () => Array<ITagKey>;
        openDependenciesDialog: () => void;
        openSetAuthorDialog: () => void;
        openLoginDialog: () => any;
        onFileSelectGallery: (files, $event) => void;
        onFileSelectLogo: (files, $event) => void;
        getPendingLinkDeletions: () => MyApp.IBreezeModMediaItem[];
        uploadingModImage: boolean;
        openRequestModDeletion: () => void;
        openModUploadDialog: () => void;
        openArchivalStatusDialog: () => any;

        getAuthor: (query) => any;
        setAuthor: (newAuthor: MyApp.IBreezeUser) => void;
        changeAuthorCheck: (scope) => boolean;
        download: () => void;
        toggleFollow: () => void;
        getForumPost: (descriptionEditor) => void;
        formatVersion: () => string;
        openAddModDialog: () => any;

        openHelpFlow: (item: number) => void;
        nextHelpFlow: (item: number) => void;
        closeHelpFlow: () => void;
        showHelp: () => void;
        helpPopover: any;

        isUploading: () => boolean;
        getCurrentChange: () => IBreezeModUpdate;
        canCancel: (update: IBreezeModUpdate) => boolean;
        openUploadVersionDialog: () => any;
        cancelUpload: (force: boolean) => void;
        confirmCancel: boolean;
        getUploadText: () => string;
        cancelling: boolean;
        openVersionHistoryDialog: () => void;
        requiresApproval: (update: IBreezeModUpdate) => boolean;
        approving: boolean;
        approveUpload: (update: IBreezeModUpdate) => void;
        abandoning: boolean;
        confirmAbandon: boolean;
        denyUpload: (update: IBreezeModUpdate) => void;
        addToBasket: (mod: any) => void;
        mini: { downloading: boolean; downloadPercentage: number; clientDetected: boolean };
        fileDropped: ($files: any, $event: any, $rejectedFiles: any) => void;
        newRemoteLogoUploadRequest: (url: any) => void;
        showUploadBanner: () => void;
        isInBasket: () => boolean;
    }

    enum ProcessingState {
        //General,
        ManagerAbandoned = -4,
        RequiresApproval = -3,
        UserCancelled = -2,
        UnknownFailure = -1,
        Uninitialized = 0,
        Initializing = 1,
        Finished = 2,

        //ProcessingQueue
        QueuedForProcessing = 50,

        //Downloading
        AddingToDownloadService = 100,
        DownloadServiceUnavailible = 101,
        LinkUnavailible = 102,
        WaitingForDownloadStart = 110,
        Downloading = 120,
        DownloadingFailed = 121,
        Downloaded = 199,

        //Extraction
        Extracting = 200,
        ExtractFailed = 201,
        Extracted = 299,

        //RestructureTool
        Restructuring = 300,
        RestructureFailed = 301,
        RestructureWaitingOnAdmin = 310,

        //Network
        PreparingNetwork = 400,
        PreparingNetworkFailed = 401,
        Syncing = 410,
        SyncFailed = 411,
        SignalFailed = 420
    }

    export function getEnum<TEnum>(enu: TEnum, name: string): number {
        return enu[name];
    }

    export function getState(name: string): number {
        return getEnum<ProcessingState>(<any>ProcessingState, name);
    }

    export class ModController extends ContentModelController<IBreezeMod> {
        static $name = 'ModController';
        static $inject = ['$scope', 'logger', '$routeParams', '$q', '$parse', 'ForwardService', '$sce', '$timeout',
            'UploadService', '$location', 'localStorageService', 'w6', '$popover', '$rootScope', 'basketService', 'model'];

        constructor(public $scope: IModScope, logger, $routeParams, $q, private $parse: ng.IParseService, forwardService: Components.ForwardService,
            private $sce: ng.ISCEService, private $timeout: ng.ITimeoutService,
            private uploadService: Components.Upload.UploadService, $location: ng.ILocationService,
            localStorageService, w6, private $popover, $rootScope,
            basketService: Components.Basket.BasketService, model: IBreezeMod) {
            super($scope, logger, $routeParams, $q, $sce, model);

            if ($routeParams.gameSlug.toLowerCase() != model.game.slug.toLowerCase()) {
                forwardService.forward(Tools.joinUri([$scope.url.play, model.game.slug, "mods", Tools.toShortId(model.id), model.slug]));
                return;
            }

            var basket = basketService.getGameBaskets($scope.game.id);
            $scope.formatVersion = () => !model.modVersion || model.modVersion.startsWith('v') ? model.modVersion : 'v' + model.modVersion;
            $scope.isInBasket = () => {
                return basket.active.content.indexOf(model.id) != -1;
            };
            $scope.addToBasket = () => basketService.addToBasket($scope.game.id, Helper.modToBasket($scope.model));
            $scope.mini = { downloading: false, downloadPercentage: 55, clientDetected: true }; // TODO: Get this info from the signalRService etc

            //$scope.openLoginDialog = () => $scope.request(MyApp.Components.Dialogs.OpenLoginDialogQuery);
            $scope.toggleFollow = () => {
                if ($scope.followedMods[model.id])
                    this.unfollow();
                else
                    this.follow();
            };
            $scope.types = [];
            this.setupEditing();
            this.setupCategoriesAutoComplete();
            this.setupHelp();
            this.showUploadBanner();
            $scope.getForumPost = (descriptionEditor) => this.requestAndProcessCommand(GetForumPostQuery, { forumUrl: model.homepageUrl }, "fetch first post") // "http://forums.bistudio.com/showthread.php?171722-Discover-Play-Promote-missions-and-mods-withSIX"
                .then(r => {
                    // grr jquery in controller
                    descriptionEditor.$show();
                    $timeout(() => {
                        var redactor = $("textarea[redactor]").first().redactor("core.getObject");
                        // import in editor:
                        redactor.selection.selectAll();
                        redactor.insert.html(r.lastResult.body, false);
                        //model.descriptionFull = r.lastResult.body;
                    }, 1000);
                });

            $scope.download = () => ContentDownloads.downloadInclClientCheck("pws://?game=" + model.game.id.toUpperCase() + "&mod=" + model.id,
                forwardService, localStorageService, w6);
            $scope.callToAction = () => {
                if ($scope.w6.userInfo.isPremium)
                    $scope.download();
                else
                    $location.url($scope.header.contentPath + "/download#download");
            };

            //$scope.onFileSelectGallery = (files) => $scope.onFileSelectLogo(files);
            //$scope.onFileSelectLogo = (files) => this.newLogoUploadRequest(files[0]);

            $scope.onFileSelectGallery = (files, $event) => $scope.onFileSelectLogo(files, $event);
            $scope.onFileSelectLogo = (files, $event) => {
                this.newLogoUploadRequest(files[0], $event);
            };
            $scope.fileDropped = ($files, $event, $rejectedFiles) => {
                if (typeof $files[0] === "string") {
                    this.newRemoteLogoUploadRequest($files[0], $event);
                } else {
                    this.newLogoUploadRequest($files[0], $event);
                }
            };
            $scope.newRemoteLogoUploadRequest = (url) => this.newRemoteLogoUploadRequest(url, null);

            this.setupTitle("model.name", "{0} (" + model.packageName + ") - " + model.game.name);

            if ($routeParams.hasOwnProperty("landing") && (this.$scope.editConfig.canEdit() || this.$scope.editConfig.canManage()))
                this.$scope.request(OpenNewModWelcomeDialogQuery, { model: this.$scope.model, editConfig: this.$scope.editConfig });
        }

        private modImageFile: File;
        private tempModImagePath: string;

        private setupEditing() {
            var currentQuery = null;
            var $scope = this.$scope;
            var authors = [];
            this.$scope.getAuthor = (query) => {
                if (!query || query == "") {
                    return [];
                }

                var newQuery = this.$scope.request(ContentIndexes.GetUsersQuery, { query: (typeof query == 'string' || <any>query instanceof String) ? query : query.displayName })
                    .catch(this.breezeQueryFailed).then(r => {
                        // breeze objects cause deep reference stackoverflow because of circular references, so we shape the objects
                        // into just the vm properties we need fr the view. Which is a good practice in general..
                        authors = r.lastResult;
                        var authorVms = [];
                        authors.forEach(x => {
                            var user = new MyApp.EntityExtends.User();
                            Tools.handleOverrides(user, { displayName: x.displayName, id: x.id, avatarURL: x.avatarURL, hasAvatar: x.hasAvatar, avatarUpdatedAt: x.avatarUpdatedAt });
                            authorVms.push(user);
                        });
                        return authorVms;
                    });

                currentQuery = newQuery;

                return currentQuery;
            };

            this.$scope.setAuthor = (newAuthor: IBreezeUser) => {
                var author = authors.find(x => x.id === newAuthor.id);
                this.$scope.model.author = author;
                if (!this.$scope.editConfig.isEditing && !this.$scope.editConfig.isManaging)
                    this.$scope.editConfig.saveChanges();
            };

            this.$scope.changeAuthorCheck = (scope: any): boolean => {
                if (!scope.newAuthor)
                    return true;
                if ((typeof scope.newAuthor == 'string' || scope.newAuthor instanceof String))
                    return true;
                return false;
            };

            var inManageGroup = ((): boolean => {
                var allowed = false;
                $scope.model.userGroups.forEach((val, i, arr) => {
                    if (allowed)
                        return;
                    if (val.canManage) {
                        val.users.forEach((user, i2, arr2) => {
                            if (user.accountId == $scope.w6.userInfo.id) {
                                allowed = true;
                                return;
                            }
                        });
                    }
                });
                return allowed;
            })();


            this.setupEditConfig({
                canEdit: () => this.$scope.model.author.id == this.$scope.w6.userInfo.id || inManageGroup,
                discardChanges: () => {
                    this.$scope.model.entityAspect.entityManager.getChanges().filter((x, i, arr) => {
                        return (x.entityType.shortName == "Mod") ? ((<IBreezeMod>x).id == this.$scope.model.id) : ((<any>x).modId && (<any>x).modId == this.$scope.model.id);
                    }).forEach(x => x.entityAspect.rejectChanges());
                    this.$scope.header.tags = this.$scope.model.tags || [];
                }
            }, null,
            [
                BreezeEntityGraph.Mod.mediaItems().$name, BreezeEntityGraph.Mod.categories().$name,
                BreezeEntityGraph.Mod.dependencies().$name, BreezeEntityGraph.Mod.fileTransferPolicies().$name,
                BreezeEntityGraph.Mod.info().$name, BreezeEntityGraph.Mod.userGroups().$name,
                BreezeEntityGraph.Mod.userGroups().users().$name, BreezeEntityGraph.Mod.updates().$name
            ]);

            this.$scope.openRequestModDeletion = () => this.$scope.request(OpenModDeleteRequestDialogQuery, { model: this.$scope.model });
            this.$scope.openModUploadDialog = () => this.$scope.request(OpenModUploadDialogQuery, { model: this.$scope.model });
            this.$scope.openArchivalStatusDialog = () => this.$scope.request(OpenArchiveModDialogQuery, { model: this.$scope });
            this.$scope.openUploadVersionDialog = () => {
                this.$scope.request(GetModUpdatesQuery, { modId: this.$scope.model.id });

                if (isUploading(getCurrentChange())) {
                    this.logger.error("The mod is currently processing a change, please wait until it finishes.");
                    return;
                }

                this.$scope.request(OpenModUploadDialogQuery, { model: this.$scope.model });
            };
            this.$scope.openVersionHistoryDialog = () => {
                this.$scope.request(ModVersionHistoryDialogQuery, { model: this.$scope.model });
            };
            this.$scope.openAddModDialog = () => this.$scope.request(Games.OpenAddModDialogQuery, { gameSlug: this.$scope.model.game.slug });

            this.$scope.$watch("uploadingModImage", (newValue, oldValue, scope) => {
                if (newValue == oldValue) return;

                if (!newValue) {
                    this.tempModImagePath = null;
                }
            });
            var isUploading = (update: IBreezeModUpdate): boolean => {
                if (update == null)
                    return false;
                switch (getState(update.currentState)) {
                case ProcessingState.DownloadServiceUnavailible:
                case ProcessingState.LinkUnavailible:
                case ProcessingState.DownloadingFailed:
                case ProcessingState.ExtractFailed:
                case ProcessingState.RestructureFailed:
                case ProcessingState.PreparingNetworkFailed:
                case ProcessingState.SyncFailed:
                case ProcessingState.UnknownFailure:
                case ProcessingState.Finished:
                case ProcessingState.UserCancelled:
                case ProcessingState.ManagerAbandoned:
                case ProcessingState.SignalFailed:
                    return false;
                default:
                }
                return true;
            };

            var timeout = 0;
            var _updating = false;

            var getCurrentChange = () => {

                var fnc = () => {
                    if (this.$scope.model.updates == null || this.$scope.model.updates.length == 0)
                        return null;

                    var update: IBreezeModUpdate = null;

                    this.$scope.model.updates.forEach((v, i, arr) => {
                        if (update == null || v.created.getTime() > update.created.getTime())
                            update = v;
                    });

                    return update;
                };
                var result = fnc();
                var updating = result != null && isUploading(result);

                if (timeout === 0 || (updating && !_updating)) {

                    timeout = setTimeout(() => {
                        this.$scope.request(GetModUpdatesQuery, { modId: this.$scope.model.id });
                        timeout = 0;
                    }, updating ? 5000 : 1000 * 20);
                }
                _updating = updating;
                return result;
            };

            this.$scope.getCurrentChange = getCurrentChange;

            this.$scope.isUploading = () => {
                return isUploading(getCurrentChange());
            };

            this.$scope.requiresApproval = (update: IBreezeModUpdate): boolean => {
                if (update == null)
                    return false;
                return getState(update.currentState) === ProcessingState.RequiresApproval;
            };

            $scope.approving = false;

            this.$scope.approveUpload = (update: IBreezeModUpdate): void => {
                $scope.approving = true;
                if (!$scope.editConfig.canManage()) {
                    this.logger.error("Only management can approve an upload.");
                    $scope.approving = false;
                    return;
                }
                $scope.request(ApproveUploadRequestQuery, { requestId: getCurrentChange().id })
                    .then((result) => {
                        $scope.request(GetModUpdatesQuery, { modId: $scope.model.id });
                        setTimeout(() => {
                            $scope.approving = false;
                        }, 1000 * 2);
                    }).catch(reason => {
                        $scope.request(GetModUpdatesQuery, { modId: $scope.model.id });
                        this.httpFailed(reason);
                        $scope.approving = false;
                    });
            };
            this.$scope.denyUpload = (update: IBreezeModUpdate): void => {
                $scope.approving = true;
                if (!$scope.editConfig.canManage()) {
                    this.logger.error("Only management can deny an upload.");
                    $scope.approving = false;
                    return;
                }
                $scope.request(DenyUploadRequestQuery, { requestId: getCurrentChange().id })
                    .then((result) => {
                        $scope.request(GetModUpdatesQuery, { modId: $scope.model.id });
                        setTimeout(() => {
                            $scope.approving = false;
                        }, 1000 * 2);
                    }).catch(reason => {
                        $scope.request(GetModUpdatesQuery, { modId: $scope.model.id });
                        this.httpFailed(reason);
                        $scope.approving = false;
                    });
            };
            this.$scope.confirmCancel = false;
            this.$scope.confirmAbandon = false;
            this.$scope.cancelling = false;
            this.$scope.abandoning = false;

            this.$scope.canCancel = (update: IBreezeModUpdate) => {
                if ($scope.cancelling || $scope.abandoning)
                    return false;
                var change = getCurrentChange();
                if (change == null)
                    return false;
                var state = getState(change.currentState);

                switch (state) {
                case ProcessingState.Uninitialized:
                case ProcessingState.Initializing:
                case ProcessingState.QueuedForProcessing:
                    return true;
                }

                if (state >= 100 && state < 200) //Any downloading state
                    return true;
                return false;
            };

            this.$scope.getUploadText = (): string => {
                var update = getCurrentChange();
                if (update == null)
                    return null;
                var state = getState(update.currentState);

                if ($scope.cancelling || $scope.abandoning)
                    return "Cancelling " + update.version + "-" + update.branch;
                if (state == ProcessingState.RequiresApproval)
                    return "Waiting for Approval " + update.version + "-" + update.branch;
                if (state == ProcessingState.SignalFailed)
                    return "Waiting for Admin " + update.version + "-" + update.branch;
                if (state == ProcessingState.Uninitialized || state == ProcessingState.Uninitialized)
                        return "Preparing " + update.version + "-" + update.branch;
                if (state == ProcessingState.RestructureWaitingOnAdmin)
                    return "Waiting on Processing " + update.version + "-" + update.branch;
                if (state >= 100 && state < 200)
                    return "Uploading " + update.version + "-" + update.branch;
                if (state >= 200 && state < 400)
                    return "Processing " + update.version + "-" + update.branch;
                if (state >= 400 && state < 500)
                    return "Syncing " + update.version + "-" + update.branch;
                if (state >= 50 && state < 100)
                    return "Queued " + update.version + "-" + update.branch;

                return "Processing " + update.version + "-" + update.branch;
            };
            var setCancelState = (state: boolean, force: boolean = false): void => {
                if (force)
                    $scope.abandoning = state;
                else
                    $scope.cancelling = state;
            };
            var setCancelConfirmState = (state: boolean, force: boolean = false): void => {
                if (force)
                    $scope.confirmAbandon = state;
                else
                    $scope.confirmCancel = state;
            };

            this.$scope.cancelUpload = (force: boolean = false) => {
                if ($scope.confirmCancel || $scope.confirmAbandon) {
                    setCancelState(true, force);
                    setCancelConfirmState(false, force);
                    $scope.request(CancelUploadRequestQuery, { requestId: getCurrentChange().id, force: force })
                        .then((result) => {
                            $scope.request(GetModUpdatesQuery, { modId: $scope.model.id });
                            setTimeout(() => {
                                setCancelConfirmState(false, force);
                                setCancelState(false, force);
                            }, 1000 * 2);
                        }).catch(reason => {
                            $scope.request(GetModUpdatesQuery, { modId: $scope.model.id });
                            setTimeout(() => {
                                setCancelConfirmState(false, force);
                                setCancelState(false, force);
                            }, 1000 * 2);
                            this.httpFailed(reason);
                        });
                    return;
                } else {
                    setCancelConfirmState(true, force);
                    setTimeout(() => {
                        setCancelConfirmState(false, force);
                    }, 5000);
                }
            };
            this.$scope.getPendingLinkDeletions = () => <IBreezeModMediaItem[]>this.$scope.model.entityAspect.entityManager.getChanges(BreezeEntityGraph.Mod.mediaItems().$name).filter((x: any, index, array) => x.type == "Link" && x.modId == this.$scope.model.id && x.entityAspect.entityState.isDeleted());
        }

        showUploadBanner() {
            var $scope = this.$scope;
            var helpItem = {
                element: "#uploadBanner",
                data: {
                    title: 'Upload Banner',
                    content: '',
                    trigger: 'manual',
                    container: 'body',
                    autoClose: true,
                    template: "/cdn_source/app/play/collections/popovers/banner-upload-popover.html",
                    placement: "auto left"
                },
                conditional: () => true,
                popover: null
            };
            this.$scope.showUploadBanner = () => {
                helpItem.popover = this.$popover($(helpItem.element), helpItem.data);

                this.$timeout(() => {
                    var helpPopover = helpItem.popover;
                    helpPopover.$scope = $scope;
                    helpPopover.show();
                });
            };
        }

        private cancelImageUpload() {
            var $scope = <IModScope>this.$scope;

            this.tempModImagePath = null;
            if ($scope.model.fileTransferPolicies.length > 0) {
                var transferPolicy = $scope.model.fileTransferPolicies[0];

                transferPolicy.entityAspect.setDeleted();
                $scope.editConfig.saveChanges(transferPolicy);
            }
        }

        setupContentHeader(content: IBreezeMod): IContentHeader {
            var contentPath = content.game.slug + "/mods";
            var shortPath = contentPath + "/" + this.$scope.toShortId(content.id);
            var fullPath = shortPath + "/" + content.slug;
            var header = <IContentHeader>{
                title: content.name + " (" + content.packageName + ")",
                menuItems: this.getModMenuItems(content, false),
                contentType: "mod",
                getAvatar: (width, height) => {
                    if (this.tempModImagePath != null)
                        return this.tempModImagePath;

                    if (this.$scope.model.fileTransferPolicies.length > 0) {
                        var policy = this.$scope.model.fileTransferPolicies[0];
                        if (policy.uploaded)
                            return this.$scope.url.getUsercontentUrl2(policy.path);
                    }

                    return this.getImageOrPlaceholder(this.getContentAvatarUrl(content.avatar, content.avatarUpdatedAt), width, height);
                },
                getBanner: (width, height) => this.getImageOrPlaceholder(this.getContentAvatarUrl(content.bannerPath, content.bannerUpdatedAt), width, height),
                avatar: content.avatar,
                gameSlug: content.game.slug,
                contentPath: fullPath,
                contentUrl: this.$scope.url.play + "/" + fullPath,
                contentRootUrl: this.$scope.url.play + "/" + contentPath,
                shortContentUrl: this.$scope.url.play + "/" + shortPath,
                tags: content.tags || []
            };

            return header;
        }

        private getModMenuItems(mod: IBreezeMod, editing) {
            var menuItems = angular.copy(ModController.menuItems);

            if (this.$scope.model.dependentsCount > 0 || this.$scope.model.collectionsCount > 0)
                menuItems.push({ header: "Related", segment: "related" });

            if (this.$scope.environment != Environment.Production) {
                menuItems.push({ header: "Blog", segment: "blog" });
                menuItems.push({ header: "Credits", segment: "credits" });
            }

            if (mod.hasReadme)
                menuItems.push({ header: "Readme", segment: "readme" });
            if (mod.hasLicense)
                menuItems.push({ header: "License", segment: "license" });
            if (mod.hasChangelog)
                menuItems.push({ header: "Changelog", segment: "changelog" });
            if (editing)
                menuItems.push({ header: "Settings", segment: "settings" });

            return this.getMenuItems(menuItems, "game.modsShow");
        }

        static menuItems: Array<{ header: string; segment: string; isDefault?: boolean }> = [
            { header: "Info", segment: "info", isDefault: true }
        ];

        private setupCategoriesAutoComplete() {
            var $scope = <IModScope>this.$scope;

            var saveOriginalTags = () => {
                if (!$scope.model.entityAspect.originalValues.hasOwnProperty("tags")) {
                    (<any>$scope.model.entityAspect.originalValues).tags = $scope.model.tags.slice(0);
                    $scope.model.entityAspect.setModified();
                }
            };

            $scope.addTag = (data) => {
                var index = $scope.model.tags.indexOf(data.key);
                if (index == -1) {
                    saveOriginalTags();
                    $scope.model.tags.push(data.key);
                }
                $scope.header.tags = $scope.model.tags;
                return false;
            };
            $scope.getCurrentTags = () => {
                var list = [];
                for (var tag in $scope.model.tags) {
                    list.push({ key: $scope.model.tags[tag], text: $scope.model.tags[tag] });
                }
                return list;
            };
            $scope.removeTag = (data) => {
                var index = $scope.model.tags.indexOf(data);
                if (index > -1) {
                    saveOriginalTags();
                    $scope.model.tags.splice(index, 1);
                }
                $scope.header.tags = $scope.model.tags;
            };
            $scope.getCategories = (query) => this.$scope.request(ContentIndexes.Mods.GetCategoriesQuery, { query: query })
                .then((d) => this.processNames(d.lastResult))
                .catch(this.breezeQueryFailed);
        }

        private newLogoUploadRequest(file: File, $event: any) {
            var $scope = <IModScope>this.$scope;

            //if ($scope.model.imageFileTransferPolicy) {
            //    throw Error("An Upload Request already exists.");
            //}
            if (file == null)
                return;

            if ($scope.uploadingModImage) {
                this.logger.error("You are already uploading an image! Please wait!");
                return;
            }

            if (file.name.endsWithIgnoreCase(".gif")) {
                this.logger.error("You are unable to upload gifs for your mod logo.");
                return;
            }

            $scope.uploadingModImage = true;

            var uploadRequest = BreezeEntityGraph.ModImageFileTransferPolicy.createEntity({
                path: file.name,
                modId: $scope.model.id
            });

            var fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            fileReader.onload = e => {
                this.$timeout(() => {
                    if ($scope.uploadingModImage)
                        this.tempModImagePath = (<any>e.target).result;
                });
            };

            var saveChanges = this.entityManager.saveChanges([uploadRequest])
                .then((result) => {
                    Debug.log(result, uploadRequest, $scope.model.fileTransferPolicies);
                    this.uploadLogo(file, uploadRequest);
                    return;
                }).catch((reason) => {
                    Debug.log("Failure", reason);
                    this.logger.error("We were unable to retrieve an upload policy for your image. Please try again later", "Failed to upload image.");
                    this.cancelImageUpload();
                    $scope.uploadingModImage = false;
                    return;
                });
        }

        private newRemoteLogoUploadRequest(file: string, $event: any) {
            var $scope = this.$scope;
            //if ($scope.model.imageFileTransferPolicy) {
            //    throw Error("An Upload Request already exists.");
            //}
            if (file == null)
                return;

            if ($scope.uploadingModImage) {
                this.logger.error("You are already uploading an image! Please wait!");
                return;
            }

            if (file.endsWithIgnoreCase(".gif")) {
                this.logger.error("You are unable to upload gifs for your mod logo.");
                return;
            }

            $scope.uploadingModImage = true;

            var uploadRequest = BreezeEntityGraph.ModImageFileTransferPolicy.createEntity({
                path: file,
                modId: $scope.model.id
            });

            this.tempModImagePath = file;

            var saveChanges = this.entityManager.saveChanges([uploadRequest])
                .then((result) => {
                    Debug.log(result, uploadRequest, $scope.model.fileTransferPolicies);
                    this.uploadRemoteLogo(file, uploadRequest);
                    return;
                }).catch((reason) => {
                    Debug.log("Failure", reason);
                    this.logger.error("We were unable to retrieve an upload policy for your image. Please try again later", "Failed to upload image.");
                    this.cancelImageUpload();
                    $scope.uploadingModImage = false;
                    return;
                });
        }

        private uploadLogo(file: File, policy: IBreezeModImageFileTransferPolicy) {
            var $scope = <IModScope>this.$scope;
            this.uploadService.uploadToAmazonWithPolicy(file, policy.uploadPolicy)
                .success((data: string, status: number, headers: (headerName: string) => string, config: ng.IRequestConfig) => {
                    Debug.log(data, status, headers, config);

                    this.logger.info("When you're happy click Save Changes to use the uploaded image.", "Image Uploaded");
                    policy.uploaded = true;
                    $scope.uploadingModImage = false;
                }).error((data: string, status: number, headers: (headerName: string) => string, config: ng.IRequestConfig) => {
                    Debug.log(data, status, headers, config);
                    Debug.log("Failure");

                    this.cancelImageUpload();
                    $scope.uploadingModImage = false;

                    if (data.includes("EntityTooLarge")) {
                        this.logger.error("Your image can not be larger than 5MB", "Image too large");
                    }
                    if (data.includes("EntityTooSmall")) {
                        this.logger.error("Your image must be at least 10KB", "Image too small");
                    }
                });
        }

        private uploadRemoteLogo(file: string, policy: IBreezeModImageFileTransferPolicy) {
            var $scope = this.$scope;
            this.logger.info("When you're happy click Save Changes to use the uploaded image.", "Image Uploaded");
            policy.uploaded = true;
            $scope.uploadingModImage = false;
        }

        unfollow() {
            this.requestAndProcessResponse(UnfollowModCommand, { model: this.$scope.model })
                .then(r => {
                    delete this.$scope.followedMods[this.$scope.model.id];
                    this.$scope.model.followersCount -= 1;
                });
        }

        follow() {
            this.requestAndProcessResponse(FollowModCommand, { model: this.$scope.model })
                .then(r => {
                    this.$scope.followedMods[this.$scope.model.id] = true;
                    this.$scope.model.followersCount += 1;
                });
        }

        setupHelp() {
            var $scope = this.$scope;
            var helpItem = {
                element: "#helpButton",
                data: {
                    title: 'Help Section',
                    content: 'Click the next button to get started!',
                    trigger: 'manual',
                    container: 'body',
                    autoClose: true,
                    template: "/cdn_source/app/play/mods/popovers/help-popover.html"
                },
                conditional: () => true,
                popover: null
            };

            var showSection = (item: HelpItem<IModScope>) => {
                item.popover = this.$popover($(item.element), item.data);
                this.$timeout(() => {
                    item.popover.show();
                    helpItem.popover.hide();
                });
            };

            var displayCondition = (item: HelpItem<IModScope>, scope: IModScope): boolean => {
                if ($(item.element).length == 0)
                    return false;

                return item.conditional(scope);
            };

            this.$scope.showHelp = () => {
                helpItem.popover = this.$popover($(helpItem.element), helpItem.data);

                this.$timeout(() => {
                    var helpPopover = helpItem.popover;
                    helpPopover.$scope.helpItems = ModController.helpItems;
                    helpPopover.$scope.showSection = showSection;
                    helpPopover.$scope.contentScope = $scope;
                    helpPopover.$scope.displayCondition = displayCondition;
                    helpPopover.show();
                });
            };
        }

        private static helpItemTemplate: string = "/cdn_source/app/play/mods/popovers/help-item-popover.html";
        private static helpItems: HelpItem<IModScope>[] = [
            {
                element: "#openEditorButton",
                data: {
                    title: 'How to get started',
                    content: 'Click here to “open editor”. This will allow you to interact with several items directly inside the Page. ',
                    trigger: 'manual',
                    container: 'body',
                    autoClose: true,
                    template: ModController.helpItemTemplate
                },
                conditional: ($scope) => !$scope.editConfig.editMode,
                popover: null
            },
            {
                element: ".pagetitle",
                data: {
                    title: 'Edit your Title',
                    content: 'Simply Click on the Title text in order to change it.<br/><br/><b>Hint:</b> Choose your Mod title carefully as it will show up in the filter and search. ',
                    trigger: 'manual',
                    container: 'body',
                    autoClose: true,
                    template: ModController.helpItemTemplate
                },
                conditional: ($scope) => $scope.editConfig.editMode,
                popover: null
            },
            {
                element: "#addModTag",
                data: {
                    title: 'Add/Edit Tags',
                    content: 'Click on + you can add the Tag(s) that best fit the type of your.<br/><br/><b>Hint:</b> Don´t use more than four tags if possible, as too many tags will confuse players. ',
                    trigger: 'manual',
                    container: 'body',
                    autoClose: true,
                    template: ModController.helpItemTemplate
                },
                conditional: ($scope) => $scope.editConfig.editMode,
                popover: null
            },
            {
                element: "#modDescription",
                data: {
                    title: 'Edit your Description',
                    content: 'Keybord Shortcuts : <a target="_blank" href="http://imperavi.com/redactor/docs/shortcuts/">http://imperavi.com/redactor/docs/shortcuts/</a><br/><br/><b>Hint:</b> you can also import your BI Forum description. All you need is to set your BI forum thread as homepage and click on “Import Forum post”.',
                    trigger: 'manual',
                    container: 'body',
                    autoClose: true,
                    template: ModController.helpItemTemplate
                },
                conditional: ($scope) => $scope.editConfig.editMode,
                popover: null
            },
            {
                element: "#addModDependency",
                data: {
                    title: 'How to use dependencies',
                    content: 'Click on “+ Add Dependency” to search and select the appropriate depended mod, or click on “x” to remove a dependency. Dependencies are not version specific.<br/><br/><b>Warning:</b> Make sure to select the correct dependencies as your mod will be launched along with the depended content. Selecting wrong or incompatible dependencies can cause crashes and errors!',
                    trigger: 'manual',
                    container: 'body',
                    autoClose: true,
                    template: ModController.helpItemTemplate,
                    placement: "auto left"
                },
                conditional: ($scope) => $scope.editConfig.editMode,
                popover: null
            } /*,
            {
                element: "",
                data: {
                    title: '', content: '',
                    trigger: 'manual', container: 'body', autoClose: true,
                    template: ModController.helpItemTemplate
                },
                conditional: ($scope) => $scope.editConfig.editMode,
                popover: null
            }*/
        ];
    }


    registerController(ModController);

    export class ModFileController extends BaseController {
        static $name = "ModFileController";

        static $inject = ['$scope', 'logger', '$q', 'model'];

        constructor($scope, logger, $q, model) {
            super($scope, logger, $q);

            $scope.model = model;
        }
    }

    registerController(ModFileController);


    // Inherits the scope from the parent controller...
    export interface IEditableModScope extends IModScope {
        authorDropdown: any[];
        dropdown: Object[];
    }

    export interface IModInfoScope extends IEditableModScope, IHandleCommentsScope<IBreezeModComment> {
        openClaimDialog: () => any;
        exampleData: { key: string; values: number[][] }[];
        xAxisTickFormat: () => (d) => string;
        addDependency: (data, hide) => boolean;
        removeDependency: (data) => void;
        getCurrentDependencies: () => Array<ITagKey>;
        getDependencies: (query) => any;
        addLink: (link) => void;
        newLink: { title: string; path: string };
    }

    export class ModEditBaseController extends BaseController {
        constructor(public $scope: IEditableModScope, logger, $q, public $timeout) {
            super($scope, logger, $q);

            this.setupInlineEditingDropdown();
        }

        // TODO: Consider if this should actually go into the edit-menu directive or not..
        private setupInlineEditingDropdown() {
            this.$scope.dropdown = [
                //{
                //    "text": "Upload New Version",
                //    "click": "openUploadVersionDialog()"
                //}
            ];

            //if (this.$scope.w6.userInfo.hasPermission('mods', 'create')) {
            //    this.$scope.dropdown.push(
            //        {
            //            "text": "Upload New Mod",
            //            "click": "openAddModDialog()"
            //        }
            //        );
            //}

            this.$scope.dropdown.push(
                {
                    "divider": true
                },
                {
                    "text": "<span class=\"red\">Request Mod Deletion</span>",
                    "click": "openRequestModDeletion()"
                }
            );

            if (this.$scope.editConfig.canManage()) {
                this.$scope.dropdown.push(
                    {
                        "divider": true
                    },
                    {
                        "text": "<stong>Management</strong>",
                        "href": "#"
                    },
                    {
                        "text": "Change Author",
                        "click": "openChangeAuthorDialog()"
                    },
                    {
                        "text": "Archival Status",
                        "click": "openArchivalStatusDialog()"
                    } //,
                    //{
                    //    "text": "<span class=\"red\">Delete Mod</span>",
                    //    "href": "#anotherAction"
                    //}
                );
            }

            this.$scope.authorDropdown = [
                {
                    "text": "Edit Author Settings",
                    "click": "openEditAuthorSettings()"
                }
            ];
            //openChangeAuthorDialog()
            if (this.$scope.editConfig.canManage()) {
                this.$scope.authorDropdown.push(
                    {
                        "divider": true
                    },
                    {
                        "text": "<stong>Management</strong>",
                        "href": "#anotherAction"
                    },
                    {
                        "text": "Change Author",
                        "click": "openChangeAuthorDialog()"
                    }
                );
            }
        }
    }

    export class ModInfoController extends ModEditBaseController {
        static $name = "ModInfoController";
        static $inject = ['$scope', 'logger', '$q', '$timeout', '$routeParams'];

        constructor(public $scope: IModInfoScope, logger, $q, public $timeout: ng.ITimeoutService, private $routeParams) {
            super($scope, logger, $q, $timeout);

            this.entityManager = $scope.model.entityAspect.entityManager;
            this.setupComments($scope.model);

            $scope.addLink = () => {
                BreezeEntityGraph.ModMediaItem.createEntity({
                    title: $scope.newLink.title,
                    path: $scope.newLink.path,
                    type: 'Link',
                    modId: '' + $scope.model.id + '',
                    mod: $scope.model
                });
                $scope.newLink.title = "";
                $scope.newLink.path = "";
            };
            $scope.newLink = {
                title: "",
                path: ""
            };
            this.setupClaiming();
            this.setupStatistics();
            this.setupDependencyAutoComplete();

            this.setupTitle("model.name", "Info - {0} (" + $scope.model.packageName + ") - " + $scope.model.game.name);
        }

        private setupComments(mod: IBreezeMod) {
            this.$scope.addComment = newComment => {
                Debug.log('Add new comment', newComment);
                var r = this.$scope.requestWM<ICreateComment<IBreezeModComment>>(CreateModCommentCommand, { model: { replyTo: newComment.replyTo, contentId: this.$scope.model.id, message: newComment.message, replyToId: newComment.replyTo ? newComment.replyTo.id : undefined } }).catch(x => { this.breezeQueryFailed(x); });
                newComment.message = "";
                newComment.valueOf = false;
                return r;
            };
            this.$scope.deleteComment = comment => this.$scope.request(DeleteModCommentCommand, { model: comment }).catch(x => { this.breezeQueryFailed(x); }),
                this.$scope.saveComment = comment => {
                    Debug.log("Saving comment", comment);
                    return this.$scope.request(SaveModCommentCommand, { model: comment }).catch(x => { this.breezeQueryFailed(x); });
                };
            this.$scope.reportComment = (comment) => { throw "NotImplemented"; };
            if (this.$scope.environment != Tk.Environment.Production) {
                this.$scope.commentLikeStates = {};
                if (this.$scope.w6.userInfo.id) {
                    this.$timeout(() => this.$scope.request(GetModCommentLikeStateQuery, { modId: this.$scope.model.id })
                        .then(results => this.subscriptionQuerySucceeded(results.lastResult, this.$scope.commentLikeStates))
                        .catch(this.breezeQueryFailed));
                }

                this.$scope.likeComment = comment => {
                    this.$scope.request(LikeModCommentCommand, { modId: this.$scope.model.id, id: comment.id }).then(() => {
                        comment.likesCount += 1;
                        this.$scope.commentLikeStates[comment.id] = true;
                    });
                };
                this.$scope.unlikeComment = comment => {
                    this.$scope.request(UnlikeModCommentCommand, { modId: this.$scope.model.id, id: comment.id }).then(() => {
                        comment.likesCount -= 1;
                        this.$scope.commentLikeStates[comment.id] = false;
                    });
                };
            }

            this.$timeout(() => this.$scope.request(GetModCommentsQuery, { modId: this.$scope.model.id }));
        }

        private setupClaiming() {
            this.$scope.openClaimDialog = () => this.$scope.request(OpenClaimDialogQuery, { gameSlug: this.$routeParams.gameSlug, modId: this.$routeParams.modId });
        }

        private setupStatistics() {
            //[x,y], [day, amount]
            this.$scope.exampleData = [
                {
                    "key": "Downloads",
                    "values": [[1409741388470, 0], [1409741389470, 10], [1409741390470, 50], [1409741391470, 150], [1409741392470, 300], [1409741393470, 450], [1409741394470, 525], [1409741395470, 600], [1409741396470, 675], [1409741397470, 780], [1409741398470, 850]]
                },
                {
                    "key": "Followers",
                    "values": [[1409741388470, 1], [1409741389470, 3], [1409741390470, 10], [1409741391470, 15], [1409741392470, 35], [1409741393470, 65], [1409741394470, 70], [1409741395470, 73], [1409741396470, 70], [1409741397470, 65], [1409741398470, 75]]
                }
            ];
            this.$scope.xAxisTickFormat = () => d => new Date(d).toLocaleString(); //uncomment for date format
        }

        private setupDependencyAutoComplete() {
            this.$scope.addDependency = (data, hide) => {
                var found = false;

                angular.forEach(this.$scope.model.dependencies, item => {
                    if (data.id == item.id) {
                        found = true;
                    }
                });

                // ReSharper disable once ExpressionIsAlwaysConst, ConditionIsAlwaysConst
                if (!found)
                    BreezeEntityGraph.ModDependency.createEntity({ id: data.id, modId: this.$scope.model.id, name: data.name, });
                hide();
                return false;
            };
            this.$scope.removeDependency = (data) => {
                var found = false;
                var dependency = null;

                angular.forEach(this.$scope.model.dependencies, item => {
                    if (data.id == item.id) {
                        found = true;
                        dependency = data;
                    }
                });

                // ReSharper disable HeuristicallyUnreachableCode, QualifiedExpressionIsNull, ConditionIsAlwaysConst
                if (found)
                    dependency.entityAspect.setDeleted();
                // ReSharper restore HeuristicallyUnreachableCode, QualifiedExpressionIsNull, ConditionIsAlwaysConst
            };
            this.$scope.getCurrentDependencies = () => {
                var list = [];
                angular.forEach(this.$scope.model.dependencies, item => list.push({ key: item.id, text: item.name, id: item.modId }));

                return list;
            };
            this.$scope.getDependencies = (query) => this.$scope.request(ContentIndexes.Mods.GetModTagsQuery, { gameSlug: this.$routeParams.gameSlug, query: query })
                .then((d) => this.processModNames(d.lastResult))
                .catch(this.breezeQueryFailed);
        }

        private processModNames(names) {
            var obj = [];
            for (var i in names) {
                var mod = <any> names[i];
                obj.push({ text: (mod.name && mod.name != mod.packageName ? mod.name + " (" + mod.packageName + ")" : mod.packageName), key: mod.packageName, id: mod.id, name: mod.name || mod.packageName });
            }
            return obj;
        }

        private entityManager: breeze.EntityManager;
    }

    registerController(ModInfoController);

    export interface IModCreditsScope extends IEditableModScope {
        newUser: IBreezeUser;

        addGroup: (name: string) => void;
        addUserToGroup: (group: IBreezeModUserGroup, $hide: any) => void;
        userCheck: (user: any) => boolean;
        logger;
    }

    export class ModCreditsController extends ModEditBaseController {
        static $inject = ['$scope', 'logger', '$q', '$timeout'];
        static $name = "ModCreditsController";

        entityManager: breeze.EntityManager;

        constructor(public $scope: IModCreditsScope, logger, public $q: ng.IQService, $timeout) {
            super($scope, logger, $q, $timeout);
            // TODO: This should retrieve the Credits info
            this.entityManager = $scope.model.entityAspect.entityManager;

            $scope.addGroup = this.addGroup;
            $scope.addUserToGroup = this.addUserToGroup;
            $scope.userCheck = this.userCheck;
            $scope.logger = this.logger;

            this.setupTitle("model.name", "Credits - {0} (" + $scope.model.packageName + ") - " + $scope.model.game.name);
            Debug.log("SCOPE: ", $scope);
            //this.$timeout(() => this.$scope.request(GetModCreditsQuery, { modId: this.$scope.model.id }));
        }

        addGroup = (name: string): void => {
            var group = BreezeEntityGraph.ModUserGroup.createEntity(this.entityManager, {
                name: name
            });
            this.$scope.model.userGroups.push(group);
            this.$timeout(() => {
                (<any>$("#" + group.id)[0]).scrollIntoViewIfNeeded();
                Debug.log($("#" + group.id + "-title"));
                $("#" + group.id + "-title").click(); //this.$timeout(() => $("#" + group.id + "-title").click(),100);
            });
        };

        addUserToGroup(group: IBreezeModUserGroup, $hide): void {
            var $scope = <any>this;
            if (!$scope.userCheck($scope.newUser)) {
                return;
            }
            if ($scope.addingUser)
                return;
            $scope.addingUser = true;
            var user = <IBreezeUser>$scope.newUser;
            var hasUser = false;
            group.users.forEach((val, i, arr) => {
                if (val.accountId == user.id) {
                    hasUser = true;
                    return;
                }
            });

            // ReSharper disable once ConditionIsAlwaysConst
            if (hasUser) {
                $scope.logger.error("A User can only be in a group once.", "User already in group");
                $scope.addingUser = false;
                return;
            }
            group.users.push(BreezeEntityGraph.ModGroupUser.createEntity(group.entityAspect.entityManager, {
                account: user
            }));
            $hide();
        }

        userCheck = (user: any): boolean => {
            if (!user)
                return false;
            if ((typeof user == 'string' || user instanceof String))
                return false;
            return true;
        };
    }

    registerController(ModCreditsController);

    export interface IModBlogScope extends IEditableModScope {
        createBlogPost: boolean;
        createBlogSection: () => void;
        newBlogPost: _IntDefs.__opt_WallPost;
        save: (any) => void;
    }

    export class ModBlogController extends ModEditBaseController {
        static $inject = ['$scope', 'logger', '$q', '$timeout'];
        static $name = "ModBlogController";

        constructor($scope: IModBlogScope, logger, $q, $timeout) {
            super($scope, logger, $q, $timeout);
            Debug.log("Scope: ", $scope);
            $scope.createBlogPost = false;
            /*
            Debug.log(<any>BreezeEntityGraph.AccountWall.$name);

            */
            $scope.model.entityModule = BreezeEntityGraph.ModEntityModule.createEntity();
            //$scope.model.entityModule.entityAspect.loadNavigationProperty(BreezeEntityGraph.EntityModule.wall().$name);

            $scope.createBlogSection = () => {
                if ($scope.model.entityModule.wall != null)
                    return;

                $scope.model.entityModule.wall = BreezeEntityGraph.Wall.createEntity({
                    entityModule: $scope.model.entityModule
                });
                $scope.editConfig.saveChanges($scope.model.entityModule.wall);
            };

            $scope.save = (a) => {
                Debug.log(a);
                $scope.model.entityModule.wall.posts.push(BreezeEntityGraph.WallPost.createEntity({
                    //title: a.title.$modelValue,
                    content: a.content.$modelValue
                }));
                $scope.createBlogPost = false;
                $scope.$apply();
            };
            this.setupTitle("model.name", "Blog - {0} (" + $scope.model.packageName + ") - " + $scope.model.game.name);
        }
    }

    registerController(ModBlogController);

    export class ModRelatedController extends BaseController {
        static $name = "ModRelatedController";

        constructor($scope, logger, $q) {
            super($scope, logger, $q);
            this.setupTitle("model.name", "Related - {0} (" + $scope.model.packageName + ") - " + $scope.model.game.name);
            //$scope.model.entityAspect.loadNavigationProperty("dependents");
            //$scope.model.entityAspect.loadNavigationProperty("collections");
        }
    }

    registerController(ModRelatedController);

    export class ModDeleteRequestDialogController extends ModelDialogControllerBase<IBreezeMod> {
        static $name = 'ModDeleteRequestDialogController';
        static $view = '/cdn_source/app/play/mods/dialogs/delete-request.html';

        constructor(public $scope, public logger, $modalInstance, $q, model: IBreezeMod) {
            super($scope, logger, $modalInstance, $q, model);

            $scope.sendReport = () => this.processCommand($scope.request(MyApp.Components.Dialogs.SendReportCommand, { data: $scope.model }, "Report sent!")
                .then((data) => $scope.sent = true));
        }
    }

    registerController(ModDeleteRequestDialogController);

    export class ModNewModWelcomeDialogController extends ModelDialogControllerBase<IBreezeMod> {
        static $name = 'ModNewModWelcomeDialogController';
        static $view = '/cdn_source/app/play/mods/dialogs/new-mod-welcome.html';

        static $inject = ['$scope', 'logger', '$modalInstance', '$q', 'model', 'editConfig'];

        constructor(public $scope, public logger, $modalInstance, $q, model: IBreezeMod, editConfig: IEditConfiguration<IBreezeMod>) {
            super($scope, logger, $modalInstance, $q, model);

            //$scope.editconfig = editConfig;

            $scope.edit = () => {
                editConfig.enableEditing();
                $scope.$close();
            };
        }
    }

    registerController(ModNewModWelcomeDialogController);

    export class ArchiveModDialogController extends ModelDialogControllerBase<IModScope> {
        static $name = 'ArchiveModDialogController';
        static $view = '/cdn_source/app/play/mods/dialogs/archive-mod.html';

        constructor(public $scope, public logger, $modalInstance, $q, model: IModScope) {
            super($scope, logger, $modalInstance, $q, model);

            $scope.model = model.model;
            $scope.setArchivedStatus = (archive: boolean) => {
                var shouldSave = !model.editConfig.isEditing && !model.editConfig.isManaging;
                if (archive) {
                    model.model.archivedAt = new Date();
                } else {
                    model.model.archivedAt = null;
                }
                if (shouldSave) {
                    model.editConfig.saveChanges();
                    this.$modalInstance.close();
                }
            };
        }
    }

    registerController(ArchiveModDialogController);

    export interface IUploadVersionDialogScope extends IContentScope {
        model: {
            cmod: IBreezeMod;
            mod: {
                modId: string;
                version: string;
            };
            downloadLinkAvailable: boolean;
        };
        checkingDownloadLink: boolean;
        ok: () => void;
        cancel: () => any;
        branches: { displayName: string;value }[];
        hints: { name: string;author: string;version: string;dependencies: string;branch: string;download: string;homepage: string;comments: string;packageName: string;packageNameUnavailable: string;downloadLinkUnavailable: string };
        inlineHints: { name: string;author: string;version: string;dependencies: string;branch: string;download: string;homepage: string;comments: string;packageName: string;packageNameUnavailable: string;packageNameMissingPrefix: string;packageNameEmpty: string;downloadLinkUnavailable: string;downloadLinkAvailable: string;checkingDownload: string };
        versionPattern: RegExp;
        validateVersion: (v1: string, v2: string, options?: any) => number;
    }

    export class UploadVersionDialogController extends ModelDialogControllerBase<IBreezeMod> {
        static $name = 'UploadVersionDialogController';
        static $view = '/cdn_source/app/play/mods/dialogs/upload-new-version.html';

        constructor(public $scope: IUploadVersionDialogScope, public logger: Components.Logger.ToastLogger, $modalInstance, $q, model: IBreezeMod) {
            super($scope, logger, $modalInstance, $q, model);

            $scope.cancel = this.cancel;
            $scope.ok = this.ok;
            this.$scope.checkingDownloadLink = false;
            this.$scope.model.downloadLinkAvailable = false;

            $scope.model = <any>{
                cmod: model,
                mod: {
                    modId: model.id
                }
            };

            $scope.branches = Games.AddModDialogController.branches;
            $scope.hints = Games.AddModDialogController.hints;
            $scope.inlineHints = Games.AddModDialogController.inlineHints;
            $scope.versionPattern = Games.AddModDialogController.versionPattern;
            $scope.validateVersion = this.validateVersion;

            $scope.$watch("model.mod.download", (newValue: string, oldValue: string, scope) => {
                if (newValue != oldValue && newValue != null && newValue != "")
                    this.checkDownloadLink(newValue);
            });
        }

        checkDownloadLink(uri: string) {
            this.$scope.checkingDownloadLink = true;
            this.$scope.model.downloadLinkAvailable = false;
            this.$scope.request(Games.GetCheckLinkQuery, { linkToCheck: uri })
                .then((result) => {
                    this.$scope.checkingDownloadLink = false;
                    Debug.log(result);
                    this.$scope.model.downloadLinkAvailable = result.lastResult;
                })
                .catch(this.httpFailed);
        }

        private cancel = () => this.$modalInstance.close();
        private ok = () => {
            if (this.$scope.model.cmod.modVersion != null && this.validateVersion(this.$scope.model.mod.version, this.$scope.model.cmod.modVersion) <= 0) {
                this.logger.error("The new mod version must be greter than the current version", "Bad Version");
                return;
            }
            this.$scope.request(NewModVersionCommand, { data: this.$scope.model.mod })
                .then(result => {
                    this.$scope.request(GetModUpdatesQuery, { modId: this.$scope.model.cmod.id });
                    this.$modalInstance.close();
                })
                .catch(this.httpFailed);
        };
        private validateVersion = (v1: string, v2: string, options?: any): number => {
            var lexicographical = options && options.lexicographical,
                zeroExtend = options && options.zeroExtend,
                v1parts: any = v1.split('.'),
                v2parts: any = v2.split('.');

            function isValidPart(x) {
                return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
            }

            if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
                return NaN;
            }

            if (zeroExtend) {
                while (v1parts.length < v2parts.length) v1parts.push("0");
                while (v2parts.length < v1parts.length) v2parts.push("0");
            }

            if (!lexicographical) {
                v1parts = v1parts.map(Number);
                v2parts = v2parts.map(Number);
            }

            for (var i = 0; i < v1parts.length; ++i) {
                if (v2parts.length == i) {
                    return 1;
                }

                if (v1parts[i] == v2parts[i]) {
                    continue;
                } else if (v1parts[i] > v2parts[i]) {
                    return 1;
                } else {
                    return -1;
                }
            }

            if (v1parts.length != v2parts.length) {
                return -1;
            }

            return 0;
        };
    }

    registerController(UploadVersionDialogController);

    export interface IModVersionHistoryDialogScope extends IContentScope {

        ok: () => void;
        cancel: () => any;
        model: IBreezeMod;
    }

    export class ModVersionHistoryDialogController extends ModelDialogControllerBase<IBreezeMod> {
        static $name = 'ModVersionHistoryDialogController';
        static $view = '/cdn_source/app/play/mods/dialogs/version-history.html';

        constructor(public $scope: IModVersionHistoryDialogScope, public logger: Components.Logger.ToastLogger, $modalInstance, $q, model: IBreezeMod) {
            super($scope, logger, $modalInstance, $q, model);

            $scope.cancel = this.cancel;
            $scope.ok = this.ok;
            $scope.model = model;
        }

        private cancel = () => this.$modalInstance.close();
        private ok = () => this.$modalInstance.close();
    }

    registerController(ModVersionHistoryDialogController);

    // Temporary controller used for internal content management
    export interface IEditModScope extends IContentScope {
        mod: IBreezeMod;
        types: Object[];
        saveChanges: () => void;
        editing;
        deleteMod;
        retrySave;
        cancelSave;
        saveFailureReason;
        editDependencies: ITagKey[];
        editCategories: ITagKey[];
        editAliases: ITagKey[];
        searchParam;
        startEditing: () => void;
        getDependencies;
        getCategories;
        onLogoFileSelect: (file) => void;
        onGalleryFileSelect: (files) => any;
        getImage: (img: string, updatedAt?: Date) => string;
    }

    export class EditModController extends ContentController {
        static $name = 'EditModController';
        static $inject = [
            '$q', '$scope', '$timeout',
            '$cookieStore', '$location', '$routeParams', 'w6',
            'logger', '$compile', 'DoubleClick', 'model'
        ];

        static MOD_TYPES = [
            "Arma3Mod", "Arma3StMod",
            "Arma2OaMod", "Arma2OaStMod", "Arma2OaCoMod",
            "Arma2Mod", "Arma2CaMod", "Arma2StMod",
            "TakeonhMod", "TakeonhStMod", "TakeonhRaMod", "TakeonhRaA2Mod", "TakeonhRaOaMod", "TakeonhRaCoMod",
            "Rv4Mod", "Rv4MinMod",
            "Rv3Mod", "Rv3MinMod",
            "Rv2Mod", "Rv2MinMod",
            "RvMod", "RvMinMod"
        ];

        constructor(public $q: ng.IQService, public $scope: IEditModScope, public $timeout: ng.ITimeoutService,
            public $cookieStore, public $location: ng.ILocationService, public $routeParams, w6,
            public logger: Components.Logger.ToastLogger, $compile, public dfp, private model) {

            super($scope, logger, $routeParams, $q);

            this.compiledRetry = $compile(angular.element("<p>{{saveFailureReason}}</p><button ng-click='retrySave()'>Retry</button> <button ng-click='cancelSave()'>Cancel</button>"));

            $scope.mod = model;
            $scope.editing = this.$scope.w6.userInfo.isAdmin || this.$scope.w6.userInfo.isManager || model.author.id == this.$scope.w6.userInfo.id;
            $scope.types = [];
            $scope.editDependencies = [];
            $scope.editCategories = [];
            $scope.editAliases = [];
            $scope.searchParam = null;

            $scope.saveChanges = this.saveChanges;
            $scope.deleteMod = this.deleteMod;
            $scope.retrySave = this.retrySave;
            $scope.cancelSave = this.cancelSave;
            $scope.startEditing = this.startEditing;
            $scope.onLogoFileSelect = this.onLogoFileSelect;
            $scope.onGalleryFileSelect = this.onGalleryFileSelect;
            $scope.getImage = this.getImage;
            $scope.getDependencies = (query) => this.$scope.request(ContentIndexes.Mods.GetModTagsQuery, { gameSlug: this.$routeParams.gameSlug, query: query })
                .then((d) => this.processModNames(d.lastResult))
                .catch(this.breezeQueryFailed);
            $scope.getCategories = (query) => this.$scope.request(ContentIndexes.Mods.GetCategoriesQuery, { query: query })
                .then((d) => this.processNames(d.lastResult))
                .catch(this.breezeQueryFailed);

            for (var i in EditModController.MOD_TYPES) {
                var mt = EditModController.MOD_TYPES[i];
                $scope.types.push({
                    value: mt,
                    text: mt.replace("Mod", "")
                });
            }
        }

        public onLogoFileSelect = (file) => this.logoToUpload = file;
        public onGalleryFileSelect = (files) => this.galleryToUpload = files;

        public saveChanges = () => {
            return this.$scope.request(SaveModCommand, {
                    modId: this.$scope.mod.id,
                    data: this.$scope.mod,
                    editData: {
                        editDependencies: this.$scope.editDependencies,
                        editAliases: this.$scope.editAliases,
                        editCategories: this.$scope.editCategories,
                        logoToUpload: this.logoToUpload,
                        galleryToUpload: this.galleryToUpload
                    }
                })
                .then(this.saveSuccessful)
                .catch(this.saveFailed);
        };
        private saveSuccessful = (data) => {
            this.logger.success("Saved", "Saving changes");
        };

        private saveFailed = (reason) => {
            this.$scope.saveFailureReason = reason.toString();
            this.saveToast = this.logger.errorRetry(this.compiledRetry(this.$scope), "Saving failed, retry?");
        };

        private cancelSave = () => {
            this.$scope.mod.entityAspect.rejectChanges();
            this.saveToast.remove();
        };
        private retrySave = () => {
            this.saveChanges();
            this.saveToast.remove();
        };
        public deleteMod = () => {
            //this.$scope.mod.dependencies.forEach(x => {
            //   x.entityAspect.setDeleted();
            //});
            this.$scope.mod.entityAspect.setDeleted();
            this.saveChanges();
        };
        saveToast: JQuery;
        compiledRetry;

        public startEditing = () => {
            this.$scope.editDependencies = [];
            this.$scope.mod.dependencies.forEach(x => {
                this.$scope.editDependencies.push({ key: x.name, text: x.name });
            });

            this.$scope.editCategories = [];
            if (this.$scope.mod.tags) {
                this.$scope.mod.tags.forEach(x => {
                    var key = x;
                    this.$scope.editCategories.push({ key: key, text: key });
                });
            }

            this.$scope.editAliases = [];
            if (this.$scope.mod.aliases) {
                var split = this.$scope.mod.aliases.split(";");
                split.forEach(x => {
                    var key = x;
                    this.$scope.editAliases.push({ key: key, text: key });
                });
            }
        };

        private processModNames(names) {
            var obj = [];
            for (var i in names) {
                var mod = <any> names[i];
                obj.push({ text: mod.packageName + (mod.name && mod.name != mod.packageName ? " (" + mod.name + ")" : null), key: mod.packageName, id: mod.id });
            }
            return obj;
        }

        logoToUpload;
        galleryToUpload;
    }

    registerController(EditModController);
}
