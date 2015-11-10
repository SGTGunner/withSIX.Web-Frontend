import {Show} from '../../connect/profile/library/collections/show';
import './collections.css!';

export class EditContent extends Show {
  timeout;
  async activate(params, routeConfig) {
    await super.activate(params, routeConfig);

    // This works around the issue of routing for Angular while Aurelia is involved..angular
    // TODO: Better workaround than the rootscope apply?
    Tk.Debug.log("AURELIA: angular vm loaded");
    angular.element(document).scope().$apply();
    $("#root-content-row").prepend($("#content"));

    // pff
    this.timeout = setInterval(() => {
      if (window.w6Cheat.collection) {
        this.enableEditMode();
        clearInterval(this.timeout);
        this.timeout = null;
      }
    }, 500);
  }

  deactivate() {
    super.deactivate();
    $("#root-content-row").append($("#content"));
    if (this.timeout) { clearInterval(this.timeout); this.timeout = null; }
  }
}
