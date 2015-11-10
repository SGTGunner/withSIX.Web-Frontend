module MyApp.Components.BytesFilter {
    // TODO: Dedup; this does pretty much the same as the size filter!
    export class BytesFilter {
        static $name = 'bytes';
        static factory = getFactory([], () => new BytesFilter().convert);

        static units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];

        public convert = (bytes, precision, unit) => {
            if (isNaN(parseFloat(bytes)) || !isFinite(bytes))
                return '-';

            if (bytes == 0)
                return "-";

            if (typeof precision === 'undefined')
                precision = 1;

            if (typeof unit === 'undefined')
                unit = 0;

            var n = Math.floor(Math.log(bytes) / Math.log(1024));
            return (bytes / Math.pow(1024, Math.floor(n))).toFixed(precision) + ' ' + BytesFilter.units[n + unit];
        };
    }

    angular.module('Components.BytesFilter', [])
        .filter(BytesFilter.$name, BytesFilter.factory);
}