import {bindable,inject} from 'aurelia-framework';
export class ListView {
  @bindable viewPath: string;
  @bindable itemType: string;
  @bindable items: any[];
}
