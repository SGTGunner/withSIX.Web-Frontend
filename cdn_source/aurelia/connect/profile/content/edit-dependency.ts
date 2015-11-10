import {inject,bindable} from 'aurelia-framework';
import {IDependency} from './dependency';
import {DialogBase, uiCommand2} from '../../../framework';

import 'version_compare';

declare var VersionCompare;

//@inject(DialogController, W6, Mediator)
export class EditDependency extends DialogBase {
  model;
  constraint: string; isOptional: boolean;
  versions: any[];
  static autoUpdateStr = "autoupdate";

  activate(model: IDependency) {
    this.model = model;
    this.isOptional = !model.isRequired;
    this.constraint = model.constraint;
    this.versions = [EditDependency.autoUpdateStr];

    if (this.model.availableVersions) this.versions = this.versions.asEnumerable().concat(this.model.availableVersions.asEnumerable().orderByDescending(x => x, (x, y) => VersionCompare.compare(x, y, {zeroExtend: true}))).toArray();
  }

  get versionSelected() { return this.constraint != EditDependency.autoUpdateStr; }

  save = uiCommand2('Save', async () => {
    this.model.constraint = this.constraint == EditDependency.autoUpdateStr ? null : this.constraint;
    this.model.isRequired = !this.isOptional;
    this.controller.ok();
  }, {
    cls: "ok"
  });
}
