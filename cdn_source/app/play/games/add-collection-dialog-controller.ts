module MyApp.Play.Games {
    //export interface IMultiPageDialogScope extends IBaseScope {
    //    page: string;
    //}

    export interface IAddCollectionDialogScope extends IMultiPageDialogScope {
        model;
        claimToken: string;
        cancel: Function;
        ok: Function;
        verifyToken: Function;
        verificationFailed: Boolean;
        formatProvider: string;
        error: string;
        hasHomepageUrl: boolean;
        copy: () => void;
        reload: () => void;
        okNew: () => void;
        okImport: () => void;
        quote: string;
        folderPattern: RegExp;
        versionPattern: RegExp;
        openTerms: () => void;
        addDependency: (data) => boolean;
        removeDependency: (data) => void;
        getDependencies: (query) => any;
        gameName: string;
        hints: any;
        checkingPackageName: boolean;
        inlineHints: any;
        branches: { displayName: string;value: string }[];
        getForumPost: () => any;
        checkingDownloadLink: boolean;
        importResult: string[];
    }

    export class AddCollectionDialogController extends DialogControllerBase {
        static $name = 'AddCollectionDialogController';
        static $inject = ['$scope', 'logger', '$routeParams', '$location', '$modalInstance', '$q', '$timeout', 'game'];
        static $viewBaseFolder = '/cdn_source/app/play/games/stream/dialogs/';
        private $viewBaseFolder = AddCollectionDialogController.$viewBaseFolder;
        private $newViewBaseFolder = this.$viewBaseFolder + 'add-collection-new/';
        private $importViewBaseFolder = this.$viewBaseFolder + 'add-collection-import/';
        static $view = AddCollectionDialogController.$viewBaseFolder + 'add-collection-dialog.html';
        private $subViewBaseFolder: string;
        private authorSubmission = false;

        constructor(public $scope: IAddCollectionDialogScope, logger, private $routeParams, private $location: ng.ILocationService, $modalInstance, $q, private $timeout: ng.ITimeoutService, private model: IBreezeGame) {
            super($scope, logger, $modalInstance, $q);
            this.$subViewBaseFolder = this.$viewBaseFolder;
            $scope.cancel = this.cancel;
            $scope.ok = this.ok;
            $scope.okNew = this.okNew;
            $scope.okImport = this.okImport;
            $scope.model = {
                gameId: model.id,
                uri: null
            };

            $scope.gameName = model.name;
            $scope.page = this.$subViewBaseFolder + 'add-collection-1.html';
            $scope.quote = this.getQuote();
            $scope.openTerms = () => {
                $scope.request(Components.Dialogs.OpenTermsDialogQuery);
            };
            $scope.hints = AddModDialogController.hints;
            $scope.inlineHints = AddModDialogController.inlineHints;

        }

        private getQuote = (): string => {
            var arr = [
                "A good mod can be part of a great many"
            ];
            return arr[Math.floor(Math.random() * arr.length)];
        };
        private checkPackageName = (packageName: string) => {
            this.$scope.checkingPackageName = true;
            this.$scope.model.packageNameAvailable = false;
            this.$scope.request(Mods.ModExistsQuery, { packageName: packageName })
                .then((result) => {
                    this.$scope.checkingPackageName = false;
                    Debug.log(result);
                    this.$scope.model.packageNameAvailable = !result.lastResult;
                })
                .catch(this.httpFailed);
        };

        checkDownloadLink(uri: string) {
            this.$scope.checkingDownloadLink = true;
            this.$scope.model.downloadLinkAvailable = false;
            this.$scope.request(GetCheckLinkQuery, { linkToCheck: uri })
                .then((result) => {
                    this.$scope.checkingDownloadLink = false;
                    Debug.log(result);
                    this.$scope.model.downloadLinkAvailable = result.lastResult;
                })
                .catch(this.httpFailed);
        }

        private cancel = () => this.$modalInstance.close();
        private reload = () => window.location.reload();

        private ok = () => {
            var data = this.$scope.model;
            if ((<string>data.uri).endsWithIgnoreCase("config.yml")) {
                this.$scope.request(NewImportedCollectionCommand, { data: data })
                    .then(result => {
                    if (result.lastResult.data.length == 1) {
                        var modId = Tools.toShortId(result.lastResult.data[0]);
                        this.$modalInstance.close();
                        //var slug = <string>data.name.sluggifyEntityName();
                        this.$location.path(Tools.joinUri([this.$scope.url.play, this.model.slug, "collections", modId, "slug"])).search('landingrepo', 1);
                    } else {
                        this.$scope.importResult = [];
                        for (var i = 0; i < result.lastResult.data.length; i++) {
                            this.$scope.importResult[i] = Tools.joinUri([this.$scope.url.play, this.model.slug, "collections", Tools.toShortId(result.lastResult.data[i]), "slug"]);
                        }
                        this.$scope.page = this.$newViewBaseFolder + 'add-collection-3.html';
                    }
                    })
                    .catch(this.httpFailed);
            } else {
                this.$scope.request(NewMultiImportedCollectionCommand, { data: data })
                    .then(result => {
                        var modId = Tools.toShortId(result.lastResult.data);
                        this.$modalInstance.close();
                        //var slug = <string>data.name.sluggifyEntityName();
                        this.$location.path(Tools.joinUri([this.$scope.url.play, this.model.slug, "collections", modId, "slug"])).search('landingrepo', 1);
                    })
                    .catch(this.httpFailed);
            }

        };

        private okNew = () => {
            this.$subViewBaseFolder = this.$newViewBaseFolder;
            this.$scope.page = this.$newViewBaseFolder + 'add-collection-2.html';
        };

        donePre: boolean = false;

        private okImport = () => {
            this.$subViewBaseFolder = this.$importViewBaseFolder;

            this.$scope.page = this.$importViewBaseFolder + 'add-collection-2.html';
        };

        public static hints = {
            example: "exmaple text"
        };

        public static inlineHints = {
            repoLink: "Must not be empty and must start with 'http://'"
        };
    }

    registerController(AddCollectionDialogController);
}
