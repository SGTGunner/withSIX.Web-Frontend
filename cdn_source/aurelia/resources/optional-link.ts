import {bindable} from 'aurelia-framework';
export class OptionalLink {
  @bindable link: string;
  $parent;

  bind(context) {
    this.$parent = context;
  }
}
