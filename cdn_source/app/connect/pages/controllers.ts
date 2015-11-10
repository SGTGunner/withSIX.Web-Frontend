declare var Fingerprint;

module MyApp.Connect.Pages {
    class LoginController extends BaseController {
        static $inject = ['$scope', 'logger', '$q', '$routeParams', '$location', '$window', 'w6'];
        static $name = "LoginController";

        constructor(public $scope, public logger, $q, $routeParams, $location: ng.ILocationService, $window: ng.IWindowService, w6: W6) {
            super($scope, logger, $q);
            $scope.model = { fingerPrint: new Fingerprint().get(), rememberMe: true };
            $scope.req = $routeParams.req;
            $scope.login = () => this.requestAndProcessResponse(Components.Dialogs.LoginCommand, {
                data: $scope.model,
                config: {
                    fallbackUrl: w6.isClient ? $scope.url.connectSsl + '/me' : undefined
                }
            }).catch(r => {
                if ($scope.response.errors && $scope.response.errors['fingerPrint'])
                    $scope.twoFactorRequired = true;
            });
            $scope.openRegisterDialog = () => $scope.request(Components.Dialogs.OpenRegisterDialogWithExistingDataQuery, { model: { email: $scope.model.email } });
            $scope.openResendActivationDialog = () => $scope.request(Components.Dialogs.OpenResendActivationDialogQuery, { email: $scope.model.email });
            $scope.openForgotPasswordDialog = () => $scope.request(Components.Dialogs.OpenForgotPasswordDialogQuery, { email: $scope.model.email });

            // TODO
            //$scope.request(LoginSpaCommand);
        }
    }

    registerController(LoginController);

    class ResendActivationController extends BaseController {
        static $name = "ResendActivationController";
        static $inject = ['$scope', 'logger', '$q', '$routeParams'];

        constructor(public $scope, public logger, $q, $routeParams) {
            super($scope, logger, $q);

            $scope.model = {
                email: $routeParams.email,
                fingerPrint: new Fingerprint().get()
            };
            $scope.submit = () => this.requestAndProcessResponse(Components.Dialogs.ResendActivationCommand, { data: $scope.model });
        }
    }

    registerController(ResendActivationController);

    class ForgotPasswordController extends BaseController {
        static $name = "ForgotPasswordController";
        static $inject = ['$scope', 'logger', '$q', '$routeParams'];

        constructor(public $scope, public logger, $q, $routeParams) {
            super($scope, logger, $q);

            $scope.model = {};
            $scope.submit = () => this.processCommand($scope.request(Components.Dialogs.ForgotPasswordCommand, { data: $scope.model }).then(result => $scope.success = true), "Request sent!");
        }
    }

    registerController(ForgotPasswordController);

    class ForgotUsernameController extends BaseController {
        static $name = "ForgotUsernameController";
        static $inject = ['$scope', 'logger', '$q', '$routeParams'];

        constructor(public $scope, public logger, $q, $routeParams) {
            super($scope, logger, $q);

            $scope.model = {};
            $scope.submit = () => this.processCommand($scope.request(Components.Dialogs.ForgotUsernameCommand, { data: $scope.model }).then(result => $scope.success = true), "Request sent!");
        }
    }

    registerController(ForgotUsernameController);

    class ResetPasswordController extends BaseController {
        static $name = "ResetPasswordController";
        static $inject = ['$scope', 'logger', '$q', '$routeParams'];

        constructor(public $scope, public logger, $q, $routeParams) {
            super($scope, logger, $q);

            $scope.model = {
                password: "",
                confirmPassword: "",
                passwordResetCode: $routeParams.resetCode
            };
            // TODO
            $scope.tokenKnown = true;

            $scope.submit = () => this.processCommand($scope.request(ResetPasswordCommand, { data: $scope.model })
                .then(result => $scope.success = true));
        }
    }

    registerController(ResetPasswordController);

/*    class FinalizeController extends BaseController {
        static $name = 'FinalizeController'

        constructor(public $scope, public logger, $q) {
            super($scope, logger, $q);

            $scope.model = { fingerPrint: new Fingerprint().get() };
            $scope.finalize = () => this.requestAndProcessResponse(FinalizeCommand, { data: $scope.model });
            $scope.openForgotPasswordDialog = () => $scope.request(Components.Dialogs.OpenForgotPasswordDialogQuery, { email: $scope.model.email });
        }
    }

    registerController(FinalizeController);*/


