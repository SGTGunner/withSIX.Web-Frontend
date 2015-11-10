import {inject} from 'aurelia-framework';
import {Mediator,VoidCommand,DbQuery,handlerFor} from '../../framework';

@inject(Mediator)
export class ConfirmRecurring {
  orderId: string;
  payerId: string;
  constructor(private mediator: Mediator) {}
  activate(params, routeConfig) {
    this.orderId = params.orderId;
    this.payerId = params.payerId;
    new ConfirmRecurringCommand(this.orderId, this.payerId).handle(this.mediator)
      .then(x => window.location.href = `/orders/${this.orderId}/success`);
  }
}

class ConfirmRecurringCommand extends VoidCommand {
  constructor(public orderId: string, public payerId: string) { super(); }
}

@handlerFor(ConfirmRecurringCommand)
class ConfirmRecurringCommandHandler extends DbQuery<ConfirmRecurringCommand, void> {
    async handle(request: ConfirmRecurringCommand) {
      await this.context.postCustom("orders/" + request.orderId + "/confirmrecurring?payerId=" + request.payerId).then(result => result.data);
    }
}
