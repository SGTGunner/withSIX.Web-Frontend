import {bindable,inject} from 'aurelia-framework';
import './card-view.css!';

export class CardView {
  @bindable cardCls: string = "collection col-sm-6 col-md-4 col-xl-3";
  @bindable viewPath: string;
  @bindable itemType: string;
  @bindable items: any[];

  $parent;

  bind(context){
   this.$parent = context;
  }
}
