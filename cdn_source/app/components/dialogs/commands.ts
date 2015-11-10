module MyApp.Components.Dialogs {
    export class SendReportCommand extends DbCommandBase {
        static $name = 'SendReportCommand';
        public execute = ['data', (data) => this.context.postCustom("report", data, { requestName: 'sendReport' })];
    }

    export class ResendActivationCommand extends DbCommandBase {
        static $name = 'ResendActivation';
        public execute = [
            'data', data => this.context.postCustom("user/resend-activation-code", data, { requestName: 'resendActivation' })
            .then(result => this.respondSuccess("Request sent!"))
            .catch(this.respondError)
        ];
    }

    registerCQ(ResendActivationCommand);

    export class OpenSearchDialogQuery extends DialogQueryBase {
        static $name = 'OpenSearchDialog';
        public execute = () => this.openDialog(SearchDialogController, { windowClass: 'dialogs-withSix search-modal' });
    }

    export class OpenReportDialogQuery extends DialogQueryBase {
        static $name = 'OpenReportDialog';
        public execute = () => this.openDialog(ReportDialogController);
    }

    export class OpenResendActivationDialogQuery extends DialogQueryBase {
        static $name = 'OpenResendActivationDialog';
        public execute = ['email', (email) => this.createDialog(ResendActivationDialogController, { email: email }, { size: "lg" })];
    }

    export class OpenRegisterDialogQuery extends DialogQueryBase {
        static $name = 'OpenRegisterDialog';
        public execute = () => this.openDialog(RegisterDialogController, { size: "lg" });
    }

    export class OpenRegisterDialogWithExistingDataQuery extends DialogQueryBase {
        static $name = 'OpenRegisterDialogWithExistingData';
        public execute = ['model', (model) => this.createDialog(RegisterDialogWithExistingDataController, model, { size: "lg" })];
    }

    export class OpenForgotPasswordDialogQuery extends DialogQueryBase {
        static $name = 'OpenForgotPasswordDialog';
        public execute = ['email', email => this.createDialog(ForgotPasswordDialogController, { email: email })];
    }

    export class OpenTermsDialogQuery extends DialogQueryBase {
        static $name = 'OpenTermsDialog';
        public execute = [
            () => this.openDialog(DefaultDialogWithDataController, {
                templateUrl: '/cdn_source/app/components/dialogs/terms-dialog.html',
                size: 'lg',
                resolve: {
                    data: () => this.context.getMd("global/TermsOfService.md")
                }
            })
        ];
    }

    export class SearchQuery extends DbQueryBase {
        static $name = 'Search';
        public execute = [
            'model', model => this.context.getCustom("search", { params: model, requestName: 'search' })
            .then(result => result.data)
        ];
    }

    export interface ILoginConfig {
        fallbackUrl: string;
        overrideInPage: boolean;
    }

/*
    export class ClearSessionCommand extends DbCommandBase {
        static $inject = ['dbContext', '$q', 'w6'];
        constructor(public context: W6Context, public $q: ng.IQService, private w6: W6) {
            super(context, $q);
        }

        static $name = 'ClearSession'
        public execute = [() => this.context.postCustom(this.w6.url.authSsl + "/api/login/clear", null, { requestName: 'login' })]
    }

    registerCQ(ClearSessionCommand);*/

    export class LoginCommand extends DbCommandBase {
        static $name = 'Login';
        static $inject = ['dbContext', '$location', '$window', '$rootScope', 'w6', '$q'];

        constructor(w6Context: W6Context, private $location: ng.ILocationService, private $window: ng.IWindowService, private $rootScope: IRootScope, private w6: W6, $q: ng.IQService) { super(w6Context); }

        public execute = [
            'data', 'config', (data, config: ILoginConfig) =>
/*                this.context.postCustom(this.w6.url.authSsl + "/api/login/clear", null, { requestName: 'login' })
                    .then(r => */
            this.context.postCustom(this.w6.url.authSsl + "/api/login", data, { requestName: 'login' })
            .then(result => this.processReturn(result, config))
            .catch(this.respondError)
        ];

        private msg = "Sucessfully logged in";

        processReturn = (result, config) => {
            // Or should we get these things from the server, hmm?
            var returnUrl = this.$location.search().ReturnUrl;
            this.w6.updateUserInfo(result.data.account, this.w6.userInfo);

            if (config.overrideInPage) {
                if (config.fallbackUrl) throw new Error("Cannot have both overrideInPage and fallbackUrl specified");
                if (returnUrl) Debug.warn("returnUrl specified while overrideInPage");
                return { success: true, message: this.msg };
            }

            // TODO: Validate ReturnUrl domain..
            var fallbackUrl = returnUrl || config.fallbackUrl;
            if (fallbackUrl && (fallbackUrl.containsIgnoreCase("/login") || fallbackUrl.containsIgnoreCase("/register") || fallbackUrl.containsIgnoreCase("/forgot-password") || fallbackUrl.containsIgnoreCase("/forgot-username")
                || fallbackUrl.containsIgnoreCase("/finalize")))
                fallbackUrl = undefined;
            if (fallbackUrl == "reload")
                this.$window.location.reload(true);
            else
                this.$window.location.href = fallbackUrl || (this.w6.url.connect + "/u/" + this.w6.userInfo.slug);
            return { success: true, message: this.msg };
        };
    }

    export class RegisterCommand extends DbCommandBase {
        static $name = 'Register';
        public execute = [
            'data', (data) => this.context.postCustom("user/register", data, { requestName: 'register' })
            .then(result => this.respondSuccess('Succesfully registered'))
            .catch(this.respondError)
        ];
    }

    export class UsernameExistsQuery extends DbQueryBase {
        static $name = "UsernameExists";
        public execute = [
            'userName', userName => {
                if (!userName || userName.length == 0) return false;
                var cache = this.context.getUsernameExistsCache(userName);
                if (cache === false || cache === true) return cache;

                return <any>this.context.getCustom("accounts/username-exists", { params: { userName: userName } })
                    .then(result => this.context.addUsernameExistsCache(userName, (<any>result.data).result));
            }
        ];
    }

    registerCQ(UsernameExistsQuery);

    export class EmailExistsQuery extends DbQueryBase {
        static $name = "EmailExists";
        public execute = [
            'email', email => {
                if (!email || email.length == 0) return false;
                var cache = this.context.getEmailExistsCache(email);
                if (cache === false || cache === true) return cache;

                return <any>this.context.getCustom("accounts/email-exists", { params: { email: email } })
                    .then(result => this.context.addEmailExistsCache(email, (<any>result.data).result));
            }
        ];
    }

    registerCQ(EmailExistsQuery);

    export class ForgotPasswordCommand extends DbCommandBase {
        static $name = 'ForgotPassword';
        public execute = ['data', (data) => this.context.postCustom("user/forgot-password", data, { requestName: 'forgotPassword' })];
    }

    export class ForgotUsernameCommand extends DbCommandBase {
        static $name = 'ForgotUsername';
        public execute = ['data', (data) => this.context.postCustom("user/forgot-username", data, { requestName: 'forgotUsername' })];
    }

    registerCQ(OpenSearchDialogQuery);
    registerCQ(OpenReportDialogQuery);
    registerCQ(OpenForgotPasswordDialogQuery);
    registerCQ(OpenResendActivationDialogQuery);
    registerCQ(OpenRegisterDialogQuery);
    registerCQ(OpenRegisterDialogWithExistingDataQuery);
    registerCQ(SendReportCommand);
    registerCQ(SearchQuery);
    registerCQ(OpenTermsDialogQuery);
    registerCQ(ForgotPasswordCommand);
    registerCQ(ForgotUsernameCommand);

    registerCQ(LoginCommand);
    registerCQ(RegisterCommand);
}
