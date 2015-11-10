import {inject} from 'aurelia-framework';

interface ToastOpts {
  timeOut?: number;
}

interface IDisplayMethod {
  (message: string, title?: string, opts?: ToastOpts): Promise<boolean>
}

@inject('logger')
export class Toastr {
  constructor(private logger: MyApp.Components.Logger.ToastLogger) {}

  info(message: string, title?: string, opts?: ToastOpts) { return this.callLogger('info', message, title, opts); }
  warning(message: string, title?: string, opts?: ToastOpts) { return this.callLogger('warning', message, title, opts); }
  error(message: string, title?: string, opts?: ToastOpts) { return this.callLogger('error', message, title, opts); }
  success(message: string, title?: string, opts?: ToastOpts) { return this.callLogger('success', message, title, opts); }

  callLogger(type, message, title, opts?: ToastOpts) {
    return new Promise<boolean>((resolve, reject) => {
      let resolved = false;
      let options = angular.extend({
        onHidden: () => { if (!resolved) { resolved = true; resolve() } },
        onclick: () => { resolved = true; resolve(true) }
      }, opts);
      this.logger[type].apply(this.logger, [message, title, options])
    })
  }
}
