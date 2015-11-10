module MyApp.Main.Premium {
    import Moment = moment.Moment;

    export interface IPremiumScope extends IBaseScope {
        completeOrder: () => void;
        getRenewal: () => Moment;
        location;
        openTermsDialog: () => any;
        openPremiumTermsDialog: () => any;
        model: { products; selectedProduct: { name: string; unitAmount: number; unit; articleId; total }; autoRenew: boolean; termsAccepted: boolean; processing: boolean; fee: number; total; email: string; ref: string; overwrite: boolean };
        getPerMonth: (product) => number;
        register: () => any;
        payMethod: PayMethod;
        setPaymethod: (method) => void;
        getBilled: (product) => string;
        switchOverwrite: () => boolean;
        overwrite: boolean;
        userLocation;
        logout: () => any;
    }

    enum Unit {
        Day,
        Week,
        Month,
        Year
    }


    export class PremiumController extends BaseController {
        static $name = 'PremiumController';
        static $inject = ['$scope', 'logger', '$location', '$window', '$q', 'ForwardService', 'model'];

        constructor(public $scope: IPremiumScope, public logger, $location: ng.ILocationService, private $window: ng.IWindowService, $q, private forwardService: Components.ForwardService, model) {
            super($scope, logger, $q);

            if (!debug && $scope.w6.userInfo.isPremium) {
                forwardService.forwardNaked($scope.url.connectSsl + "/me/settings/premium");
                return;
            }

            model.selectedProduct = model.products[0];
            model.autoRenew = model.countryCode !== 'DE';
            model.termsAccepted = false;
            model.processing = false;

            model.ref = $location.search().ref;
            $scope.model = model;

            $scope.payMethod = PayMethod.Paypal;
            $scope.getPerMonth = product => product.pricing.total / (product.unitAmount * (product.unit == 'Year' ? 12 : 1));
            $scope.getBilled = product => {
                if (!model.autoRenew)
                    return "total";
                if (!product.unitAmount)
                    return "once";
                if (product.unitAmount == 1) {
                    switch (product.unit) {
                    case Unit[Unit.Day]:
                        return "daily";
                    case Unit[Unit.Week]:
                        return "weekly";
                    case Unit[Unit.Month]:
                        return "monthly";
                    case Unit[Unit.Year]:
                        return "annually";
                    default:
                        throw new Error("Unsupported product unit");
                    }
                } else if (product.unit == Unit[Unit.Month] && product.unitAmount == 3) {
                    return "quarterly";
                } else {
                    return "each " + product.unitAmount + " " + product.unit.toLowerCaseFirst() + "s";
                }

            };
            $scope.location = $location;
            $scope.openPremiumTermsDialog = () => $scope.request(OpenPremiumTermsDialogQuery);
            $scope.openTermsDialog = () => $scope.request(Components.Dialogs.OpenTermsDialogQuery);
            $scope.getRenewal = () => { return moment().add($scope.model.selectedProduct.unitAmount, $scope.model.selectedProduct.unit.toLowerCase() + 's'); };
            $scope.completeOrder = this.completeOrder;
            $scope.register = () => $scope.request(Components.Dialogs.OpenRegisterDialogWithExistingDataQuery, { model: { email: $scope.model.email } });
            $scope.setPaymethod = this.setPaymethod;
            $scope.switchOverwrite = () => $scope.model.overwrite = true;

            this.setPaymethod(PayMethod.Paypal);
            $scope.$watch("model.selectedProduct", (newVal, oldVal) => this.updateFee(newVal));
        }

        private setPaymethod = (method: PayMethod) => {
            switch (method) {
            case PayMethod.Paypal:
            {
                this.payMethod = new PayPalPayMethod();
                break;
            }
            default:
            {
                throw new Error("Unsupported pay method");
            }
            }
            this.updateFee(this.$scope.model.selectedProduct);
        };
        private completeOrder = () => {
            if (!this.$scope.model.termsAccepted) {
                this.logger.error("Terms are not agreed");
                return;
            }
            var selectedProduct = this.$scope.model.selectedProduct;
            var recurring = this.$scope.model.autoRenew && selectedProduct.unitAmount != null;
            this.$scope.request(CreatePremiumOrderCommand, { data: { articleId: selectedProduct.articleId, isRecurring: recurring, termsAccepted: this.$scope.model.termsAccepted, ref: this.$scope.model.ref, overwrite: this.$scope.model.overwrite } })
                .then((result) => {
                    this.forwardService.forward(this.$scope.url.main + "/orders/" + result.lastResult.data + "/checkout");
                }).catch(reason => {
                    this.httpFailed(reason);
                });
        };
        payMethod: PayMethodT;

        updateFee(product) {
            this.$scope.model.fee = this.payMethod.calculateFee(product.pricing.price);
            this.$scope.model.total = product.pricing.total + this.$scope.model.fee;
        }
    }

    registerController(PremiumController);

    export enum PayMethod {
        Paypal
    }

    export interface ICalcFee {
        calculateFee(amount: number)
    }

    class NullFeeCalculator implements ICalcFee {
        public calculateFee(amount: number) {
            return 0.0;
        }
    }

    class PayPaylFeeCalculator implements ICalcFee {
        static multiplier = 0.05;

        public calculateFee(amount: number) {
            return amount * PayPaylFeeCalculator.multiplier;
        }
    }

    export class PayMethodT {
        constructor(public feeCalculator: ICalcFee) {}

        public calculateFee(amount: number) {
            return this.feeCalculator.calculateFee(amount);
        }
    }

    export class PayPalPayMethod extends PayMethodT {
        constructor() {
            //super(new PayPaylFeeCalculator());
            super(new NullFeeCalculator()); // No fees currently..
        }
    }
}
