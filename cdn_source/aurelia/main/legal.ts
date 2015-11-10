import {inject} from 'aurelia-framework';
import {Mediator,Query,IRequest,DbQuery,handlerFor} from '../framework';
import {MainBase} from './index';

@inject(Mediator, W6)
export class Legal extends MainBase {
  constructor(private mediator: Mediator, public w6: W6) { super(w6);}

  legalText: string;
  activate(params, routeConfig) {
    return new GetLegal().handle(this.mediator)
            .then(x => this.legalText = x);
  }
}

class GetLegal extends Query<string> {}

@handlerFor(GetLegal)
class GetLegalHandler extends DbQuery<GetLegal, string> {
    public handle(request: GetLegal): Promise<string> {
      return this.context.getMd("global/TermsOfService.md")
    }
}
