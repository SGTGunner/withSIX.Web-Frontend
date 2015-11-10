import {inject} from 'aurelia-framework';
import {DialogController} from 'aurelia-dialog';
import IBasketItem = MyApp.Components.Basket.IBasketItem;
import {Multi,Base,uiCommand2,DialogBase, Query, DbQuery, handlerFor, Mediator} from '../framework';
import 'version_compare';

declare var VersionCompare;

export class EditPlaylistItem extends DialogBase {
  constraint: string;
  model: IBasketItem;
  versions: string[];
  static autoUpdateStr = "autoupdate";

  async activate(model: IBasketItem) {
    this.model = model;
    this.constraint = model.constraint || EditPlaylistItem.autoUpdateStr;
    var data = await new GetAvailableVersions(this.model.id).handle(this.mediator);
    this.versions = data.versions;
  }

  save = uiCommand2('Save', async () => {
    this.model.constraint = this.constraint == EditPlaylistItem.autoUpdateStr ? null : this.constraint;
    this.controller.ok();
  }, {
    cls: "ok"
  });

  get versionSelected() { return this.constraint != EditPlaylistItem.autoUpdateStr; }
}

interface IAvailableVersions {
  versions: any[];
}

class GetAvailableVersions extends Query<IAvailableVersions> {
  constructor(public id: string) { super(); }
}

@handlerFor(GetAvailableVersions)
//@inject('dbContext', 'modDataService')
class GetAvailableVersionsHandler extends DbQuery<GetAvailableVersions,IAvailableVersions> {
  async handle(request: GetAvailableVersions): Promise<IAvailableVersions> {
    let query = breeze.EntityQuery.from("Mods")
        .where("id", breeze.FilterQueryOp.Equals, request.id)
        .expand('updates')
        .select('updates');
    let versions = [EditPlaylistItem.autoUpdateStr];
    try {
      let data = await this.context.executeQuery(query)
      let updates = <{version: string}[]> (<any>data.results[0]).updates;
      versions = versions.asEnumerable().concat(updates.asEnumerable().select(x => x.version).orderByDescending(x => x, (x, y) => VersionCompare.compare(x, y, {zeroExtend: true}))).toArray();
    } catch (err) {
      Tk.Debug.warn("failure to retrieve versions for mod ", request.id, err);
    }
    return { versions: versions }
  }
}
