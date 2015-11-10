import {customAttribute, bindable,inject} from 'aurelia-framework';
import {Base,ReactiveList,ListFactory,uiCommand} from '../services/lib';
import 'contextMenu';
import 'contextMenu/contextMenu.css!';
import './dropdown-menu.css!';

// requires  adjustment to contextMenu.js for child element activation..
// https://github.com/sickboy/contextMenu.js/commit/2bc5482ad0825097041b06da8e8d54ba50e2f26f
@inject(ListFactory, Element)
export class DropdownMenu extends Base {
  reactive: ReactiveList<IMenuItem>;
  @bindable items: IMenuItem[];
  @bindable header: string;
  @bindable icon: string;
  @bindable textCls: string;
  @bindable direction: string = "down";
  @bindable hideWhenEmpty = true;
  isVisible: boolean;
  menu: Element;
  menuButton: Element;

  constructor(private listFactory: ListFactory, private element: Element) {super(); }

  bind() {
    if (!this.items) throw new Error("Items not bound!");
    this.subscriptions.subd(d => {
      d(this.reactive = this.listFactory.getList(this.items, ["isVisible"]));
      d(this.reactive.modified.subscribe(x => this.updateIsVisible()))
    });
    this.updateIsVisible();
  }

  attached() {
    let menuTrgr = <any>$(this.menuButton);
    var menu = $(this.menu);
    //Tk.Debug.log("$$$", menuTrgr, menu);
    menuTrgr.contextMenu('popup', menu, { // 'menu' (is more menu styled)
      displayAround:'trigger',
      // On open, let's rid ourselves from any parent styling/behavior, and restore once we close
      onOpen: () => menu.appendTo('body'),
      onClose: () => menu.appendTo(this.element)
      //horAdjust:-menuTrgr.width()
    });
  }
  unbind() { this.subscriptions.dispose(); }
  updateIsVisible() { this.isVisible = this.items.asEnumerable().any(x => x.isVisible); }
}

export interface IMenuItem {
  name: string;
  icon?: string;
  cls?: string;
  textCls?: string;
  action;
  isVisible: boolean;
}

export interface IMenuItemOptions {
  name?: string;
  textCls?: string;
  icon?: string;
  cls?: string;
  tooltip?: string;
}

export class MenuItem<T> implements IMenuItem {
  _name: string;
  _icon: string;
  _textCls: string;
  _tooltip: string;

  // Here so that we can monitor it with our proprety observers ;-)
  get isVisible() { return this.action.isVisible; }
  set name(value)  { this._name = value; }
  get name() { return this._name == null ? this.action.name : this._name; }

  set icon(value)  { this._icon = value; }
  get icon() { return this._icon == null ? this.action.icon : this._icon; }

  set textCls(value)  { this._textCls = value; }
  get textCls() { return this._textCls == null ? this.action.textCls : this._textCls; }

  set tooltip(value) { this._tooltip = value; }
  get tooltip() {
    var tt = this._tooltip == null ? this.action.tooltip : this._tooltip;
    if (tt == null && this._name == "") return this.action.name;
    return tt;
  }

  constructor(action: () => Promise<T>, options?: IMenuItemOptions) {
    if (action.hasOwnProperty("canExecute")) {
      //Tk.Debug.log("Found UiCommand for", name);
      this.action = action;
    } else {
      //Tk.Debug.log("Creating UiCommand for", name);
      this.action = uiCommand<T>(action);
    }
    if (options) {
      this.name = options.name;
			this.textCls = options.textCls;
			this.icon = options.icon;
			this.cls = options.cls;
      this.tooltip = options.tooltip;
		}
  }
  action;
  cls: string;
}
