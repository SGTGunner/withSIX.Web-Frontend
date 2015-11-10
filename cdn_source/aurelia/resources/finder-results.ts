import {bindable} from 'aurelia-framework';
import {IFindModel} from './finder';
import './finder.css!';

export class FinderResults {
  @bindable showTotalResults = true;
  @bindable model: IFindModel<any>;
  @bindable icon;
  @bindable text = "select";

  close() { this.model.searchItem = null; }
  select(item) { this.model.selectedItem = item; this.model.searchItem = this.model.display(item); }
  execute(item) { this.model.selectedItem = item; this.model.execute(item); }
}
