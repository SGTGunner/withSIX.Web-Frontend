import {inject,autoinject,customAttribute,bindingEngine} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Subscriptions} from '../services/lib';

// TODO: Custom CommandButton element that includes spinner etc..
/*
  <commandbutton command.bind="something">content</commandbutton>

  template:
  <button command.bind="something">${content} <span class="icon ..spinner"></span></button>
*/
@inject(Element)
export class CommandCustomAttribute {
  value;
  subscriptions = new Subscriptions();
  constructor(private el: Element) {}
  valueChanged(value: {canExecute: boolean,isExecuting: boolean}) {
    this.value = value;
    this.subscriptions.dispose();
    if (!value) return;
    var f = () => {
      if (value.canExecute) this.value(); // TODO: test for disabled? needed??
    };
    this.subscriptions.subd(d => {
      this.el.addEventListener('click', f);
      d(() => this.el.removeEventListener('click', f));
      d(bindingEngine.propertyObserver(value, 'canExecute').subscribe(v => this.handleCanExecuteChange(v)));
      d(bindingEngine.propertyObserver(value, 'isExecuting').subscribe(v => this.handleIsExecutingChange(v)));
    });
    this.handleCanExecuteChange(value.canExecute);
    this.handleIsExecutingChange(value.isExecuting);
  }
  shouldntHandleDisabled() { return this.el.hasAttribute("disabled.bind") || this.el.getAttribute("disabled"); }
  handleCanExecuteChange(v) {
    if (!this.shouldntHandleDisabled()) v ? this.el.removeAttribute("disabled") : this.el.setAttribute("disabled", "");
  }
  // TODO: Only add this when the action takes longer than X amount of time?
  handleIsExecutingChange(v) {
    if (v) {
      this.el.classList.add("active");
    } else {
      this.el.classList.remove("active");
    }
  }
  detached() { this.subscriptions.dispose(); }
}
