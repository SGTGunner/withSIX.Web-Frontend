import {Mediator, LegacyMediator} from './mediator';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Toastr} from './toastr';
import {ListFactory} from './reactive';
import {DialogService,DialogController} from 'aurelia-dialog';
import {inject} from 'aurelia-framework';
import {Validation,ValidationResult} from 'aurelia-validation';
import {Router} from 'aurelia-router';

import {Base} from './base';

@inject(Mediator,EventAggregator,LegacyMediator, Toastr, W6, ListFactory, DialogService, Validation, Router)
export class UiContext {
  constructor(public mediator: Mediator, public eventBus: EventAggregator, public legacyMediator: LegacyMediator, public toastr: Toastr, public w6: W6, public listFactory: ListFactory, public dialog: DialogService, public validator: Validation, public router: Router) {}
}

@inject(UiContext)
export class ViewModel extends Base {
   hasApi: boolean;
  _router: Router;
  changed = false;
  constructor(private ui: UiContext) { super();
    this.hasApi = (<any>window).api != null;
  }

  get w6() { return this.ui.w6; }
  get mediator() { return this.ui.mediator; }
  get eventBus() { return this.ui.eventBus; }
  get dialog() { return this.ui.dialog; }
  get toastr() { return this.ui.toastr; }
  get listFactory() { return this.ui.listFactory; }
  get legacyMediator() { return this.ui.legacyMediator; }
  get validator() { return this.ui.validator; }
  get router() { return this._router || this.ui.router; }
  set router(value) { this._router = value; }

  deactivate() { this.dispose(); }
  canDeactivate() {
    if (!this.changed) return true;
    this.openChanges();
    return false;
  }
  protected alert(message, title = "Alert") { return this.toastr.warning(message, title); }
  protected openChanges() { this.alert("You have outstanding changes, please save or cancel them first", "Outstanding changes"); }
}

@inject(DialogController, UiContext)
export class DialogBase extends ViewModel {
  constructor(public controller: DialogController, ui: UiContext) {
    super(ui);
  }

  //cancel = UiCommand2('Cancel', async () => this.controller.cancel(), { cls: "cancel" });
}
