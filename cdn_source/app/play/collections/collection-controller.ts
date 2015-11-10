module MyApp.Play.Collections {
    export interface ICollectionScope extends IContentScopeT<IBreezeCollection>, IHandleCommentsScope<IBreezeCollectionComment> {
        baskets: Components.Basket.GameBaskets;
        isInBasket: (mod: IBreezeMod) => boolean;
        addToBasket: (mod: IBreezeMod) => void;
        toggleSubscribe: () => void;
        versionConstraints: {};
        addTag: (data: any) => boolean;
        getCurrentTags: () => any[];
        removeTag: (data: any) => void;
        scopes: any[];
        uploadingCollectionImage: boolean;
        onFileSelectLogo: (files: any, $event: any) => void;
        onFileSelectGallery: (files: any, $event: any) => void;
        showHelp: () => void;
        fileDropped: ($files: any, $event: any, $rejectedFiles: any) => void;
        accept: any;
        showUploadBanner: () => void;
        newRemoteLogoUploadRequest: (file: string) => void;
        clients: { name: string; number: string }[];
        tryDirectDownloadCollection: any;
        getDependencies: (query: any) => any;
        addModDependency: (data: any, hide: any) => boolean;
        useSync: boolean;
    }

    export class CollectionController extends ContentModelController<IBreezeCollection> {
        static $name = 'CollectionController';
        static menuItems = [
            { header: "Info", segment: "info", isDefault: true },
            { header: "Content", segment: "content" }
            //{ header: "Comments", segment: "comments" }
        ];
        static $inject = ['$scope', 'logger', '$routeParams', '$q', '$sce', 'localStorageService', 'w6', 'ForwardService', '$timeout', 'UploadService', '$popover', '$rootScope', 'basketService', 'aur.eventBus', 'model'];

        constructor(public $scope: ICollectionScope, public logger, public $routeParams, $q, $sce: ng.ISCEService, private localStorageService, private w6: W6, private forwardService: Components.ForwardService, private $timeout: ng.ITimeoutService, private uploadService: Components.Upload.UploadService, private $popover, $rootScope: IRootScope, basketService: MyApp.Components.Basket.BasketService, eventBus: IEventBus, model: IBreezeCollection) {
            super($scope, logger, $routeParams, $q, $sce, model);

            window.w6Cheat.collection = this;

            $scope.useSync = $scope.w6.enableBasket && $scope.model.preferredClient != 'PlayWithSix'; // bah string enum

            $scope.tryDirectDownloadCollection = () => {
                if (model.latestVersion.repositories != null) {
                    this.$scope.request(OpenRepoCollectionDialogQuery, { model: this.$scope.model });
                }
                return $scope.directDownloadCollection(this.$scope.model);
            }

            var basket = $scope.game && basketService.getGameBaskets($scope.game.id);
            $scope.addToBasket = (mod: IBreezeMod) => basketService.addToBasket($scope.game.id, Helper.modToBasket(mod));
            $scope.baskets = basket;
            $scope.isInBasket = (mod: IBreezeMod) => {
                return basket && basket.active.content.indexOf(mod.id) != -1;
            };

            $scope.versionConstraints = {};
            if (model.latestVersionId != null)
                model.entityAspect.loadNavigationProperty("latestVersion")
                    .then(r => angular.forEach(model.latestVersion.dependencies, d => {
                        if (d.constraint)
                            $scope.versionConstraints[d.modDependencyId] = d.constraint;
                    }))
                    .catch(r => this.breezeQueryFailed(r));

            $scope.toggleSubscribe = () => {
                if (this.$scope.subscribedCollections[model.id])
                    this.unsubscribe();
                else
                    this.subscribe();
            };

            $scope.clients = [
                { name: "Default", number: "Default" },
                { name: "Sync", number: "Sync" },
                { name: "Play withSIX", number: "PlayWithSix" }
            ];

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
            $scope.accept = ($files, $event) => {
                return true;
            };
            this.showUploadBanner();
            //$scope.accept = "image/*,audio/*,video/*,text/html";

            this.setupCategoriesAutoComplete();

            this.setupTitle("model.name", "{0} - " + model.game.name);

            this.setupEditing();
            this.setupHelp();

            var handleClient = newValue => {
                Debug.log("handlepreferredclient: ", newValue);
                if (newValue == "Sync") {
                    eventBus.publish(new window.w6Cheat.containerObjects.enableBasket());
                } else if (newValue == "PlayWithSix") {
                    eventBus.publish(new window.w6Cheat.containerObjects.restoreBasket());
                } else {
                    eventBus.publish(new window.w6Cheat.containerObjects.restoreBasket());
                }
            }

            handleClient(model.preferredClient);

            $scope.$watch('model.preferredClient', (newValue: string, oldValue: string, scope) => {
                if (newValue === oldValue)
                    return;
                // todo; restore existing etc when navigating away?
                handleClient(newValue);
            });


            if (window.location.pathname.endsWith("/content/edit"))
              this.$scope.editConfig.enableEditing();

            var handleEditMode = (newV) => {
              var menuEntry = $scope.header.menuItems.asEnumerable().first(x => x.header == "Content");
              menuEntry.url = newV ? $scope.gameUrl + "/collections/" + model.id.toShortId() + "/" + model.name.sluggifyEntityName() + "/content/edit" : null;
              if (newV) {
                if (window.location.pathname.endsWith("/content"))
                  eventBus.publish(new window.w6Cheat.containerObjects.navigate(window.location.pathname + "/edit"));
              } else {
                if (window.location.pathname.endsWith("/edit"))
                  eventBus.publish(new window.w6Cheat.containerObjects.navigate(window.location.pathname.replace("/edit", "")));
              }
            }

            var w = $scope.$watch('editConfig.editMode', (newV: boolean, oldV: boolean, scope) => {
              if (newV === oldV) return;
              setTimeout(() => handleEditMode(newV));
            });

            handleEditMode($scope.editConfig.editMode);

            $scope.$on('$destroy', () => {
              window.w6Cheat.collection = null;
              eventBus.publish(new window.w6Cheat.containerObjects.restoreBasket());
              w();
            });
            var hasLanding = $routeParams.hasOwnProperty("landing");
            var hasRepoLanding = $routeParams.hasOwnProperty("landingrepo");
            if ((hasLanding || hasRepoLanding) && (this.$scope.editConfig.canEdit() || this.$scope.editConfig.canManage()))
                this.$scope.request(OpenNewCollectionWelcomeDialogQuery, { model: {model: this.$scope.model, repoLanding: hasRepoLanding}, editConfig: this.$scope.editConfig });
        }

        // workaround for angular vs aurelia

        public enableEditModeFromAurelia() {                 this.applyIfNeeded(() => {
                        this.$scope.editConfig.enableEditing();
                      })}

                      public disableEditModeFromAurelia() {                 this.applyIfNeeded(() => {
                                      this.$scope.editConfig.closeEditing();
                                    })}

        public saveFromAurelia() {
          return this.$scope.editConfig.hasChanges() ? this.$scope.editConfig.saveChanges() : null;
        }

        public cancelFromAurelia() {
          if (this.$scope.editConfig.hasChanges())
            this.$scope.editConfig.discardChanges();
        }

        public hasChangesFromAurelia() {
          return this.$scope.editConfig.hasChanges();
        }

        private setupCategoriesAutoComplete() {
            var $scope = this.$scope;

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
            //$scope.getCategories = (query) => this.$scope.request(ContentIndexes.Mods.GetCategoriesQuery, { query: query })
            //    .then((d) => this.processNames(d.lastResult))
            //    .catch(this.breezeQueryFailed);
        }

        unsubscribe() {
            this.requestAndProcessResponse(UnsubscribeCollectionCommand, { model: this.$scope.model })
                .then(r => {
                    delete this.$scope.subscribedCollections[this.$scope.model.id];
                    this.$scope.model.subscribersCount -= 1;
                });
        }

        subscribe() {
            this.requestAndProcessResponse(SubscribeCollectionCommand, { model: this.$scope.model })
                .then(r => {
                    this.$scope.subscribedCollections[this.$scope.model.id] = true;
                    this.$scope.model.subscribersCount += 1;
                    if (this.w6.client && this.w6.client.clientFound) {
                        this.w6.client.openPwsUri("pws://?c=" + this.$scope.toShortId(this.$scope.model.id));
                        return;
                    }
                    if (this.localStorageService.get('clientInstalled') == null
                      && !this.$scope.w6.isClient
                        && confirm("Before downloading this content, make sure you have \"Play\" our withSIX client installed. To download the client software now, click ok. To proceed with the download, click cancel.")) {
                        this.forwardService.forward(this.w6.url.main + "/download" + this.$scope.useSync ? '' : '?basket=0');
                        //localStorageService.set('clientInstalled', true);
                    } else {
                        this.localStorageService.set('clientInstalled', true);
                        //Downloads.startDownload(url);
                    }
                });
        }

        setupContentHeader(content: IBreezeCollection): IContentHeader {
            var contentPath = content.game.slug + "/collections";
            var shortPath = contentPath + "/" + this.$scope.toShortId(content.id);
            var fullPath = shortPath + "/" + content.slug;
            var menuItems = CollectionController.menuItems;
            if (this.$scope.model.forkedCollectionId != null
                || this.$scope.model.forkedCollectionsCount > 0)
                menuItems = menuItems.concat([{ header: "Related", segment: "related" }]);

            var header = <IContentHeader>{
                title: content.name,
                menuItems: this.getMenuItems(menuItems, "game.collectionsShow"),
                contentType: "collection",
                getAvatar: (width, height) => {
                    if (this.tempCollectionImagePath != null)
                        return this.tempCollectionImagePath;

                    if (this.$scope.model.fileTransferPolicies.length > 0) {
                        var policy = this.$scope.model.fileTransferPolicies[0];
                        if (policy.uploaded)
                            return this.$scope.url.getUsercontentUrl2(policy.path);
                    }

                    return this.getImageOrPlaceholder(this.getContentAvatarUrl(content.avatar, content.avatarUpdatedAt), width, height);
                },
                getBanner: (width, height) => this.getImageOrPlaceholder(this.getContentAvatarUrl(content.avatar), width, height),
                avatar: content.avatar,
                gameSlug: content.game.slug,
                contentPath: fullPath,
                contentRootUrl: this.$scope.url.play + "/" + contentPath,
                contentUrl: this.$scope.url.play + "/" + fullPath,
                shortContentUrl: this.$scope.url.play + "/" + shortPath,
                tags: content.tags || []
            };

            this.$scope.scopes = [
                { text: "Public" },
                { text: "Unlisted" },
                { text: "Private" }
            ];

            return header;
        }
        private setupDependencyAutoComplete() {
            this.$scope.getDependencies = (query) => this.$scope.request(ContentIndexes.Mods.GetModTagsQuery, { gameSlug: this.$routeParams.gameSlug, query: query })
                .then((d) => this.processModNames(d.lastResult))
                .catch(this.breezeQueryFailed);
            this.$scope.addModDependency = (data, hide) => {
                var found = false;

                angular.forEach(this.$scope.model.latestVersion.dependencies, item => {
                    if (data.id == item.id) {
                        found = true;
                    }
                });

                // ReSharper disable once ExpressionIsAlwaysConst, ConditionIsAlwaysConst
                if (!found) {
                    //ADD ITEM
                    //BreezeEntityGraph.ModDependency.createEntity({ id: data.id, modId: this.$scope.model.id, name: data.name, });
                }
                hide();
                return false;
            };
        }
        private processModNames(names) {
            var obj = [];
            for (var i in names) {
                var mod = <any> names[i];
                obj.push({ text: (mod.name && mod.name != mod.packageName ? mod.name + " (" + mod.packageName + ")" : mod.packageName), key: mod.packageName, id: mod.id, name: mod.name || mod.packageName });
            }
            return obj;
        }
        private setupEditing = () => {

            this.setupEditConfig({
                canEdit: () => this.$scope.model.author.id == this.$scope.w6.userInfo.id,
                discardChanges: () => {
                    this.entityManager.getChanges().filter((x, i, arr) => {
                        return (x.entityType.shortName == "Collection") ? ((<IBreezeCollection>x).id == this.$scope.model.id) : ((<any>x).collectionId && (<any>x).collectionId == this.$scope.model.id);
                    }).forEach(x => x.entityAspect.rejectChanges());
                    this.$scope.header.tags = this.$scope.model.tags || [];
                }
            }, null,
            [
                BreezeEntityGraph.Collection.forkedCollection().$name,
                BreezeEntityGraph.Collection.forkedCollections().$name, BreezeEntityGraph.Collection.latestVersion().$name,
                BreezeEntityGraph.Collection.mediaItems().$name, BreezeEntityGraph.Collection.fileTransferPolicies().$name,
                BreezeEntityGraph.Collection.latestVersion().dependencies().$name,
                BreezeEntityGraph.Collection.latestVersion().dependencies().modDependency().$name
            ]); // TODO: Throws errors , BreezeEntityGraph.Collection.versions().$name, BreezeEntityGraph.Collection.dependencies().$name
            this.$scope.$watch("uploadingModImage", (newValue, oldValue, scope) => {
                if (newValue == oldValue) return;

                if (!newValue) {
                    this.tempCollectionImagePath = null;
                }
            });
            this.setupDependencyAutoComplete();
        };

        private cancelImageUpload() {
            var $scope = this.$scope;

            this.tempCollectionImagePath = null;
            if ($scope.model.fileTransferPolicies.length > 0) {
                var transferPolicy = $scope.model.fileTransferPolicies[0];

                transferPolicy.entityAspect.setDeleted();
                $scope.editConfig.saveChanges(transferPolicy);
            }
        }

        private newLogoUploadRequest(file: File, $event: any) {
            var $scope = this.$scope;
            //if ($scope.model.imageFileTransferPolicy) {
            //    throw Error("An Upload Request already exists.");
            //}
            if (file == null)
                return;

            if ($scope.uploadingCollectionImage) {
                this.logger.error("You are already uploading an image! Please wait!");
                return;
            }

            if (file.name.endsWithIgnoreCase(".gif")) {
                this.logger.error("You are unable to upload gifs for your mod logo.");
                return;
            }

            $scope.uploadingCollectionImage = true;

            var uploadRequest = BreezeEntityGraph.CollectionImageFileTransferPolicy.createEntity({
                path: file.name,
                collectionId: $scope.model.id
            });

            var fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            fileReader.onload = e => {
                this.$timeout(() => {
                    if ($scope.uploadingCollectionImage)
                        this.tempCollectionImagePath = (<any>e.target).result;
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
                    $scope.uploadingCollectionImage = false;
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

            if ($scope.uploadingCollectionImage) {
                this.logger.error("You are already uploading an image! Please wait!");
                return;
            }

            if (file.endsWithIgnoreCase(".gif")) {
                this.logger.error("You are unable to upload gifs for your mod logo.");
                return;
            }

            $scope.uploadingCollectionImage = true;

            var uploadRequest = BreezeEntityGraph.CollectionImageFileTransferPolicy.createEntity({
                path: file,
                collectionId: $scope.model.id
            });

            this.tempCollectionImagePath = file;

            var saveChanges = this.entityManager.saveChanges([uploadRequest])
                .then((result) => {
                    Debug.log(result, uploadRequest, $scope.model.fileTransferPolicies);
                    this.uploadRemoteLogo(file, uploadRequest);
                    return;
                }).catch((reason) => {
                    Debug.log("Failure", reason);
                    this.logger.error("We were unable to retrieve an upload policy for your image. Please try again later", "Failed to upload image.");
                    this.cancelImageUpload();
                    $scope.uploadingCollectionImage = false;
                    return;
                });
        }

        private uploadLogo(file: File, policy: IBreezeCollectionImageFileTransferPolicy) {
            var $scope = this.$scope;
            this.uploadService.uploadToAmazonWithPolicy(file, policy.uploadPolicy)
                .success((data: string, status: number, headers: (headerName: string) => string, config: ng.IRequestConfig) => {
                    Debug.log(data, status, headers, config);

                    this.logger.info("When you're happy click Save Changes to use the uploaded image.", "Image Uploaded");
                    policy.uploaded = true;
                    $scope.uploadingCollectionImage = false;
                }).error((data: string, status: number, headers: (headerName: string) => string, config: ng.IRequestConfig) => {
                    Debug.log(data, status, headers, config);
                    Debug.log("Failure");

                    this.cancelImageUpload();
                    $scope.uploadingCollectionImage = false;

                    if (data.includes("EntityTooLarge")) {
                        this.logger.error("Your image can not be larger than 5MB", "Image too large");
                    }
                    if (data.includes("EntityTooSmall")) {
                        this.logger.error("Your image must be at least 10KB", "Image too small");
                    }
                });
        }

        private uploadRemoteLogo(file: string, policy: IBreezeCollectionImageFileTransferPolicy) {
            var $scope = this.$scope;
            this.logger.info("When you're happy click Save Changes to use the uploaded image.", "Image Uploaded");
            policy.uploaded = true;
            $scope.uploadingCollectionImage = false;
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

        tempCollectionImagePath: any;

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

            var showSection = (item: HelpItem<ICollectionScope>) => {
                item.popover = this.$popover($(item.element), item.data);
                this.$timeout(() => {
                    item.popover.show();
                    helpItem.popover.hide();
                });
            };

            var displayCondition = (item: HelpItem<ICollectionScope>, scope: ICollectionScope): boolean => {
                if ($(item.element).length == 0)
                    return false;

                return item.conditional(scope);
            };

            this.$scope.showHelp = () => {
                helpItem.popover = this.$popover($(helpItem.element), helpItem.data);

                this.$timeout(() => {
                    var helpPopover = helpItem.popover;
                    helpPopover.$scope.helpItems = CollectionController.helpItems;
                    helpPopover.$scope.showSection = showSection;
                    helpPopover.$scope.contentScope = $scope;
                    helpPopover.$scope.displayCondition = displayCondition;
                    helpPopover.show();
                });
            };
        }

        private static helpItemTemplate: string = "/cdn_source/app/play/mods/popovers/help-item-popover.html";
        private static helpItems: HelpItem<ICollectionScope>[] = [
            {
                element: "#openEditorButton",
                data: {
                    title: 'How to get started',
                    content: 'Click here to “open editor”. This will allow you to interact with several items directly inside the Page. ',
                    trigger: 'manual',
                    container: 'body',
                    autoClose: true,
                    template: CollectionController.helpItemTemplate
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
                    template: CollectionController.helpItemTemplate
                },
                conditional: ($scope) => $scope.editConfig.editMode,
                popover: null
            },
            {
                element: "#addCollectionTag",
                data: {
                    title: 'Add/Edit Tags',
                    content: 'Click on + you can add the Tag(s) that best fit the type of your.<br/><br/><b>Hint:</b> Don´t use more than four tags if possible, as too many tags will confuse players. ',
                    trigger: 'manual',
                    container: 'body',
                    autoClose: true,
                    template: CollectionController.helpItemTemplate
                },
                conditional: ($scope) => $scope.editConfig.editMode,
                popover: null
            },
            {
                element: "#collectionDescription",
                data: {
                    title: 'Edit your Description',
                    content: 'Keybord Shortcuts : <a target="_blank" href="http://imperavi.com/redactor/docs/shortcuts/">http://imperavi.com/redactor/docs/shortcuts/</a><br/><br/><b>Hint:</b> you can also import your BI Forum description. All you need is to set your BI forum thread as homepage and click on “Import Forum post”.',
                    trigger: 'manual',
                    container: 'body',
                    autoClose: true,
                    template: CollectionController.helpItemTemplate
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
                    template: CollectionController.helpItemTemplate,
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
                    template: CollectionController.helpItemTemplate
                },
                conditional: ($scope) => $scope.editConfig.editMode,
                popover: null
            }*/
        ];
    }

    registerController(CollectionController);

    export class RepoCollectionDialogController extends ModelDialogControllerBase<ICollectionScope> {
        static $name = 'RepoCollectionDialogController';
        static $view = '/cdn_source/app/play/collections/dialogs/repo-collection-warning.html';

        constructor(public $scope, public logger, $modalInstance, $q, model: ICollectionScope) {
            super($scope, logger, $modalInstance, $q, model);

            $scope.model = model.model;
        }
    }

    registerController(RepoCollectionDialogController);

    export class CollectionInfoController extends ContentController {
        static $name = 'CollectionInfoController';

        static $inject = ['$scope', 'logger', '$routeParams', '$q', '$timeout', '$popover'];

        constructor(public $scope: ICollectionScope, logger, $routeParams, $q, public $timeout, public $popover) {
            super($scope, logger, $routeParams, $q);


            this.setupComments($scope.model);
            this.setupTitle("model.name", "Info - {0} - " + $scope.model.game.name);
        }

        private setupComments(collection: IBreezeCollection) {
            this.$scope.addComment = newComment => {
                Debug.log('Add new comment', newComment);

                var r = this.$scope.requestWM<ICreateComment<IBreezeCollectionComment>>(CreateCollectionCommentCommand, { model: { replyTo: newComment.replyTo, contentId: this.$scope.model.id, message: newComment.message, replyToId: newComment.replyTo ? newComment.replyTo.id : undefined } }).catch(x => { this.breezeQueryFailed(x); });
                newComment.message = "";
                newComment.valueOf = false;

                return r;
            };
            this.$scope.deleteComment = comment => this.$scope.request(DeleteCollectionCommentCommand, { model: comment }).catch(x => { this.breezeQueryFailed(x); }),
                this.$scope.saveComment = comment => {
                    Debug.log("Saving comment", comment);
                    return this.$scope.request(SaveCollectionCommentCommand, { model: comment }).catch(x => { this.breezeQueryFailed(x); });
                };
            this.$scope.reportComment = (comment) => { throw "NotImplemented"; };
            if (this.$scope.environment != Tk.Environment.Production) {
                this.$scope.commentLikeStates = {};
                if (this.$scope.w6.userInfo.id) {
                    this.$timeout(() => this.$scope.request(GetCollectionCommentLikeStateQuery, { collectionId: this.$scope.model.id })
                        .then(results => this.subscriptionQuerySucceeded(results.lastResult, this.$scope.commentLikeStates))
                        .catch(this.breezeQueryFailed));
                }

                this.$scope.likeComment = comment => {
                    this.$scope.request(LikeCollectionCommentCommand, { collectionId: this.$scope.model.id, id: comment.id }).then(() => {
                        comment.likesCount += 1;
                        this.$scope.commentLikeStates[comment.id] = true;
                    });
                };
                this.$scope.unlikeComment = comment => {
                    this.$scope.request(UnlikeCollectionCommentCommand, { collectionId: this.$scope.model.id, id: comment.id }).then(() => {
                        comment.likesCount -= 1;
                        this.$scope.commentLikeStates[comment.id] = false;
                    });
                };
            }

            this.$timeout(() => this.$scope.request(GetCollectionCommentsQuery, { collectionId: this.$scope.model.id }));
        }

    }

    registerController(CollectionInfoController);

    export class CollectionContentEditController extends BaseController {
      static $name = 'CollectionContentEditController';
    }

    registerController(CollectionContentEditController);

    export interface ICollectionContentScope extends ICollectionScope, IContentIndexScope {
        items: breeze.Entity[];
        totalServerItems;
        pagingOptions: { currentPage: number };
        totalPages;
        otherOptions: { view: string };
        contentTags;
        addTag(tag);
    }

    export class CollectionContentController extends ContentsController {
        static $name = 'CollectionContentController';

        static $inject = [
            '$q', '$scope', '$timeout',
            '$cookieStore', '$location', '$routeParams', 'w6',
            'modDataService', 'logger', 'DoubleClick'
        ];

        constructor(public $q: ng.IQService, public $scope: ICollectionContentScope, public $timeout: ng.ITimeoutService,
            public $cookieStore, public $location: ng.ILocationService, public $routeParams: ng.route.IRouteParamsService, w6,
            public dataService: ContentIndexes.Mods.ModDataService, public logger: Components.Logger.ToastLogger, public dfp) {

            super(dataService, $q, $scope, w6, $routeParams, logger, $cookieStore, $location, $timeout, dfp);

            $scope.addTag = this.addTag;

            // It seems we need to slightly delay to make the spinner appear (is that since angular 1.3?)
            $timeout(() => { this.refresh(); });

            // TODO: Move to Directive..
            $('body').removeClass('game-profile');
            $('body').addClass('game-profile');

            this.setupTitle("model.name", "Content - {0} - " + $scope.model.game.name);

            // TODO: when going to edit mode, navigate to:
            //this.eventBus.publish(new window.w6Cheat.containerObjects.navigate(window.location.pathname + "/edit"))
            //this.$scope.editConfig.
        }

        private addTag = (tag) => {
            this.$scope.views.tags.length = 0;
            this.$scope.views.tags.push({ key: "tag:" + tag, text: "tag:" + tag });
        };

        public handleVariants() {
            this.cookiePrefix = 'collection';

            //$scope.title = "Mods in collection";

            this.$scope.views.grid.itemTemplate = this.getViewInternal('play/mods', '_mod_grid');
        }

        public getItems() {
            this.$scope.cancelOutstandingRequests();
            this.$scope.request(GetCollectionContentTagsQuery, { id: this.$scope.model.latestVersionId })
                .then(r => this.$scope.contentTags = r.lastResult);
            return this.getData()
                .then(this.querySucceeded)
                .catch(this.breezeQueryFailed);
        }

        private getData() { return this.dataService.getModsInCollection(Tools.fromShortId(this.$routeParams['collectionId']), this.getOptions()); }

        public getItemUrl(item): string {
            return this.w6.url.play + "/" + item.game.slug + "/mods/" + Tools.toShortId(item.id) + "/" + Tools.sluggify(item.name); // TODO: slug once converted..
        }

        public getPrefixes(query) {
            if (query.startsWith("tag:")) {
                var name = query.substring(4);
                if (name.length > 0)
                    return this.getTagTags(name);
                return this.defaultPrefixes();
            }

            if (query.startsWith("user:")) {
                var name = query.substring(5);
                if (name.length > 0)
                    return this.getUserTags(name);
                return this.defaultPrefixes();
            }

            if (query.length > 2)
                return this.getSelfTags(query);

            return this.defaultPrefixes();
        }

        private getSelfTags(name: string) {
            return this.dataService.getModsInCollectionByName(Tools.fromShortId(this.$routeParams['collectionId']), name)
                .then((d) => this.processModsWithPrefix(d.results, "mod:"))
                .catch((reason) => this.breezeQueryFailed(reason));
        }

        private getTagTags(name: string) {
            return this.$scope.request(ContentIndexes.Mods.GetCategoriesQuery, { query: name })
                .then((d) => this.processNamesWithPrefix(d.lastResult, "tag:"))
                .catch((reason) => this.breezeQueryFailed(reason));
        }
    }

    registerController(CollectionContentController);

    export class CollectionRelatedController extends ContentController {
        static $name = 'CollectionRelatedController';

        constructor(public $scope: ICollectionScope, public logger, public $routeParams, $q) {
            super($scope, logger, $routeParams, $q);

            if ($scope.model.forkedCollectionId) $scope.model.entityAspect.loadNavigationProperty("forkedCollection");
            //$scope.model.entityAspect.loadNavigationProperty("forkedCollections");

            this.setupTitle("model.name", "Related - {0} - " + $scope.model.game.name);
        }
    }

    registerController(CollectionRelatedController);

    // Not used right now..
    export class CollectionCommentsController extends ContentController {
        static $name = 'CollectionCommentsController';

        constructor(public $scope: ICollectionScope, public logger, public $routeParams, $q) {
            super($scope, logger, $routeParams, $q);
            this.setupTitle("model.name", "Content - {0} - " + $scope.model.game.name);
        }
    }

    registerController(CollectionCommentsController);
}
