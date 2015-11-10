module MyApp {


    export interface ICQWM<T> {
        //execute: any;
        $ModelType: T;
    }

    export interface IModel<TModel> {
        model: TModel;
    }

    export interface ICreateComment<TComment> {
        contentId: string;
        message: string;
        replyTo?: TComment;
        replyToId?: number;
    }

    export class DbQueryBase extends Tk.QueryBase {
        static $inject = ['dbContext'];

        constructor(public context: W6Context) {
            super();
        }

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
            Debug.log("getting " + type + " by shortId: " + id);
            return breeze.EntityQuery
                .fromEntityKey(this.context.getEntityKeyFromShortId(type, id));
        }

        public getEntityQuery(type: string, id: string): breeze.EntityQuery {
            Debug.log("getting " + type + " by id: " + id);
            return breeze.EntityQuery
                .fromEntityKey(this.context.getEntityKey(type, id));
        }
    }

    export class DbCommandBase extends Tk.CommandBase {
        static $inject = ['dbContext'];

        constructor(public context: W6Context) {
            super();
        }

        public buildErrorResponse = reason => {
            if (!reason || !reason.data) {
                return {
                    message: "Unknown error",
                    errors: {},
                    httpFailed: LoadingFailedController.getErrorMsg(reason)
                };
            }
            return {
                message: !reason.data ? "Unknown error" : reason.data.message,
                errors: reason.data.modelState,
                httpFailed: LoadingFailedController.getErrorMsg(reason)
            };
        };
        public respondSuccess = message => {
            return { success: true, message: message };
        };
        public respondError = reason => {
            var response = this.buildErrorResponse(reason);
            /*
            if (reason.data && reason.data.modelState) {
                if (reason.data.modelState["activation"]) {
                    response.notActivated = true;
                }
            }
            */
            return this.context.$q.reject(response);
        };
    }

    // dialogs actually wraps $modal but adds some cool features on top like built-in error, warning, confirmation, wait etc dialogs
    export class DialogQueryBase extends DbQueryBase {
        static $inject = ['$modal', 'dialogs', 'dbContext'];

        constructor(private $modal, public dialogs, context: W6Context) { super(context); }

        // Use to have full control over the ui.bootstrap dialog implementation - has resolve support for one or multiple promises
        public openDialog(controller, config?) { return DialogQueryBase.openDialog(this.$modal, controller, config); }

        // Use to build on dialog-service built-in functionality
        // - lacks resolve support so requires manual labour if you want to use 1 or multiple ($q.all) promises before initiating the controller..in that case better use openDialog
        public createDialog(controller, data?, overrideOpts?) { return DialogQueryBase.createDialog(this.dialogs, controller, controller.$view, data, overrideOpts); }

        static createDialog(dialogs, controller, template?, data?, overrideOpts?) {
            var opts = Tools.handleOverrides({ windowClass: 'dialogs-withSix', copy: false }, overrideOpts);

            Debug.log('createDialog', { controller: controller, template: template, data: data }, opts);

            var dialog = dialogs.create(template || controller.$view, controller, data, opts);

            Debug.log(dialog);

            return dialog;
        }

        static openDialog($modal, controller, config?) {
            var cfg = Tools.handleOverrides(this.getConfig(controller), config);
            Debug.log('openDialog', cfg);

            return $modal.open(cfg);
        }

        static getConfig(controller) {
            return {
                templateUrl: controller.$view,
                controller: controller,
                windowClass: 'dialogs-withSix'
            };
        }
    }
}