import {bindable} from 'aurelia-framework';

export class CommandButtonCustomElement {
  @bindable model = <any>{};
  @bindable noProcessing;

  get name() { return this.model.name; }
  get command() { return this.model; }
  get cls() { return this.model.cls; }
  get textCls() { return this.model.textCls; }
  get icon() { return this.model.icon; }
  get isVisible() { return this.model.isVisible; }
  get tooltip() { return this.model.tooltip; }
}
