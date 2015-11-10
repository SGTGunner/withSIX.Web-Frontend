import {UiContext,Mediator,ViewModel,Query, DbQuery, VoidCommand, handlerFor} from '../framework'
import {inject} from 'aurelia-framework';
import {Router, RouterConfiguration, RouteConfig} from 'aurelia-router';

@inject(UiContext)
export class VerifyCode extends ViewModel {
  constructor(ui: UiContext) { super(ui); }

  async activate(params, routeConfig) {
    await new VerifyCodeCommand(params.activationCode).handle(this.mediator);
    this.router.navigate("/");
    this.w6.openLoginDialog(null);
  }
}

class VerifyCodeCommand extends VoidCommand {
  constructor(public activationCode: string) { super(); }
}

@handlerFor(VerifyCodeCommand)
class VerifyCodeHandler extends DbQuery<VerifyCodeCommand, void> {
	public async handle(request: VerifyCodeCommand): Promise<void> {
    await this.context.postCustom("login/verify/" + request.activationCode);
  }
}
