import {inject,bindingEngine} from 'aurelia-framework';
import {Mediator} from './mediator';
import * as Rx from 'rx';
import {DialogController} from 'aurelia-dialog';

export interface IDisposable {
  dispose: () => void;
}

export interface LooseDisposable {
  (fnc: IDisposable | Function): void
}

export interface ISubscriptionHandler<T> {
  (x: T): void;
}

export interface ISubscription<T> {
  subscribe: (f: ISubscriptionHandler<T>) => IDisposable;
}

export interface ISubscriptionWithInitial<T> extends ISubscription<T> {
  initial?: T;
}

export interface IPromiseFunction<T> {
  (...args): Promise<T>
}

export class Subscriptions {
  items = [];
  // TODO: deprecate LooseDisposable, always favor IDisposable?
  sub(...funcs: (IDisposable | Function)[]) {
    funcs.forEach((x: any) => this.items.push(x.dispose ? x.dispose.bind(x) : x));
  }

  subd(func: (d: LooseDisposable) => void) {
    func((fnc: any) => { this.items.push(fnc.dispose ? fnc.dispose.bind(fnc) : fnc) });
  }

  // deprecated
  release() { this.dispose(); }

  dispose() {
    this.items.reverse().forEach(x => x());
    this.clear();
  }

  private clear() { this.items = []; }
}


export class Base {
  public subscriptions = new Subscriptions();

  // TODO: Rx hot observables that start with the current value?
  static observe(obj, property) {
    var observer = bindingEngine.propertyObserver(obj, property);
    return {subscribe: observer.subscribe.bind(observer), initial: obj[property] }
  }
  observe(property) { return Base.observe(this, property); }

  static delay(delay) { return new Promise((resolve, reject) => { setTimeout(() => resolve(), delay)}); };

  dispose() { this.subscriptions.dispose(); }
}
