declare module 'aurelia-dialog' {
    export class DialogService {
      open(settings): DialogResult;
    }

    export class DialogController {
      ok(result?);
      cancel(result?);
      error(message);
      settings: {
        lock: boolean;
        centerHorizontalOnly: boolean;
      }
    }

    class DialogResult {
      wasCancelled: boolean;
      output;
      constructor(cancelled, result);
    }
}
