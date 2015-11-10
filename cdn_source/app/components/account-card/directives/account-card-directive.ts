module MyApp.Components.AccountCard {

    class AccountCardDirectiveController {
        static $inject = ['$scope', '$element', '$attrs', '$transclude', '$rootScope'];
        static viewBase = '/cdn_source/app/components/account-card';

        constructor($scope, $element, $attrs, $transclude, $rootScope) {
        }
    }

    class AccountCardDirective extends Tk.Directive {
        static $name = 'sxAccountCard';
        static $inject = [];
        static factory = getFactory(AccountCardDirective.$inject, () => new AccountCardDirective());

        controller = AccountCardDirectiveController;
        templateUrl = AccountCardDirectiveController.viewBase + '/index.html';
        transclude = true;
        restrict = 'E';
        scope = {
            account: '=',
        };
    }

    angular.module('Components.AccountCard')
        .directive(AccountCardDirective.$name, AccountCardDirective.factory);
}