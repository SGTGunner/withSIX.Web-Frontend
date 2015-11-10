import {Base,Subscriptions,IDisposable, ISubscription, ISubscriptionWithInitial, IPromiseFunction} from './base';
import {LegacyMediator, Mediator} from './mediator';
import {Toastr} from './toastr';
import * as Rx from 'rx';
import {Container, inject, ArrayObserveObserver, PropertyObserver} from 'aurelia-framework';
import {bindingEngine as be} from 'aurelia-framework'
import {EventAggregator} from 'aurelia-event-aggregator';
import {Validation,ValidationResult} from 'aurelia-validation';

interface IBindingEngine {
  propertyObserver: (obj, propertyName) => { subscribe: (callback) => IDisposable}
  collectionObserver: (collection) => { subscribe: (callback) => IDisposable}
}

export var bindingEngine: IBindingEngine = be;

export interface IPropertyChange<T> {
  item: T;
  propertyName: string;
  change?: T;
}

export class ListFactory {
  getList<T>(existingList: T[], properties?: string[]) {
    var list = new ReactiveList<T>();
    list.prepare(existingList, properties);
    return list;
  }

  getObserveAll<T>(properties?: string[]) {
    return new ObserveAll<T>(properties);
  }
}

export class Multi<T> implements ISubscriptionWithInitial<T> {
  values: T[] = [];
  subscribers = [];
  subscriptions = new Subscriptions();
  initial: T;
  constructor(private subscribables: ISubscriptionWithInitial<T>[], private selector: (...args: T[]) => T, private autoDispose = true) {
    this.subscriptions.subd(d => {
    subscribables.forEach((x, i) => {
      this.values.push(x.initial);
      d(x.subscribe(v => {this.values[i] = v; this.update();}));
    });
    this.initial = this.computeValue();
  });
  }

  computeValue() { return this.selector.apply(this.selector, this.values); }

  update() {
    var value = this.computeValue();
    this.subscribers.forEach(x => x(value));
  }

  subscribe(callback: (v: T) => void) {
    this.subscribers.push(callback);
    return {dispose: () => this.removeSubscriber(callback)};
  }

  removeSubscriber(callback) {
    Tools.removeEl(this.subscribers, callback);
    if (this.autoDispose && this.subscribers.length == 0) this.dispose(); // nasty workaround, must make better (e.g when adding subscriber, then attach to source, and when removing last,
      // then remove from source again, but this also means the initial value is no longer updated, and also needs to refresh (and subscribers must take into account to first subscribe, and then request initial...))
  }

  dispose() {
    this.subscribers = [];
    this.subscriptions.dispose();
  }
}

export class ObservableFromSubscribable<T> extends Rx.Subject<T> {
  subscriptions = new Subscriptions();
  constructor(private subscribable: {subscribe: (callback) => { dispose }, initial?}) {
    super();
    if (subscribable.initial)
      this.onNext(subscribable.initial);
    this.subscriptions.subd(d => {
      d(this.subscribable.subscribe(x => this.onNext(x)));
    });
  }

  dispose() {
    this.subscriptions.dispose();
    super.dispose();
  }
}


export class ReactiveList<T> extends Base implements Rx.IDisposable {
  items: T[];

  allObservable: ObserveAll<T>;
  prepare(items: T[], properties?: string[]) {
    this.allObservable = new ObserveAll<T>(properties);
    this.items = items;
    items.forEach(x => this.observeItem(x));
    this.subscriptions.subd(d => {
      var sub = bindingEngine.collectionObserver(this.items)
        .subscribe(x => {
        // TODO: Make item observation optional..
        if (x.length == 0) return;

        var added: T[] = [];
        var removed: T[] = [];
        x.forEach(x => {
          if (x.addedCount > 0) this.items.asEnumerable().skip(x.index).take(x.addedCount).toArray().forEach(x => added.push(x))// XXX:
          if (x.removed.length > 0) x.removed.forEach(x => removed.push(x));
        });
        if (added.length > 0) this.itemsAdded.onNext(added);
        if (removed.length > 0) this.itemsRemoved.onNext(removed);
      });
      d(sub);
      d(this.itemsAdded.subscribe(evt => evt.forEach(x => this.observeItem(x))));
      d(this.itemsRemoved.subscribe(evt => evt.forEach(x => {
        this.changedSubs.get(x)(); this.changedSubs.delete(x);
      })));
      d(() => this.changedSubs.forEach((v, k) => { v(); this.changedSubs.delete(k) }));
    });
  }

