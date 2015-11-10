module MyApp.Components {
    class Debounce {
        static $name = 'debounce';
        static $inject = ['$timeout'];
        static factory = getFactory(Debounce.$inject, ($timeout) => new Debounce($timeout).create);

        constructor(private $timeout) {}

        public create = (callback, interval) => {
            var timeout = null;
            return () => {
                this.$timeout.cancel(timeout);
                timeout = this.$timeout(callback, interval);
            };
        };
    }

    angular.module('Components.Debounce', [])
        .factory(Debounce.$name, Debounce.factory);
}