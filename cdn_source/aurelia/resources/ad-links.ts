import {customAttribute, bindable} from 'aurelia-framework';
import {inject,autoinject} from 'aurelia-framework';

@inject(W6)
export class AdLinks {
  @bindable height: string;
  @bindable width: string;
  @bindable slot: string;
  @bindable adsenseId: string;
  @bindable orientation: string;

  constructor(w6: W6) {
    this.adsenseId = w6.ads.adsenseId;
    this.orientation = "hz";
  }
}
