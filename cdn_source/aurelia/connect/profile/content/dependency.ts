import {MenuItem,UiContext,uiCommand2,ViewModel,IMenuItem, Query, DbQuery, DbClientQuery, handlerFor, VoidCommand} from '../../../framework';
import {inject,bindable} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {DialogService} from 'aurelia-dialog';
import {EditDependency} from './edit-dependency';

@inject(UiContext)
export class Dependency extends ViewModel {
  @bindable showingEditVersion;
  defaultAssetUrl = this.w6.url.getAssetUrl("img/noimage.png");
  defaultBackUrl = this.w6.url.getAssetUrl('img/play.withSIX/games/stream-bg.jpg');

  constructor(ui: UiContext) { super(ui); }

  model: IShowDependency;
  activate(model: IShowDependency) {
    this.model = model;
    //this.subscriptions.sub(this.eventBus.subscribe())
  }

  get isLocked() { return this.model.constraint ? true : false; }

  changeVersion = uiCommand2("Change version", async () => this.dialog.open({viewModel: EditDependency, model: this.model }), { icon: "withSIX-icon-Edit-Pencil" })
  remove = uiCommand2("Remove", async () =>this.eventBus.publish(new RemoveDependencyEvent(this.model)), { icon: "withSIX-icon-Square-X" })

  topMenuActions: IMenuItem[] = [
    new MenuItem(this.changeVersion),
    new MenuItem(this.remove)
  ]

  //get image() { return this.model.image || this.defaultAssetUrl; }
}

export class RemoveDependencyEvent {
  constructor(public model: IDependency) {}
}

// export class DependencyChangedEvent {
//   constructor(public model: IDependency) {}
// }

export interface IDependency {
  dependency: string;
  id?: string;
  constraint?: string;
  isRequired?: boolean;
  type: string;
  availableVersions?: string[];
}


export interface IShowDependency extends IDependency {
  name?: string;
  image?: string;
  //avatarUpdatedAt?: Date;
}
