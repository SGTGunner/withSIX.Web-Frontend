module MyApp.Components.Geo {
    export class GeoService extends Tk.Service {
        static $name = 'geoService';
        static $inject = ['$http', 'promiseCache', '$q'];

        constructor(private $http: ng.IHttpService, private promiseCache, private $q) {
            super();
        }

        public getMyInfo(): ng.IHttpPromise<{ longitude; latitude }> {
            return this.promiseCache({
                promise: () => this.$http.get("//freegeoip.net/json/"),
                key: "geoService-"
            });
        }

        public getMyInfo2(): Promise<{ longitude; latitude }> {
            var q = this.$q.defer();
            if (window.navigator.geolocation) {
                window.navigator.geolocation.getCurrentPosition((location) => q.resolve(location.coords));
            } else {
                this.getMyInfo()
                    .then((result) => q.resolve(result.data))
                    .catch((reason) => q.reject(reason));
            }
            return q.promise;
        }

        public getInfo(ip: string): ng.IHttpPromise<{ longitude; latitude }> {
            return this.promiseCache({
                promise: () => this.$http.get("http://freegeoip.net/json/" + ip),
                key: "geoService-" + ip
            });
        }
    }

    registerService(GeoService);
}