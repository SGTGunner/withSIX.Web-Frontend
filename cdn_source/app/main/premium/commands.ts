module MyApp.Main.Premium {
    export class OpenPremiumTermsDialogQuery extends DialogQueryBase {
        static $inject = ['$modal', 'dialogs', 'dbContext', 'w6'];

        constructor($modal, public dialogs, context: W6Context, private w6: W6) { super($modal, dialogs, context); }

        static $name = 'OpenPremiumTermsDialog';
        public execute = [
            () => this.openDialog(Components.Dialogs.DefaultDialogWithDataController, {
                templateUrl: '/cdn_source/app/main/premium/premium-terms-dialog.html',
                size: 'lg',
                resolve: {
                    data: () => this.context.getCustom(this.w6.url.cdn + "/docs/global/TermsOfServicesPremium.md").then(result => result.data)
                }
            })
        ];
    }

    export class GetPremiumLegalQuery extends DbQueryBase {
        static $name = 'GetPremumLegal';
        static $inject = ['dbContext', 'w6'];
        constructor(dbContext: W6Context, private w6: W6) {
            super(dbContext);
        }
        public execute = [() => this.context.getCustom(this.w6.url.cdn + "/docs/global/TermsOfServicesPremium.md").then(result => result.data)];
    }

    export class GetPremiumQuery extends DbQueryBase {
        static $name = 'GetPremium';
        public execute = [() => this.context.getCustom("premium").then(result => result.data)];
    }

    export class CreatePremiumOrderCommand extends DbCommandBase {
        static $name = "CreatePremiumOrder";

        public execute = [
            'data', (data) => {
                return this.context.postCustom('premium', data, { requestName: 'createPremiumOrder' });
            }
        ];
    }

    registerCQ(GetPremiumQuery);
    registerCQ(CreatePremiumOrderCommand);
    registerCQ(OpenPremiumTermsDialogQuery);
}