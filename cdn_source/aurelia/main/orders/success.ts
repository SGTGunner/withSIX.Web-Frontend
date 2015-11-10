import {inject} from 'aurelia-framework';

@inject(W6)
export class Success {
  orderId: string;
  constructor(public w6: W6) {}
  activate(params, routeConfig) {
    this.orderId = params.orderId;
  }
}
