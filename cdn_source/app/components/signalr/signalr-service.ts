module MyApp.Components.Signalr {

    export interface ISignalrConnection {
        connection: HubConnection;
        connected: boolean;
        promise(): Promise<HubConnection>;
        execHub<T>(hub: HubProxy, hubName: string, commandName: string, command?: Object): Promise<T>;
        registerHubEvent(hub: HubProxy, eventName: string, hubName: string);
    }

    export enum ConnectionState {
        connecting = 0,
        connected = 1,
        reconnecting = 2,
        disconnected = 4
    }

    class SignalrConnection implements ISignalrConnection {
        connection: HubConnection;

        constructor(public name, private connectionInfo, private promiseCache, private $q: ng.IQService, protected $rootScope: IRootScope, protected eventBus, private reconnect = true) {
            this.connection = $.hubConnection(connectionInfo);
            this.connection.stateChanged((state) => {
                switch (<ConnectionState>state.newState) {
                    case ConnectionState.connected:
                        this.connected = true;
                        this.onConnect();
                        break;
                    case ConnectionState.disconnected:
                        this.connected = false;
                        this.onDisconnect();
                        break;
                default:
                }
            });
            this.setupReconnection();
        }

        protected onConnect() {
            Debug.log(this.name + " isConnected");
        }

        protected onDisconnect() {
            Debug.log(this.name + " isDisconnected");
        }

        private exec<T>(fnc: () => JQueryPromise<T>): Promise<T> {
            return <any>this.$q.when<T>(<any> fnc());
        }

        private converToQ<T>(jqD: JQueryDeferred<T>) {
            var deferred = this.$q.defer();
            jqD
                .done(r => deferred.resolve(LoadingStatusInterceptor.LoadingStatusInterceptor.convertToClient(r)))
                .fail(r => deferred.reject(LoadingStatusInterceptor.LoadingStatusInterceptor.convertToClient(r)));
            return deferred.promise;
        }

        public execHub<T>(hub: HubProxy, hubName: string, commandName: string, command?: Object): Promise<T> {
            var requestName = hubName + "." + commandName;
            this.$rootScope.$broadcast('startHttpProgress', { requestName: requestName });
            return this.execAction(() => command == null ? hub.invoke(commandName) : hub.invoke(commandName, command))
                .then(r => {
                    Debug.log("success!", r, hub, commandName, command);
                    this.$rootScope.$broadcast('stopHttpProgress', { requestName: requestName, success: true });
                    return r;
                })
                .catch(r => {
                    Debug.log("fail!", r, hub, commandName, command);
                    var def = this.$q.defer();
                    this.$rootScope.$broadcast('stopHttpProgress', { requestName: requestName, success: false });
                    def.reject(r);
                    return def.promise;
                });
        }

        public registerHubEvent(hub: HubProxy, eventName: string, hubName: string) {
            hub.on(eventName, (...msgs: any[]) => {
                var args = [];
                angular.forEach(msgs, e => args.push(LoadingStatusInterceptor.LoadingStatusInterceptor.convertToClient(e)));
                Debug.log("!!! EVENT: ", eventName, hub, args);
                var event = hubName + "." + eventName;
                var params = [event].concat(args);
                this.$rootScope.$broadcast.apply(this.$rootScope, params);
                this.eventBus.publish.apply(this.eventBus, params.length < 3 ? params : [event, args]); // eventBus does not support multi params..
                // TODO: we should really just switch to event objects..
            });
        }

        private execAction<T>(fnc: (c) => JQueryDeferred<T>): Promise<T> {
            return this.promise()
                .then(c => this.converToQ(fnc(c)));
        }

        public connected: boolean;

        public promise(): Promise<HubConnection> {
            return this.promiseCache({
                promise: () => this.exec(() => this.connection.start())
                    .then(() => {
                        Debug.log(this.name + ' Now connected, connection ID=' + this.connection.id);

                        return this.connection;
                    }).catch(r => {
                        Debug.log('Could not Connect to ' + this.name);
                        var d = this.$q.defer();
                        d.reject(r);
                        return d.promise;
                    }),
                key: 'signalr' + this.name,
                ttl: -1, // Be sure to set to something more sane if we use caching in Local storage! ;-)
                expireOnFailure: () => true
            });
        }

        private reconnectionSetup: boolean = false;
        private setupReconnection() {
            if (this.reconnect && !this.reconnectionSetup) {
                this.reconnectionSetup = true;
                this.connection.disconnected(() => {
                    setTimeout(() => {
                        //this.connection.start();
                        this.exec(() => this.connection.start()).catch(() => {

                        });
                    }, 2500); // Re-start connection after 5 seconds
                });
            }
        }
    }

    class MiniClientConnection extends SignalrConnection {}

    export class SignalrService extends Tk.Service {
        static $name = 'signalrService';
        static $inject = ['userInfo', 'w6', 'dbContext', '$q', '$rootScope', 'promiseCache', 'aur.eventBus'];

        constructor(private userInfo, private w6: W6, private context: W6Context, $q: ng.IQService, $rootScope: IRootScope, private promiseCache, eventBus: IEventBus) {
            super();
            this.server = new SignalrConnection("Server", w6.url.ws, promiseCache, $q, $rootScope, false);
            // TODO: HTTPS Support
            // TODO: Some sort of secret key / api key of user on local client??
            this.client = new SignalrConnection("Client", "http://localhost:56666", promiseCache, $q, $rootScope, eventBus, false);
            this.miniClient = new MiniClientConnection("MiniClient", "https://127.0.0.66:9666", promiseCache, $q, $rootScope, eventBus);
        }

        public client: ISignalrConnection;
        public miniClient: ISignalrConnection;
        public server: ISignalrConnection;
    }

    registerService(SignalrService);
}