  observeItem(x: T) { this.changedSubs.set(x, this.observeItemInternal(x)); }
  observeItemInternal(x: T) {
    return this.allObservable.observeItemInternal(x, evt => this.itemChanged.onNext(evt));
  }


  dispose() {
    this.subscriptions.dispose();
    this.itemsAdded.dispose();
    this.itemsRemoved.dispose();
    this.itemChanged.dispose();
  }

  get modified() {
    return Rx.Observable.merge(this.itemsAdded.select(x => 0), this.itemsRemoved.select(x => 0), this.itemChanged.select(x => 0))
  }

  itemsAdded = new Rx.Subject<T[]>();
  itemsRemoved = new Rx.Subject<T[]>();
  itemChanged = new Rx.Subject<IPropertyChange<T>>();
  changedSubs = new Map<T, Function>();
}

export class ObserveAll<T> {
  constructor(private properties?: string[]) {}

  observeItemInternal(x: T, callback): Function {
    var obs: { dispose: Function }[] = [];

    if (this.properties) {
      this.properties.forEach(p => obs.push(this.observeProperty(x, p, callback)))
    } else {
      this.properties = [];
      // Observes all properties... sucks impl??
      for (let i in x) {
        if (x.hasOwnProperty(i)) {
          this.properties.push(i); // cache
          obs.push(this.observeProperty(x, i, callback));
        }
      }
    }
    return () => obs.forEach(x => x.dispose());
  }

  observeProperty(x: T, p: string, callback) {
    return bindingEngine.propertyObserver(x, p).subscribe(evt => {
      Tk.Debug.log("$$$ propertyObserver: ", x,p, evt);
      callback({ item: x, propertyName: p, change: evt })
    });
  }
}

export interface ICommandInfo {
  canExecuteObservable?: ISubscriptionWithInitial<boolean>;
  isVisibleObservable?: ISubscriptionWithInitial<boolean>;
  icon?: string;
  textCls?: string;
  cls?: string;
}

// TODO: Header, Icon, TextCls support?? So commands can be completely reusable?
export var uiCommand = function<T>(action: IPromiseFunction<T>, canExecuteObservable?: ISubscriptionWithInitial<boolean>, isVisibleObservable?: ISubscriptionWithInitial<boolean>) { // Rx.Observable<boolean>
  return uiCommand2(null, action, {canExecuteObservable: canExecuteObservable, isVisibleObservable: isVisibleObservable});
}

export var uiCommandWithLogin = function<T>(action: IPromiseFunction<T>, canExecuteObservable?: ISubscriptionWithInitial<boolean>, isVisibleObservable?: ISubscriptionWithInitial<boolean>) {
  return uiCommandWithLogin2(null, action, {canExecuteObservable: canExecuteObservable, isVisibleObservable: isVisibleObservable});
}

