module MyApp.Components.Dialogs {
    export class DefaultDialogController extends DialogControllerBase {
        static $name = "DefaultDialogController";

        constructor($scope, logger, $modalInstance, $q) {
            super($scope, logger, $modalInstance, $q);
            $scope.ok = () => $modalInstance.close();
        }
    }

    export class DefaultDialogWithDataController extends DialogControllerBase {
        static $inject = ['$scope', 'logger', '$modalInstance', '$q', 'data'];
        static $name = "DefaultDialogWithDataController";

        constructor($scope, logger, $modalInstance, $q, data) {
            super($scope, logger, $modalInstance, $q);
            $scope.ok = () => $modalInstance.close();
            $scope.data = data;
        }
    }

    export class ReportDialogController extends DialogControllerBase {
        static $inject = ['$scope', 'logger', '$routeParams', '$location', '$modalInstance', '$q'];
        static $name = 'ReportDialogController';
        static $view = '/cdn_source/app/components/dialogs/report.html';

        constructor(public $scope, public logger, $routeParams, $location: ng.ILocationService, $modalInstance, $q) {
            super($scope, logger, $modalInstance, $q);

            $scope.model = { content: $routeParams.content || $location.absUrl() };
            $scope.sendReport = () => this.processCommand($scope.request(SendReportCommand, { data: $scope.model }, "Report sent!")
                .then((data) => $scope.sent = true));
        }
    }

    export class ForgotPasswordDialogController extends DialogControllerBase {
        static $inject = ['$scope', 'logger', '$modalInstance', '$routeParams', '$location', '$q', 'data'];
        static $name = 'ForgotPasswordDialogController';
        static $view = '/cdn_source/app/components/dialogs/forgot-password.html';

        constructor(public $scope, public logger, $modalInstance, $routeParams, $location: ng.ILocationService, $q, model) {
            super($scope, logger, $modalInstance, $q);
            $scope.model = {
                email: model.email
            };
            $scope.submit = () => this.processCommand($scope.request(ForgotPasswordCommand, { data: $scope.model }).then(result => $scope.success = true), "Request sent!");
        }
    }
    
    export class ResendActivationDialogController extends DialogControllerBase {
        static $name = "ResendActivationDialogController";
        static $inject = ['$scope', 'logger', '$modalInstance', '$q', 'data'];
        static $view = '/cdn_source/app/components/dialogs/resend-activation.html';

        constructor(public $scope, public logger, $modalInstance, $q, model) {
            super($scope, logger, $modalInstance, $q);

            $scope.model = {
                email: model.email
            };
            $scope.submit = () => this.requestAndProcessResponse(ResendActivationCommand, { data: $scope.model });
        }
    }

    export class RegisterDialogController extends DialogControllerBase {
        static $name = 'RegisterDialogController';
        static $view = '/cdn_source/app/components/dialogs/register.html';

        constructor($scope, logger, $modalInstance, $q) {
            super($scope, logger, $modalInstance, $q);

            $scope.model = { fingerPrint: new Fingerprint().get() };
            $scope.openForgotPasswordDialog = () => $scope.request(OpenForgotPasswordDialogQuery, { email: $scope.model.email }).then(result => $modalInstance.close());
            $scope.register = () => this.requestAndProcessResponse(Dialogs.RegisterCommand, { data: $scope.model });
        }
    }

    export class RegisterDialogWithExistingDataController extends RegisterDialogController {
        static $name = 'RegisterDialogWithExistingDataController';
        static $inject = ['$scope', 'logger', '$modalInstance', '$q', 'data'];

        constructor($scope, logger, $modalInstance, $q, model) {
            super($scope, logger, $modalInstance, $q);
            $scope.model = model;
            $scope.model.fingerPrint = new Fingerprint().get();
        }
    }

    enum SearchContentType {
        Mod = 1001,
        Mission,
        Collection
    }

    export class SearchDialogController extends DialogControllerBase {
        static $name = "SearchDialogController";
        static $view = '/cdn_source/app/components/dialogs/search.html';

        constructor($scope, logger, public $modalInstance, $q) {
            super($scope, logger, $modalInstance, $q);

            $scope.contentType = SearchContentType;
            $scope.contentTypes = ['Mod', 'Mission', 'Collection'];
            $scope.model = {
                q: "",
                types: angular.copy($scope.contentTypes)
            };
            $scope.results = [];
            $scope.search = () => {
                $scope.resultQ = $scope.model.q;
                this.processCommand($scope.request(SearchQuery, { model: $scope.model })
                    .then((result) => $scope.results = result.lastResult.contentResults), "Search complete");
            };

            $scope.searchOneType = type => {
                $scope.model.types = [SearchContentType[type]];
                $scope.search();
            };
        }
    }

    // Registered because we load it in connect.ts router.. // lets check it anyway
    registerController(ReportDialogController);
}