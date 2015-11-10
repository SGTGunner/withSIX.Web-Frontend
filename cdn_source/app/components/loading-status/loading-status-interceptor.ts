module MyApp.Components.LoadingStatusInterceptor {

  export interface IW6Request extends ng.IRequestConfig {
    w6Request: boolean;
  }

  // TODO: Should be careful when cancelling posting data to the server - the server would probably still process the request, so should only occur for queries?
  export class LoadingStatusInterceptor extends Tk.Service {
    static $name = 'loadingStatusInterceptor';
    static $inject = ['$q', '$rootScope', '$cookies', 'userInfo', 'promiseCache', 'localStorageService', 'w6'];
    private activeRequests: number;

    // Temporary repurposed as Breeze loading interceptor
    constructor(private $q: ng.IQService, private $rootScope, private $cookies: ng.cookies.ICookiesService, private userInfo, private promiseCache, private $localStorage, private w6: W6) {
      super();
      this.activeRequests = 0;
    }

    // Need lambda syntax because of how interceptors are called
    public request = (config: IW6Request) => {
      if (config.w6Request) {
        this.setupConfig(config);
        Debug.log("w6request", config);
      }
      this.started();
      return config || this.$q.when(config);
    };
    public requestError = (rejection) => {
      if (rejection.config && rejection.config.w6Request && debug) Debug.log("requestError", rejection);

      this.ended();
      return this.$q.reject(rejection);
    };
    public response = (response) => {
      if (response.config && response.config.w6Request) {
        if (response.data) response.data = LoadingStatusInterceptor.convertToClient(response.data);
        Debug.log("w6Response", response);
      } else if (response.config.breezeRequest) {
        // TODO: Breeze does not parse the date objects when performing a select, because it returns an anonymous object of which it doesnt know the fields
        // a better solution might be to fix this at the root (as we specify the object type when we execute the query??)
        if (response.data) response.data = LoadingStatusInterceptor.convertToClient(response.data, false);
        Debug.log("breezeResponse", response);
      }
      this.ended();
      return response || this.$q.when(response);
    };

    public responseError = (rejection) => {
      if (rejection.config) {
        if (rejection.config.w6Request) {
          if (rejection.data) rejection.data = LoadingStatusInterceptor.convertToClient(rejection.data);
          Debug.log("w6ResponseError", rejection);
        } else if (rejection.config.breezeRequest) {
          if (rejection.data) rejection.data = LoadingStatusInterceptor.convertToClient(rejection.data, false);
          Debug.log("breezeResponseError", rejection);
        }
      }
      this.ended();
      return this.$q.reject(rejection);
    };
    static iso8601RegEx = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/;

    public static convertToClient(obj, convertPropertyNames = true) {
      var converter = breeze.NamingConvention.defaultInstance;
      if (obj instanceof Array) {
        var newAr = [];
        angular.forEach(obj, (v, i) => newAr[i] = this.convertToClient(v, convertPropertyNames));
        return newAr;
      } else if (obj instanceof Date) {
        return obj;
      } else if (obj instanceof Object) {
        var newObj = {};
        if (convertPropertyNames) angular.forEach(obj, (v, p) => newObj[converter.serverPropertyNameToClient(p)] = this.convertToClient(v, convertPropertyNames));
        else angular.forEach(obj, (v, p) => newObj[p] = this.convertToClient(v, convertPropertyNames));
        return newObj;
      } else if (typeof obj == "string") {
        if (this.iso8601RegEx.test(obj)) {
          return breeze.DataType.parseDateFromServer(obj);
          // if (!obj.endsWith("Z")) obj = obj + "Z";
          // return new Date(obj);
        }
      }

      return obj;
    }

    private convertToServer(obj) {
      var converter = breeze.NamingConvention.defaultInstance;
      if (obj instanceof Array) {
        var newAr = [];
        angular.forEach(obj, (v, i) => newAr[i] = this.convertToServer(v));
        return newAr;
      } else if (obj instanceof Date) {
        return obj;
      } else if (obj instanceof Object) {
        var newObj = {};
        angular.forEach(obj, (v, p) => newObj[converter.clientPropertyNameToServer(p)] = v instanceof Object ? this.convertToServer(v) : v);
        return newObj;
      }
      return obj;
    }

    handleDefer() {
      if (this.defer) return this.defer;
      return this.defer = this.$q.defer();
    }

    startedBreeze(requestInfo) {
      // TODO: Canceler should have a requestName, and be cancelled specifically based on requestName ...
      requestInfo.timeout = this.handleDefer().promise;
      requestInfo.config.breezeRequest = true;
      this.setupConfig(requestInfo.config);
      Debug.log("breezeRequest", requestInfo);
    }

    started() {
      if (this.activeRequests == 0) {
        this.$rootScope.canceler = this.handleDefer();
        this.$rootScope.$broadcast('loadingStatusActive');
      }
      this.activeRequests++;
    }

    ended() {
      this.activeRequests--;
      if (this.activeRequests == 0) {
        this.$rootScope.canceler = undefined;
        this.defer = undefined;
        this.$rootScope.$broadcast('loadingStatusInactive');
      }
    }

    defer;

    setupConfig(config: IW6Request) { }
  }

  registerService(LoadingStatusInterceptor);
}
