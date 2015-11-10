import {activationStrategy} from 'aurelia-router';

export class Angular {
  activate() {
    Tk.Debug.log("AURELIA: angular vm loaded");
    // This works around the issue of routing for Angular while Aurelia is involved..angular
    // TODO: Better workaround than the rootscope apply?
    angular.element(document).scope().$apply();
  }

  determineActivationStrategy(){
    return activationStrategy.replace;
  }
}
