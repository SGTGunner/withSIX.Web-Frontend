module MyApp.Play.ContentIndexes.Servers {
    export class AddServerDialogController extends DialogControllerBase {
        static $name = 'AddServerDialogController';
        static $inject = ['$scope', 'logger', '$modalInstance', '$location', '$q', 'gameSlug'];
        static $view = '/cdn_source/app/play/servers/add-server-dialog.html';

        constructor(public $scope, logger, $modalInstance, $location: ng.ILocationService, $q, gameSlug) {
            super($scope, logger, $modalInstance, $q);

            $scope.model = { isQueryPort: false, address: null };
            $scope.cancel = () => $modalInstance.close();
            $scope.ok = () => {
                $scope.request(AddServerCommand, { address: $scope.model.address, isQueryPort: $scope.model.isQueryPort, gameSlug: gameSlug })
                    .then((result) => {
                        $modalInstance.close();
                        $location.url(Tools.toShortId(result.lastResult));
                    })
                    .catch((reason) => logger.error(reason.message, "Failed"));
            };
        }
    }

    registerController(AddServerDialogController);
}