export var uiCommand2 = function<T>(name: string, action: IPromiseFunction<T>, options?: ICommandInfo) { // Rx.Observable<boolean>
  let command = new UiCommandInternal<T>(name, action, options);

  // TODO: Optimize?
  let f = function() { return command.execute(); }
  let f2 = <any>f;
  f2.command = command;
  f2.dispose = () => command.dispose.bind(command);
  Object.defineProperty(f, 'name', {get: () => command.name, set: (value) => command.name = value });
  Object.defineProperty(f, 'cls', {get: () => command.cls, set: (value) => command.cls = value });
  Object.defineProperty(f, 'icon', {get: () => command.icon, set: (value) => command.icon = value });
  Object.defineProperty(f, 'textCls', {get: () => command.textCls, set: (value) => command.textCls = value });
  Object.defineProperty(f, 'canExecute', {get: () => command.canExecute });
  Object.defineProperty(f, 'isExecuting', {get: () => command.isExecuting });
  if (options && options.isVisibleObservable)
    Object.defineProperty(f, 'isVisible', {get: () => (<any>command).isVisible });
  else
    (<any>f).isVisible = true;
  //Object.defineProperty(f, 'canExecuteObservable', {get: () => command.canExecuteObservable });
  //Object.defineProperty(f, 'isExecutingObservable', {get: () => command.isExecutingObservable });
  return f;
}

export var uiCommandWithLogin2 = function<T>(name: string, action: IPromiseFunction<T>, options?: ICommandInfo) {
  let f = <any>uiCommand2(name, action, options);
  let act = f.command.action
  let toastr = <Toastr>Container.instance.get(Toastr);
  let w6 = <W6>Container.instance.get(W6);
  f.command.action = async () => {
    // TODO: What about using Queries and Commands with IRequireUser, throwing when user missing (Decorator), and then catching that exception instead??
    if (w6.isLoggedIn) return await act(arguments);
    if (await toastr.warning("To continue this action you have to login", "Login Required")) w6.openLoginDialog(null)
  }

  return f;
}

class UiCommandInternal<T> extends Base {
  isExecuting = false;
  otherBusy = false;
  isVisible = true;
  cls: string;
  icon: string;
  textCls: string;

  // TODO: Lazy init and expose asObservable() instead
  //public isExecutingObservable = new ObservableFromSubscribable<boolean>(this.observe("isExecuting"));
  //public canExecuteObservable = new ObservableFromSubscribable<boolean>(this.observe("canExecute"));

  constructor(public name: string, private action: IPromiseFunction<T>, options?: ICommandInfo) {
    super();
    // this.subscriptions.subd(d => {
    //   d(this.isExecutingObservable);
    //   d(this.canExecuteObservable);
    // })
    if (!options) return;

    this.cls = options.cls;
    this.icon = options.icon;
    this.textCls = options.textCls;

    if (options.canExecuteObservable) {
      if (options.canExecuteObservable.hasOwnProperty("initial"))
        this.otherBusy = !options.canExecuteObservable.initial;
      // if (canExecuteObservable.last) {
      //   console.log("$$$ canExecuteableservable last: ", canExecuteObservable, canExecuteObservable.last()[0]);
      //   this.otherBusy = !canExecuteObservable.last()[0];
      // }
      this.subscriptions.subd(d => d(options.canExecuteObservable.subscribe(x => this.otherBusy = !x)));
    }
    if (options.isVisibleObservable) {
      if (options.isVisibleObservable.hasOwnProperty("initial"))
        this.isVisible = options.isVisibleObservable.initial;
      this.subscriptions.subd(d => d(options.isVisibleObservable.subscribe(x => this.isVisible = x)));
    }
  }

  // TODO: expose this as an observable too
  public get canExecute() { return !this.isExecuting && !this.otherBusy; }
  public dispose() { this.subscriptions.dispose(); }
  public async execute(...args): Promise<T> {
    this.isExecuting = true;
    try {
      return await this.action(...args);
    } catch(err) {
      // TODO: Catch specific errors, like LoginRequired, and handle it appropriately..
      // TODO: inject logger
      var toastr = <Toastr>Container.instance.get(Toastr);
      if (err.constructor == ValidationResult) {
        // TODO: Just disable the save button until validated?
        toastr.warning("Please fix the indicated fields", "Validation failed");
      } else {
        toastr.error("An error ocurred while processing this action", "Error");
      }
      throw(err);
    } finally {
      this.isExecuting = false;
    }
  }
}
