module MyApp.Connect.Pages {
    export class VerifyCommand extends DbCommandBase {
        static $name = 'Verify';
        public execute = ['code', code => this.context.postCustom("user/activate/" + code, {}, { requestName: 'activate' })];
    }

    export class ResetPasswordCommand extends DbCommandBase {
        static $name = 'ResetPassword';
        public execute = ['data', data => this.context.postCustom("user/reset-password", data, { requestName: 'resetPassword' })];
    }

/*    export class FinalizeCommand extends DbCommandBase {
        static $inject = ['dbContext', '$q', 'w6'];
        constructor(public context: W6Context, public $q: ng.IQService, private w6: W6) {
            super(context, $q);
        }

        static $name = 'Finalize';
        public execute = [
            'data', (data) => this.context.postCustom(this.w6.url.authSsl + "/api/register/finalize", data, { requestName: 'finalize' })
            .then(result => this.respondSuccess('Succesfully registered'))
            .catch(this.respondError)
        ];
    }*/

    registerCQ(ResetPasswordCommand);
    registerCQ(VerifyCommand);
    //registerCQ(FinalizeCommand);
}