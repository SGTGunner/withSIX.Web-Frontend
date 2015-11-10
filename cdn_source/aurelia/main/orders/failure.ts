export class Failure {
  orderId: string;
  activate(params, routeConfig) {
    this.orderId = params.orderId;
  }
}
