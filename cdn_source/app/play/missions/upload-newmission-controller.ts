module MyApp.Play.Missions {
    export interface IUploadNewmissionScope extends IBaseScope {
        existingMissions: Object[];
        routeParams;
        submit: (form) => void;
        mission: { files?;name? };
        updateFileInfo: (files) => void;
    }

    export class UploadNewmissionController extends BaseController {
        static $name = 'UploadNewmissionController';
        static $inject = ['$scope', 'logger', '$routeParams', '$timeout', 'userInfo', '$q', 'model'];

        constructor(public $scope: IUploadNewmissionScope, public logger, private $routeParams, private $timeout, userInfo, $q, model) {
            super($scope, logger, $q);

            $scope.routeParams = $routeParams;
            $scope.existingMissions = [];
            $scope.submit = this.submit;
            $scope.mission = {};
            $scope.updateFileInfo = this.updateFileInfo;

            $scope.existingMissions = model;

            // TODO: Fully convert to angular...
            $timeout(() => {
                if (model.length == 0)
                    $('#w6-mission-upload-new').show().removeClass('hidden');

                $(document).on('change', 'select#missionSelect', function() {
                    switch ($(this).val()) {
                    case '---':
                        break;
                    default:
                        window.location = $(this).val();
                    }
                });

                $('#w6-mission-upload-choice').find('input:radio').on('change', function(e) {
                    if ($(this).is(":checked")) {
                        if ($(this).val() == 'new') {
                            $('#w6-mission-upload-update').hide().removeClass('hidden');
                            $('#w6-mission-upload-new').show().removeClass('hidden');
                        } else {
                            $('#w6-mission-upload-new').hide().removeClass('hidden');
                            $('#w6-mission-upload-update').show().removeClass('hidden');
                        }
                    }
                });
            }, 0);
        }

        public updateFileInfo = (files) => {
            Debug.log("updateFileInfo", files);
            this.$scope.mission.files = files;
        };
        public submit = () => this.requestAndProcessResponse(UploadNewMissionCommand, { missionName: this.$scope.mission.name, gameSlug: this.$routeParams.gameSlug, files: this.$scope.mission.files });
    }

    registerController(UploadNewmissionController);
}