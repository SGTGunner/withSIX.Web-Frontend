import {inject} from 'aurelia-framework';
import {Mediator, VoidCommand, DbQuery,handlerFor} from '../../framework';

@inject(Mediator)
export class ConfirmPayment {
  payerId: string
  orderId: string;
  paymentId: string;
  constructor(private mediator: Mediator) {}
  activate(params, routeConfig) {
    this.orderId = params.orderId;
    this.payerId = params.PayerID;
    this.paymentId = params.paymentId;
    new ConfirmPaymentCommand(this.orderId, this.payerId).handle(this.mediator)
      .then(x => window.location.href = `/orders/${this.orderId}/success`);
  }
}

class ConfirmPaymentCommand extends VoidCommand {
  constructor(public orderId: string, public payerId: string) { super(); }
}

@handlerFor(ConfirmPaymentCommand)
class ConfirmPaymentCommandHandler extends DbQuery<ConfirmPaymentCommand, void> {
    async handle(request: ConfirmPaymentCommand) {
      await this.context.postCustom("orders/" + request.orderId + "/confirmpayment?payerId=" + request.payerId).then(result => result.data);
    }
}
