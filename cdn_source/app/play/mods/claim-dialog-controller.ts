module MyApp.Play.Mods {
    export interface IClaimDialogScope extends IBaseScope {
        model;
        page: string;
        claimToken: string;
        cancel: Function;
        ok: Function;
        verifyToken: Function;
        verificationFailed: Boolean;
        formatProvider: string;
        ctModel;
        error: string;
        hasHomepageUrl: boolean;
        copy: () => void;
        reload: () => void;
        stepOneInfo: boolean;
        stepOneShowInfo: () => void;
    }

    export class ClaimDialogController extends DialogControllerBase {
        static $name = 'ClaimDialogController';
        static $inject = ['$scope', 'logger', '$modalInstance', '$q', 'mod', 'supportsClaiming'];
        static $view = '/cdn_source/app/play/mods/dialogs/claim-dialog.html';

        constructor(public $scope: IClaimDialogScope, logger, $modalInstance, $q, private model, supportsClaiming: boolean) {
            super($scope, logger, $modalInstance, $q);

            $scope.cancel = this.cancel;
            $scope.ok = this.ok;
            $scope.verifyToken = this.verifyToken;
            $scope.reload = this.reload;
            $scope.model = model;
            $scope.ctModel = {};
            $scope.stepOneInfo = false;
            $scope.stepOneShowInfo = this.showInformation;
            if (supportsClaiming) {
                $scope.page = '/cdn_source/app/play/mods/dialogs/_claim-page1.html';
            } else {
                $scope.hasHomepageUrl = !(model.homepageUrl == null || model.homepageUrl == '');
                $scope.page = '/cdn_source/app/play/mods/dialogs/_claim-page-not-supported.html';
            }
        }

        private cancel = () => { this.$modalInstance.close(); };
        private reload = () => { window.location.reload(); };
        private showInformation = () => { this.$scope.stepOneInfo = true; };

        private ok = () => {
            this.$scope.request(GetClaimQuery, { modId: this.$scope.model.id })
                .then((result) => {
                    this.$scope.claimToken = result.lastResult.data.token;
                    this.$scope.formatProvider = result.lastResult.data.formatProvider;
                    this.$scope.ctModel = result.lastResult.data;
                    this.$scope.page = '/cdn_source/app/play/mods/dialogs/_claim-page2.html';
                })
                .catch(this.httpFailed);
        };

        private verifyToken = () => {
            this.$scope.verificationFailed = false;
            this.$scope.request(VerifyClaimCommand, { modId: this.$scope.model.id })
                .then((result) => {
                    this.$scope.page = '/cdn_source/app/play/mods/dialogs/_claim-page3.html';
                    this.$scope.error = undefined;
                })
                .catch((reason) => {
                    this.httpFailed(reason);
                    this.$scope.error = reason.data.message;
                });
        };
    }

    registerController(ClaimDialogController);
}