    class RegisterController extends BaseController {
        static $name = "RegisterController";

        constructor(public $scope, public logger, $q) {
            super($scope, logger, $q);

            $scope.model = { fingerPrint: new Fingerprint().get() };
            $scope.register = () => this.requestAndProcessResponse(Components.Dialogs.RegisterCommand, { data: $scope.model });
            $scope.openForgotPasswordDialog = () => $scope.request(Components.Dialogs.OpenForgotPasswordDialogQuery, { email: $scope.model.email });
            //$scope.openLoginDialog = () => $scope.request(Components.Dialogs.OpenLoginDialogQuery);
        }
    }

    registerController(RegisterController);


    // SPA OAuth Login
    // Currently not used because of cross-domain issues:
    // 1. We want to store the .. one sec
    class LoggedInController extends BaseController {
        static $inject = ['$scope', 'logger', '$q', '$location'];
        static $name = 'LoggedInController';

        constructor($scope, logger, $q, $location) {
            super($scope, logger, $q);

            var pairs = location.hash.slice(1).split('&');

            var result = {};
            pairs.forEach(pair => {
                var entries = pair.split('=');
                result[entries[0]] = decodeURIComponent(entries[1] || '');
            });

            $scope.request(ProcessLoginSpaCommand, { qs: result });
        }
    }

    registerController(LoggedInController);

    class ProcessLoginSpaCommand extends DbCommandBase {
        static $inject = ['dbContext', '$q', 'w6', '$http', '$window', 'localStorageService', 'ForwardService'];
        static $name = 'ProcessLoginSpa';

        constructor(public context: W6Context, public $q: ng.IQService, private w6: W6, private $http, private $window, private localStorageService, private forwardService: Components.ForwardService) {
            super(context);
        }

        public execute = [
            'qs', qs => {
/*
                        var data = {
                            response_type: 'code id_token token',
                            client_id: 'withsix-spa',
                            scope: 'openid profile roles api offline_access',
                            redirect_uri: this.w6.url.connectSsl + '/loggedin',
                            nonce: Math.floor(Math.random() * 99999)
                        }
            */

                // TODO: Deal with major flaw: LocalStorage inaccessible from subdomains.
                // Probably: Callback to the original link while passing in the information in hashtag, capturing the info and then removing it from the hashtag :S
                // Hey how about we just do callbacks to the actual domains (connect, play, main etc). And perhaps an empty cookie for .withsix.com etc "LOGGED_IN" or so?
                //return MyApp.getAccessToken(qs['code'], this.$http, this.w6.url)
                  //  .then(r => this.forwardService.forwardNaked(qs['state'] || window.location.protocol + this.w6.url.play));

                /*
            var authorizationResponse =
                await
                    _connect.GetAuthorization(CommonUrls.AuthorizationEndpoints.TokenEndpoint, request.Code)
                        .ConfigureAwait(false);

            //var refreshedResponse = await _connect.RefreshToken(CommonUrls.AuthorizationEndpoints.TokenEndpoint, authorizationResponse.RefreshToken).ConfigureAwait(false);

            var userInfo = await _connect.GetUserInfo(CommonUrls.AuthorizationEndpoints.UserInfoEndpoint, authorizationResponse.AccessToken).ConfigureAwait(false);

            // TODO: Every 20minutes try to refresh the token or rather just at the time we try to access a resource and we get 401 etc?
            // TODO: Refresh RefreshToken every day once?
            DomainEvilGlobal.SecretData.UserInfo.Id = Guid.Parse(userInfo.Claims.First(x => x.Item1 == "sub").Item2);
            DomainEvilGlobal.SecretData.UserInfo.RefreshToken = authorizationResponse.RefreshToken;
            DomainEvilGlobal.Settings.AccountOptions.ApiKey = authorizationResponse.TokenType +
                                                              " " +
                                                              authorizationResponse.AccessToken;
            */
            }
        ];
    }

    registerCQ(ProcessLoginSpaCommand);
}
