import {customAttribute, bindable,inject} from 'aurelia-framework';
import {Base,ReactiveList,ListFactory} from '../services/lib';
import {IMenuItem} from './dropdown-menu';

@inject(ListFactory)
export class ActionBar extends Base {
  @bindable items: IMenuItem[];
  @bindable hideWhenEmpty = true;
  isVisible: boolean;
  reactive: ReactiveList<IMenuItem>;

  constructor(private listFactory: ListFactory) {super();}

  bind() {
    if (!this.items) throw new Error("Items not bound!");
    this.subscriptions.subd(d => {
      d(this.reactive = this.listFactory.getList(this.items, ["isVisible"]));
      d(this.reactive.modified.subscribe(x => this.updateIsVisible()))
    });
    this.updateIsVisible();
  }
  unbind() { this.subscriptions.dispose(); }
  updateIsVisible() { this.isVisible = this.items.asEnumerable().any(x => x.isVisible); }
}
