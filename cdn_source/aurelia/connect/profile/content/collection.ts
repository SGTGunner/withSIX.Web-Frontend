import {ContentViewModel, IContent, TypeScope, InstallContent, ContentDeleted} from './base';
import {IPromiseFunction, uiCommand2, MenuItem, VoidCommand, DbQuery, DbClientQuery, handlerFor} from '../../../framework';

import BasketItemType = MyApp.Components.Basket.BasketItemType;
import IBasketItem = MyApp.Components.Basket.IBasketItem;

export interface ICollection extends IContent {
  typeScope: TypeScope;
}

export class Collection extends ContentViewModel<ICollection> {
  icon = "withSIX-icon-Nav-Collection";
  scopeIcon: string;
  delete: IPromiseFunction<void>;
  edit: IPromiseFunction<boolean>;
	topMenuActions = []

  async activate(model: ICollection) {
    await super.activate(model);
    this.scopeIcon = this.getScopeIcon();
  }

	setupMenuItems() {
		super.setupMenuItems();

    var published = this.model.typeScope == TypeScope.Published;
    this.subscriptions.subd(d => {
      if (published) {
        d(this.edit = uiCommand2("Edit", async() => this.router.navigate("/p/" + this.model.gameSlug + "/collections/" + this.model.id.toShortId() + "/" + this.model.name.sluggify() + "/content/edit"), { icon: "withSIX-icon-Edit-Pencil" }))
        this.topMenuActions.push(new MenuItem(this.edit))
      }
      d(this.delete = this.createDeleteCommand())
      this.topMenuActions.push(new MenuItem(this.delete));
    })
  }

  toBasketInfo(): IBasketItem {
    return {
        id: this.model.id, packageName: this.model.packageName,
        gameId: this.model.gameId,
        itemType: BasketItemType.Collection,
        author: this.model.author,
        image: this.model.image,
        name: this.model.name,
        sizePacked: this.model.sizePacked,
        isOnlineCollection: this.model.typeScope != TypeScope.Local
    };
  }

  createDeleteCommand() {
    return this.model.typeScope == TypeScope.Subscribed
    ? uiCommand2("Unsubscribe", async () => {
      if (!confirm("Are you sure you want to unsubscribe this collection?")) return;
      await new DeleteCollection(this.model.id, this.model.gameId, this.model.typeScope).handle(this.mediator);
    }, { icon: "withSIX-icon-Square-X" })
    : uiCommand2("Delete", async () => {
     if (!confirm("Are you sure you want to permanently delete this collection?")) return;
     await new DeleteCollection(this.model.id, this.model.gameId, this.model.typeScope).handle(this.mediator);
   }, { icon: "withSIX-icon-Square-X" })
  }

  getScopeIcon() {
    switch (this.model.typeScope) {
      case TypeScope.Subscribed: return "withSIX-icon-System-Remote";
      case TypeScope.Published: return "withSIX-icon-Cloud";
    }
    return "";
  }
}

export enum CollectionScope {
  Public,
  Unlisted,
  Private
}

export enum PreferredClient {
  Default,
  Sync,
  PlayWithSix
}

class DeleteCollection extends VoidCommand {
  constructor(public id: string, public gameId: string, public typeScope: TypeScope) {super()}
}

@handlerFor(DeleteCollection)
class DeleteCollectionHandler extends DbClientQuery<DeleteCollection, void> {
  async handle(request: DeleteCollection) {
    if (request.typeScope == TypeScope.Subscribed) await this.context.postCustom("collections/" + request.id + "/unsubscribe");
    if (request.typeScope == TypeScope.Published) await this.context.deleteCustom("collections/" + request.id);
    await this.modInfoService.deleteCollection({gameId: request.gameId, id: request.id});
    await this.context.eventBus.publish(new ContentDeleted(request.id));
  }
}
