import {inject,autoinject,customAttribute,bindingEngine} from 'aurelia-framework';
@inject(W6)
export class SizeValueConverter {
  constructor(private w6: W6) {}

  toView(size, format?) {
    var sz = this.w6.sizeFnc(size, format);
    return sz[0] + ' ' + sz[1];
  }
}

export class ProgressValueConverter {
  toView(progress) {
    if (!progress) return "0.00";
    var number = progress * 100;
    var rounded = Math.round(number) / 100;
    return parseFloat(<any>rounded).toFixed(2);
  }
}

export class DateValueConverter {
  toView(date, format) {
    return moment(date).format(format);
  }
}


export class PluralizeValueConverter {
  toView(count: number, word: string) {
    if (count !== 1) {
      // TODO: more cases
      word = word.replace(/y$/, "ies");
    }
    return count + ' ' + word;
  }
}

export class TimeAgoValueConverter {
  toView(date) {
    return moment(date).fromNow();
  }
}

export class HideShowTextValueConverter {
  toView(show) {
    return show ? 'hide' : 'show'
  }
}

export class HideShowIconValueConverter {
  toView(show) {
    return show ? 'withSIX-icon-Arrow-Down-Dir' : 'withSIX-icon-Arrow-Left-Dir'
  }
}

export class FilterOnExistingValueConverter {
  toView(items, key, haystack) {
    return items.asEnumerable().where(x => !haystack.asEnumearble().contains(x[key]));
  }
}

// TODO
/*
() => (nmb, currencyCode) => {
    var currency = {
            USD: "$",
            GBP: "£",
            AUD: "$",
            EUR: "€",
            CAD: "$",
            MIXED: "~"
        },
        thousand,
        decimal,
        format;
    if ($.inArray(currencyCode, ["USD", "AUD", "CAD", "MIXED"]) >= 0) {
        thousand = ",";
        decimal = ".";
        format = "%s %v";
    } else {
        thousand = ".";
        decimal = ",";
        format = "%s %v";
    };
    return accounting.formatMoney(nmb, currency[currencyCode], 2, thousand, decimal, format);
})*/
