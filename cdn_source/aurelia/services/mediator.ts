import {Toastr} from '../services/lib';
import {inject} from 'aurelia-framework';

import {Mediator, IMediator, IRequest, IRequestHandler} from 'aurelia-mediator';
export * from 'aurelia-mediator';

// App specific starts
@inject(Mediator, Toastr)
export class ErrorLoggingMediatorDecorator implements IMediator {
  constructor(private mediator: IMediator, private toastr: Toastr) {}

  request<T>(request: IRequest<T>): Promise<T> {
    return this.mediator.request<T>(request)
      .catch(fail => {
        var msg = MyApp.LoadingFailedController.getErrorMsg(fail);
        this.toastr.error(msg[0], msg[1]);
        return Promise.reject<T>(fail);
      });
  }
}

@inject(Mediator, W6)
export class InjectingMediatorDecorator implements IMediator {
  constructor(private mediator: IMediator, private w6: W6) {}
  request<T>(request: IRequest<T>): Promise<T> {
    if ((<any>request).$requireUser)
      (<any>request).user = this.w6.userInfo;
    return this.mediator.request<T>(request);
  }
}

export interface IRequireUser {
  user: MyApp.IUserInfo;
  //$requireUser: boolean;
}

export function requireUser() {
  return function (target) {
    Tools.defineProperties(target.prototype, {$requireUser: true})
  };
}


@inject("dbContext")
export class DbQuery<TRequest, TResponse> implements IRequestHandler<TRequest, TResponse> {
  constructor(protected context: MyApp.W6Context) {}
  handle(request: TRequest): Promise<TResponse> { throw "must implement handle method"; }

  public findBySlug(type: string, slug: string, requestName: string) {
      return this.processSingleResult(this.context.executeQuery(breeze.EntityQuery.from(type)
          .where("slug", breeze.FilterQueryOp.Equals, slug)
          .top(1), requestName));
  }

  public executeKeyQuery<T extends breeze.Entity>(query: () => breeze.EntityQuery): Promise<T> {
      return this.processSingleResult(this.context.executeKeyQuery(query));
  }

  processSingleResult = promise => promise.
      then(result => {
          if (result.results.length == 0) {
              var d = this.context.$q.defer();
              d.reject(new Tk.NotFoundException("There were no results returned from the server"));
              return d.promise;
          }
          return result.results[0];
      }).catch(failure => {
          var d = this.context.$q.defer();
          if (failure.status == 404) {
              d.reject(new Tk.NotFoundException("The server responded with 404"));
          } else {
              d.reject(failure);
          }
          return d.promise;
      });

  public getEntityQueryFromShortId(type: string, id: string): breeze.EntityQuery {
      Tk.Debug.log("getting " + type + " by shortId: " + id);
      return breeze.EntityQuery
          .fromEntityKey(this.context.getEntityKeyFromShortId(type, id));
  }

  public getEntityQuery(type: string, id: string): breeze.EntityQuery {
      Tk.Debug.log("getting " + type + " by id: " + id);
      return breeze.EntityQuery
          .fromEntityKey(this.context.getEntityKey(type, id));
  }
}

@inject("dbContext", "modInfoService")
export class DbClientQuery<TRequest, TResponse> extends DbQuery<TRequest, TResponse> {
  constructor(dbContext, protected modInfoService: MyApp.Components.ModInfo.ModInfoService) { super(dbContext);}
  handle(request: TRequest): Promise<TResponse> { throw "must implement handle method"; }
}

@inject("commandExecutor")
export class LegacyMediator extends Mediator {
  constructor(private commandExecutor) { super();}
  legacyRequest<T>(requestName: string, requestParams?): Promise<T> {
    return this.commandExecutor.execute(requestName, requestParams)
      .then(x => x.lastResult);
  }

 openAddModDialog(gameSlug: string) {
   return this.legacyRequest<void>(MyApp.Play.Games.OpenAddModDialogQuery.$name, { gameSlug: gameSlug });
  }
 openAddCollectionDialog(gameSlug: string) {
   return this.legacyRequest<void>(MyApp.Play.Games.OpenAddCollectionDialogQuery.$name, { gameSlug: gameSlug })
  }
}
