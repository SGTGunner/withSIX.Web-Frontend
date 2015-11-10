module MyApp.Connect.Me {
    interface IMeScope extends IBaseScope {
        getFullName: () => string
    }

    class MeController extends BaseController {
        static $name = "MeController";
        static $inject = ['$scope', 'logger', 'ForwardService', '$q'];

        constructor(public $scope: IMeScope, public logger, forwardService: Components.ForwardService, $q) {
            super($scope, logger, $q);

            var items = [];
            items.push({ header: "Settings", segment: "settings", icon: "icon-cog", isDefault: true });
            if ($scope.w6.userInfo.isAdmin || $scope.w6.userInfo.isManager)
                items.push({ header: "Blog", segment: "blog", icon: "icon-book" });
            items.push({ header: "Content", segment: "content", icon: "icon-th-large" });
            items.push({ header: "Friends", segment: "friends", icon: "icon-group" });
            items.push({ header: "Messages", segment: "messages", icon: "icon-comments" });
            //items.push({ header: "Special Offers", segment: "offers", icon: "withSIX-icon-Notification" });

            $scope.getFullName = () => {
                var ar = [];
                if ($scope.w6.userInfo.firstName) ar.push($scope.w6.userInfo.firstName);
                if ($scope.w6.userInfo.lastName) ar.push($scope.w6.userInfo.lastName);
                return ar.join(" ");
            };
            $scope.menuItems = this.getMenuItems(items, "me");
        }
    }

    class MeSettingsController extends BaseController {
        static $name = "MeSettingsController";

        constructor(public $scope: IBaseScope, public logger, $q) {
            super($scope, logger, $q);
            var menuItems = <Array<IMenuItem>> [
                { header: "Personal", segment: "personal", isDefault: true, icon: "icon-user" },
                { header: "Avatar", segment: "avatar", icon: "icon-picture" },
                { header: "Credentials", segment: "credentials", icon: "icon-key" }
            ];

            menuItems.push({ header: "Premium", segment: "premium", icon: "withSIX-icon-Badge-Sponsor", cls: "premium" });

            $scope.menuItems = this.getMenuItems(menuItems, "me.settings", true);
        }
    }

    interface IMeSettingsPersonalScope extends IBaseScopeT<any> {
        open: ($event) => void;
        today: Date;
        save: (form) => any;
    }

    class MeSettingsPersonalController extends BaseQueryController<any> {
        static $name = "MeSettingsPersonalController";

        constructor(public $scope: IMeSettingsPersonalScope, public logger, $q, model) {
            super($scope, logger, $q, model);

            $scope.today = new Date();
            $scope.save = (form) => this.requestAndProcessResponse(SaveMeSettingsPersonalCommand, { data: $scope.model })
                .then((data) => {
                    form.$setPristine();
                    $scope.$emit('myNameChanged', { firstName: $scope.model.firstName, lastName: $scope.model.lastName });
                });
        }
    }

    interface IMeSettingsPremiumScope extends IBaseScopeT<any> {
        cancelPremium: () => any;
        save: (form) => any;
        cancelModel: { password: string; reason?: string };
    }

    class MeSettingsPremiumController extends BaseQueryController<any> {
        static $name = "MeSettingsPremiumController";
        static $inject = ['$scope', 'logger', '$q', 'model', 'refreshService'];

        constructor(public $scope: IMeSettingsPremiumScope, public logger, $q, model, refreshService) {
            super($scope, logger, $q, model);
            $scope.cancelModel = { password: "", reason: "" };
            $scope.cancelPremium = () => this.requestAndProcessResponse(CancelPremiumRecurringCommand, { model: $scope.cancelModel })
                .then((result) => refreshService.refreshType('me.settings.premium'));

            $scope.save = (form) => this.requestAndProcessResponse(SavePremiumCommand, { data: { hidePremium: model.hidePremium } })
                .then((result) => form.$setPristine());
        }
    }

    interface IMeSettingsCredentialsScope extends IBaseScopeT<any> {
        save: (form) => any;
        saveOther: (form) => any;
        connectExternal: (system) => any;
        modelOther: { twoFactorEnabled };
        openForgotPasswordDialog: () => any;
    }

    class MeSettingsCredentialsController extends BaseQueryController<any> {
        static $name = "MeSettingsCredentialsController";

        static $inject = ['$scope', 'logger', '$q', '$window', '$location', 'model'];

        constructor(public $scope: IMeSettingsCredentialsScope, public logger, $q, $window, $location, model) {
            super($scope, logger, $q, model);

            $scope.modelOther = { twoFactorEnabled: model.twoFactorEnabled };
            $scope.save = form => {
                if ($scope.model.emailConfirmed)
                    return this.requestAndProcessResponse(SaveMeSettingsCredentialsCommand, { data: $scope.model })
                        .then((result) => $window.location.reload());
                else
                    return this.requestAndProcessResponse(SaveMeSettingsEmailCredentialsCommand, { data: $scope.model })
                        .then((result) => $window.location.reload());
            };

            // TODO: Second controller
            $scope.saveOther = form => this.requestAndProcessResponse(SaveMeSettingsCredentialsOtherCommand, { data: $scope.modelOther })
                .then((result) => form.$setPristine());

            $scope.connectExternal = system =>
                this.forward($scope.url.connect + "/login/" + system + "?connect=true&fingerprint=" + new Fingerprint().get() + ($scope.model.rememberMe ? "&rememberme=true" : ""), $window, $location);

            $scope.openForgotPasswordDialog = () => $scope.request(Components.Dialogs.OpenForgotPasswordDialogQuery, { email: $scope.model.email });
        }
    }

    interface IMeSettingsAvatarScope extends IBaseScopeT<any> {
        clearAvatar: () => any;
        uploadAvatar: (form) => any;
        updateFileInfo: (files) => any;
        files: Object[];
        refresh: number;
    }

    class MeSettingsAvatarController extends BaseQueryController<any> {
        static $name = "MeSettingsAvatarController";

        constructor(public $scope: IMeSettingsAvatarScope, public logger, $q, model) {
            super($scope, logger, $q, model);

            this.$scope.files = [];
            this.$scope.model.avatarUrl = $scope.url.calculateAvatarUrl(this.getUserModel(), 400);

            $scope.clearAvatar = () => $scope.request(ClearAvatarCommand)
                .then(this.avatarCleared)
                .catch(this.httpFailed);

            $scope.updateFileInfo = (files) => $scope.files = files;

            $scope.uploadAvatar = (form) => {
                this.requestAndProcessResponse(SaveMeSettingsAvatarCommand, { file: $scope.files[0] })
                    .then((data) => this.avatarUploaded(data, form));
            };
        }

        private avatarCleared = (data) => {
            this.$scope.model.hasAvatar = false;
            this.avatarChanged();
        };
        private avatarUploaded = (data, form) => {
            (<HTMLFormElement>document.forms[form.$name]).reset();
            this.$scope.files = [];
            this.$scope.model.hasAvatar = true;
            this.$scope.model.avatarURL = this.$scope.url.contentCdn + "/account/" + this.$scope.w6.userInfo.id + "/profile/avatar/";
            this.$scope.model.avatarUpdatedAt = new Date().toISOString();
            this.avatarChanged();
        };

        private getUserModel() {
            var info = angular.copy(this.$scope.model);
            info.id = this.$scope.w6.userInfo.id;
            return info;
        }

        private avatarChanged() {
            this.$scope.model.avatarUrl = this.$scope.url.calculateAvatarUrl(this.getUserModel(), 400);
            // TODO: We could actually move this into the commandhandlers instead, and $broadcast on the $rootScope instead?
            // $emit sends events up the tree, to parent scopes
            // $broadcast sends events down the tree, to child scopes
            this.$scope.$emit("myAvatarChanged", this.$scope.model);
        }
    }

    class MeBlogController extends BaseController {
        static $name = "MeBlogController";

        constructor(public $scope: IBaseScope, public logger, $q) {
            super($scope, logger, $q);

            $scope.menuItems = this.getMenuItems([
                { header: "Archive", segment: "archive", icon: "icon-list-ul", isDefault: true },
                { header: "Create", segment: "create", icon: "icon-plus-sign" }
            ], "me.blog");
        }
    }

    class MeContentController extends BaseQueryController<any> {
        static $name = "MeContentController";

        constructor(public $scope: IBaseScopeT<any>, public logger, $q, model) {
            super($scope, logger, $q, model);

            var menuItems = [
                { header: "Collections", segment: "collections", icon: "withSIX-icon-Nav-Collection", isDefault: true },
                { header: "Mods", segment: "mods", icon: "withSIX-icon-Nav-Mod" },
                { header: "Missions", segment: "missions", icon: "withSIX-icon-Nav-Mission" }
            ];

            $scope.menuItems = this.getMenuItems(menuItems, "me.content");
        }
    }

    class MeFriendsController extends BaseQueryController<any> {
        static $name = "MeFriendsController";

        constructor(public $scope, public logger, $q, model) {
            super($scope, logger, $q, model);

            $scope.accept = (friendRequest) => this.processCommand($scope.request(AcceptFriendRequestCommand, { friendId: friendRequest.sender.id }))
                .then((data) => Tools.removeEl(model.friendshipRequests, friendRequest));
            $scope.deny = (friendRequest) => this.processCommand($scope.request(DenyFriendRequestCommand, { friendId: friendRequest.sender.id }))
                .then((data) => Tools.removeEl(model.friendshipRequests, friendRequest));
        }
    }

    class MeMessagesController extends BaseQueryController<any> {
        static $name = "MeMessagesController";

        constructor(public $scope: IBaseScopeT<any>, public logger, $q, model) {
            super($scope, logger, $q, model);
        }
    }

    class MeUserMessagesController extends BaseQueryController<any> {
        static $name = "MeUserMessagesController";

        constructor(public $scope, public logger, $q, model) {
            super($scope, logger, $q, model);

            $scope.inputModel = { message: "" };
            $scope.sendMessage = this.sendMessage;
        }

        sendMessage = form =>
            this.processCommand(this.$scope.request(CreatePrivateMessageCommand, { userSlug: this.$scope.model.partner.slug, data: this.$scope.inputModel })
                .then((data) => {
                    this.$scope.model.messages.push({ message: this.$scope.inputModel.body, receivedAt: new Date(), isAuthor: true });
                    this.$scope.inputModel.body = "";
                    form.$setPristine();
                }));
    }

    class MeBlogArchiveController extends BaseQueryController<any> {
        static $name = "MeBlogArchiveController";
    }

    class MeBlogCreateController extends BaseController {
        static $name = "MeBlogCreateController";
        static $inject = ['$scope', 'logger', '$q', '$routeSegment', '$location'];

        constructor(public $scope, public logger, $q, $routeSegment, $location: ng.ILocationService) {
            super($scope, logger, $q);
            var back = () => $location.url($routeSegment.getSegmentUrl("me.blog"));
            $scope.model = { created: new Date() };
            $scope.updateDate = () => $scope.model.created = new Date();
            $scope.cancel = () => back();
            $scope.save = form => this.processCommand($scope.request(CreateBlogPostCommand, { data: $scope.model }))
                .then(() => {
                    form.$setPristine();
                    back();
                });
        }
    }

    export interface IMeBlogEditScope extends IBaseScopeT<any> {
        save: (form) => any;
        delete: () => any;
        cancel: () => void;
        updateDate: () => Date;
    }

    class MeBlogEditController extends BaseQueryController<any> {
        static $name = "MeBlogEditController";
        static $inject = ['$scope', 'logger', '$q', 'model', '$routeSegment', '$location'];

        constructor(public $scope: IMeBlogEditScope, public logger, $q, model, $routeSegment, $location: ng.ILocationService) {
            super($scope, logger, $q, model);

            var back = () => $location.url($routeSegment.getSegmentUrl("me.blog"));

            $scope.save = form => this.processCommand($scope.request(UpdateBlogPostCommand, { id: model.id, data: model }))
                .then(() => {
                    form.$setPristine();
                    back();
                });

            $scope.updateDate = () => $scope.model.created = new Date();

            $scope.cancel = () => back();
            $scope.delete = () => this.processCommand($scope.request(DeleteBlogPostCommand, { id: model.id }), 'Post deleted')
                .then(() => back());
        }
    }

    registerController(MeController);

    registerController(MeMessagesController);
    registerController(MeUserMessagesController);
    registerController(MeFriendsController);
    registerController(MeContentController);

    registerController(MeSettingsController);
    registerController(MeSettingsPersonalController);
    registerController(MeSettingsPremiumController);
    registerController(MeSettingsCredentialsController);
    registerController(MeSettingsAvatarController);

    registerController(MeBlogController);
    registerController(MeBlogArchiveController);
    registerController(MeBlogCreateController);
    registerController(MeBlogEditController);
}
