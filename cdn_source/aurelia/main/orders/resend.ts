import {inject} from 'aurelia-framework';
import {Mediator,VoidCommand,DbQuery,handlerFor} from '../../framework';

@inject(Mediator)
export class Resend {
  orderId: string;
  constructor(private mediator: Mediator) {}
  activate(params, routeConfig) {
    this.orderId = params.orderId;
    return new ResendOrderConfirmationCommand(this.orderId).handle(this.mediator);
  }
}

class ResendOrderConfirmationCommand extends VoidCommand {
  constructor(public orderId: string) { super(); }
}

@handlerFor(ResendOrderConfirmationCommand)
class ResendOrderConfirmationCommandHandler extends DbQuery<ResendOrderConfirmationCommand, void> {
    async handle(request: ResendOrderConfirmationCommand) {
      await this.context.postCustom("orders/" + request.orderId + "/resend").then(result => result.data);
    }
}
