import {inject,bindable} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {DialogController} from 'aurelia-dialog';
import {UiContext,Multi,Base,uiCommand2,DialogBase, Command, DbQuery, handlerFor, Mediator} from '../../framework';
import {CollectionScope, PreferredClient} from '../../connect/profile/lib';
import {ensure,ValidationGroupBuilder,ValidationGroup, Validation} from 'aurelia-validation';

interface ICollectionModel {
  name: string;
  repositoryUrl: string;
  serverAddress: string;
  serverPassword: string;
  version?: string,
  scope?: CollectionScope;
  dependencies?: { dependency: string, constraint?: string}[]
}

interface IGame {
  name: string;
  id: string;
  slug: string;
}

@inject(DialogController, UiContext)
export class CreateCollectionDialog extends DialogBase {
  public model: ICollectionModel;
  //@ensure((it: ValidationGroupBuilder) => it.isNotEmpty())
  public game: IGame;
  validation: ValidationGroup;

  constructor(controller, ui: UiContext) {
    super(controller, ui);
    this.subscriptions.subd(d => {
      d(this.save);
      d(this.cancel);
    });
  }

  activate(model) {
    // TODO: Read the repositoryurl and serverAddress from initialVersion ?
    this.model = model.model || {name: "", repositoryUrl: null, serverAddress: null};
    this.game = model.game;
    this.validation = (<any>this.validator).on(this).ensure('model.name').isNotEmpty();
  }

  deactivate() { this.dispose(); }

  save = uiCommand2('Save', async () => {
    await this.validation.validate(); // TODO: how to wrap this into the UI, catch ValidationResult and then display the error info?
    var id = await new CreateCollection(this.game.id, this.model).handle(this.mediator);
    this.router.navigate(this.w6.url.play + "/" + this.game.slug + "/collections/" + id.toShortId() + '/' + this.model.name.sluggifyEntityName() + '/content/edit?landing=1');
    this.controller.ok(id);
  }, {
    cls: "ok"
  });

  cancel = uiCommand2('Cancel', async () => this.controller.cancel(), {
    cls: "ok",
    canExecuteObservable: new Multi([Base.observe(this.save, 'isExecuting')], x => !x)
  });
}

interface ICreateCollectionModel {
  name: string;
  gameId: string;
  initialVersion: IInitialVersion,
  scope?: CollectionScope;
}

interface IInitialVersion {
  version: string;
  servers: string[];
  repositories: string[];
  dependencies?: {dependency: string, constraint?: string}[]
}

class CreateCollection extends Command<string> {
  constructor(public gameId: string, public model: ICollectionModel) { super(); }
}

@handlerFor(CreateCollection)
class CreateCollectionHandler extends DbQuery<CreateCollection, string> {
  // TODO: Handle the repository and serveraddress on the initialversion object?!
  async handle(request: CreateCollection) {
    // repository: request.model.repositoryUrl, serverAddress: request.model.serverAddress
    let servers = [];
    let repositories = [];
    if (request.model.repositoryUrl) repositories = repositories.concat(request.model.repositoryUrl.split(";"));
    if (request.model.serverAddress) {
      let server = {address: request.model.serverAddress, password: request.model.serverPassword ? request.model.serverPassword : null}
      servers.push(server);
    }
    let initialVersion = <IInitialVersion>{
      version: request.model.version || "0.0.1",
      servers: servers,
      repositories: repositories,
      dependencies: []
    }
    if (request.model.dependencies) initialVersion.dependencies = request.model.dependencies;
    let result = await this.context.postCustom<string>("collections", {
      gameId: request.gameId,
      name: request.model.name,
      initialVersion: initialVersion
    });
    return result.data;
  }
}
