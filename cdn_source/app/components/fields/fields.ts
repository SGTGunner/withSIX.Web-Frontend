module MyApp.Components.Fields {
    class FieldsModule extends Tk.Module {
        static $name = "FieldsModule";

        constructor() {
            super('Components.Fields', []);
            this.tplRoot = '/cdn_source/app/components/fields';

            this.app.directive('sxBirthdayField', () => {
                    return {
                        require: '^form',
                        scope: {
                            birthday: '=model',
                            label: '@',
                            ngDisabled: '=?'
                        },
                        restrict: 'E',
                        link: ($scope, $element, $attrs: any, ctrl) => {
                            new FieldBase().link($scope, $element, $attrs, ctrl, 'birthday', 'Birthday');
                        },
                        templateUrl: this.tplRoot + '/_date-field.html'
                    };
                })
                .directive('sxDatetimeField', () => {
                    return {
                        require: '^form',
                        scope: {
                            datetime: '=model',
                            label: '@',
                            ngDisabled: '=?'
                        },
                        restrict: 'E',
                        link: ($scope, $element, $attrs: any, ctrl) => {
                            new FieldBase().link($scope, $element, $attrs, ctrl, 'datetime', 'Date');
                        },
                        templateUrl: this.tplRoot + '/_datetime-field.html'
                    };
                })
                .directive('sxEmailField', [
                    '$rootScope', ($rootScope: IRootScope) => {
                        return {
                            require: '^form',
                            scope: {
                                email: '=model',
                                label: '@',
                                placeholder: '@',
                                forgotPassword: '&',
                                login: '&',
                                showLabel: '=?'
                            },
                            restrict: 'E',
                            link: ($scope, $element, $attrs: any, ctrl) => {
                                new FieldBase().link($scope, $element, $attrs, ctrl, 'email', 'Email');
                                // TODO: OnBlur only!sb@
                                if ($attrs.checkAlreadyExists) {
                                    // TODO: Only if not other validations failed?
                                    // using viewValue as workaround because model not set when already invalid last time
                                    $scope.checkExists = () => $rootScope.request(Dialogs.EmailExistsQuery, { email: ctrl.email.$viewValue })
                                        .then(result => {
                                            ctrl.email.$setValidity("sxExists", !result.lastResult);
                                            // workaround angular not updating the model after setValidity..
                                            // https://github.com/angular/angular.js/issues/8080
                                            if (ctrl.email.$valid) $scope.email = ctrl.email.$viewValue;
                                        });
                                };
                                $scope.blurred = () => {
                                    ctrl.email.sxBlurred = true;
                                    if ($scope.checkExists) $scope.checkExists();
                                };
                            },
                            templateUrl: this.tplRoot + '/_email-field.html'
                        };
                    }
                ])
                .directive('sxTextField', [
                    '$rootScope', ($rootScope: IRootScope) => {
                        return {
                            require: '^form',
                            scope: {
                                text: '=model',
                                label: '@',
                                placeholder: '@',
                                checkAlreadyExists: '&?'
                            },
                            restrict: 'E',
                            link: ($scope, $element, $attrs: any, ctrl) => {
                                new FieldBase().link($scope, $element, $attrs, ctrl, 'text', 'Text');
                                // TODO: OnBlur only!sb@
                                if ($attrs.checkAlreadyExists) {
                                    // TODO: Only if not other validations failed?
                                    // using viewValue as workaround because model not set when already invalid last time
                                    $scope.checkExists = () => $scope.checkAlreadyExists({ value: ctrl.text.$viewValue })
                                        .then(result => {
                                            ctrl.text.$setValidity("sxExists", !result);
                                            // workaround angular not updating the model after setValidity..
                                            // https://github.com/angular/angular.js/issues/8080
                                            if (ctrl.text.$valid) $scope.text = ctrl.text.$viewValue;
                                        });
                                };
                                $scope.blurred = () => {
                                    ctrl.text.sxBlurred = true;
                                    if ($scope.checkExists) $scope.checkExists();
                                };
                            },
                            templateUrl: this.tplRoot + '/_text-field.html'
                        };
                    }
                ])
                .directive('sxUsernameField', [
                    '$rootScope', ($rootScope: IRootScope) => {
                        return {
                            require: '^form',
                            scope: {
                                userName: '=model',
                                label: '@',
                                placeholder: '@'
                            },
                            restrict: 'E',
                            link: ($scope, $element, $attrs: any, ctrl) => {
                                new FieldBase().link($scope, $element, $attrs, ctrl, 'userName', 'Username');
                                // TODO: OnBlur only!
                                if ($attrs.checkAlreadyExists) {
                                    // TODO: Only if not other validations failed?
                                    // using viewValue as workaround because model not set when already invalid last time
                                    $scope.checkExists = () => $rootScope.request(Dialogs.UsernameExistsQuery, { userName: ctrl.userName.$viewValue })
                                        .then(result => {
                                            ctrl.userName.$setValidity("sxExists", !result.lastResult);
                                            // workaround angular not updating the model after setValidity..
                                            // https://github.com/angular/angular.js/issues/8080
                                            if (ctrl.userName.$valid) $scope.userName = ctrl.userName.$viewValue;
                                        });
                                };
                                $scope.blurred = () => {
                                    ctrl.userName.sxBlurred = true;
                                    if ($scope.checkExists) $scope.checkExists();
                                };

                            },
                            templateUrl: this.tplRoot + '/_username-field.html'
                        };
                    }
                ])
                .directive('sxAcceptedField', () => {
                    return {
                        require: '^form',
                        scope: {
                            accepted: '=model',
                            name: '@name'
                        },
                        transclude: true,
                        restrict: 'E',
                        link: ($scope, $element, $attrs: any, ctrl) => {
                            new FieldBase().link($scope, $element, $attrs, ctrl, 'accepted', null);
                        },
                        templateUrl: this.tplRoot + '/_accepted-field.html'
                    };
                })
                .directive('sxDisplayNameField', () => {
                    return {
                        require: '^form',
                        scope: {
                            displayName: '=model',
                            label: '@',
                            placeholder: '@'
                        },
                        restrict: 'E',
                        link: ($scope, $element, $attrs: any, ctrl) => {
                            new FieldBase().link($scope, $element, $attrs, ctrl, 'displayName', 'Display name');
                        },
                        templateUrl: this.tplRoot + '/_displayName-field.html'
                    };
                })
                .directive('sxPasswordField', () => {
                    return {
                        require: '^form',
                        scope: {
                            password: '=model',
                            confirmPassword: '=?confirmModel',
                            validate: '=?',
                            label: '@',
                            showLabel: '=?',
                            placeholder: '@',
                            notContains: '&?',
                            notEquals: '&?'
                        },
                        restrict: 'E',
                        link: ($scope, $element, $attrs: any, ctrl) => {
                            new FieldBase().link($scope, $element, $attrs, ctrl, 'password', 'Password');
                            if ($attrs.confirmModel) $scope.confirmEnabled = true;
                            if (!$attrs.validate) $scope.validate = true;
                            $scope.blurredConfirm = () => ctrl.passwordConfirmation.sxBlurred = true;
                        },
                        templateUrl: this.tplRoot + '/_password-field.html'
                    };
                })
                .directive('sxValidationMessages', () => {
                    return {
                        require: '^form',
                        scope: {
                            field: '=',
                            label: '='
                        },
                        transclude: true,
                        restrict: 'E',
                        link: ($scope, $element, $attrs: any, ctrl) => {
                            $scope.form = ctrl;
                            $scope.Modernizr = Modernizr;
                            $scope.showGeneralError = (field) => {
                                if (!field.$invalid) return false;
                                if (ctrl.sxValidateOnBlur && field.sxBlurred) {
                                } else if (ctrl.sxValidateOnlyOnSubmit && !ctrl.sxFormSubmitted && field.$pristine) return false;
                                var err = field.$error;
                                return !err.sxExists && !err.minlength && !err.maxlength && !err.passwordVerify;
                            };
                        },
                        templateUrl: this.tplRoot + '/_validation_messages.html'
                    };
                })
                .directive('sxValidateOnSubmit', () => {
                    return {
                        require: 'form',
                        scope: {
                            method: '&sxValidateOnSubmit'
                        },
                        restrict: 'A',
                        link: ($scope: any, $element, $attrs, ctrl) => {
                            //if ($attrs.hideIndicator) ctrl.sxHideIndicator = true;
                            ctrl.sxValidateOnlyOnSubmit = true;
                            if ($attrs.validateOnBlur) ctrl.sxValidateOnBlur = true;
                            $attrs.$set('novalidate', 'novalidate');
                            $element.submit((e) => {
                                var message = $attrs.sxReallyMessage;
                                if (!message || confirm(message)) {
                                    $scope.$apply(() => ctrl.sxFormSubmitted = true);
                                    if (ctrl.$valid) $scope.method();
                                }
                            });
                        }
                    };
                })
                .directive('sxValidateOnBlur', () => {
                    return {
                        require: 'form',
                        restrict: 'A',
                        link: ($scope: any, $element, $attrs, ctrl) => {
                            ctrl.sxValidateOnBlur = true;
                            $attrs.$set('novalidate', 'novalidate');
                        }
                    };
                })
                .directive('sxValidateNotContains', () => {
                    return {
                        require: 'ngModel',
                        restrict: 'A',
                        link: ($scope: any, $element, $attrs, ctrl: ng.INgModelController) => {
                            ctrl.$parsers.unshift(viewValue => {
                                if (!viewValue) return viewValue;
                                var valid = true;
                                var notContains = $scope.notContains ? $scope.notContains() : [];
                                if (!notContains) return viewValue;
                                if (notContains.length == 0) return viewValue;
                                angular.forEach(notContains, v => {
                                    if (!v || !valid) return;
                                    angular.forEach(v.split(/[\s@]+/), v2 => {
                                        if (viewValue.containsIgnoreCase(v2))
                                            valid = false;
                                    });
                                });
                                ctrl.$setValidity('notContains', valid);
                                return viewValue;
                            });
                        }
                    };
                })
                .directive('sxValidateNotEquals', () => {
                    return {
                        require: 'ngModel',
                        restrict: 'A',
                        link: ($scope: any, $element, $attrs, ctrl: ng.INgModelController) => {
                            ctrl.$parsers.unshift(viewValue => {
                                if (!viewValue) return viewValue;
                                var valid = true;
                                var notContains = $scope.notEquals ? $scope.notEquals() : [];
                                if (!notContains) return viewValue;
                                if (notContains.length == 0) return viewValue;
                                angular.forEach(notContains, v => {
                                    if (!v || !valid) return;
                                    angular.forEach(v.split(/[\s@]+/), v2 => {
                                        if (viewValue.equalsIgnoreCase(v2))
                                            valid = false;
                                    });
                                });
                                ctrl.$setValidity('notEquals', valid);
                                return viewValue;
                            });
                        }
                    };
                });
        }

        tplRoot: string;
    }

    class FieldBase {
        public link($scope, $element, $attrs: any, ctrl, defaultFieldName: string, label: string) {
            $scope.model = $scope; // To workaround ng-model input scope issues... // TODO: Remove or what?
            $scope.getFieldName = () => $scope.name || defaultFieldName;
            $scope.getField = () => ctrl[$scope.getFieldName()];
            $scope.form = ctrl;
            $scope.Modernizr = Modernizr;
            $scope.isInvalid = (field?) => {
                if (field == null) field = $scope.getField();
                if (field == null) return false; // the field is not always initialized at the start
                return this.isInvalid(field, ctrl);
            };
            $scope.blurred = () => $scope.getField().sxBlurred = true;
            if (!$attrs.label) $attrs.label = label;
            if ($attrs.showLabel == null) $scope.showLabel = true;

            if (!$scope.showLabel && ($attrs.placeholder == null || $attrs.placeholder == ''))
                $attrs.placeholder = $attrs.label;
        }

        private isInvalid = (field, ctrl) => {
            if (!field.$invalid) return false;
            if (ctrl.sxValidateOnBlur && field.sxBlurred) return true;
            //if (!ctrl.sxHideIndicator && !field.$pristine) return true;
            return ctrl.sxFormSubmitted;
            //return field.$invalid && ((!ctrl.sxHideIndicator && !field.$pristine) || ctrl.sxFormSubmitted)
        };
    }

    var app = new FieldsModule();

}
