import {bindable} from 'aurelia-framework';
import {Base, IDisposable} from '../services/base';
import './finder.css!';

export class Finder {
  @bindable showTotalResults = false;
  @bindable showButton = false;
  @bindable model: IFindModel<any>;
  @bindable icon: string;
  @bindable text = "select";
  @bindable placeholder = "";

  get shouldShowButton() { return this.showButton && this.model.showButton; }
}
export interface IFindModel<T> {
  display: (item: T) => string;
  finder: (searchItem: string) => Promise<T[]>;
  execute: (item: T) => Promise<any> | void;
  showButton: boolean;
  results: T[];
  searchItem?: string;
  selectedItem?: T;
}

export class FindModel<T> extends Base implements IFindModel<T> {
  results: T[] = [];
  searchItem = "";
  selectedItem: T = null;
  showButton = true;
  //display = (item: T) => item.toString();
  constructor(public finder: (searchItem: string) => Promise<T[]>, public execute: (item: T) => Promise<any> | void, public display = (item: T) => item.toString()) {
    super();
    this.subscriptions.subd(d => {
      // TODO: debounce and make sure old results dont overwrite new results
      d(this.observe("searchItem").subscribe(async (x) => this.results = this.searchItem == null ? [] : await this.finder(this.searchItem)))
    })
  }
}
