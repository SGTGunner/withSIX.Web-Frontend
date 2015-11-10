import Linq from 'linq4es2015/linq';

export default class Utils {
  static concatPromiseResults<T>(results: Enumerable<T>[]) {
    var concated = Linq.empty<T>();
    results.forEach(x => concated = concated.concat(x));
    return concated;
  }
  static concatPromiseResultsAry<T>(results: T[][]) {
    var concated = Linq.empty<T>();
    results.forEach(x => concated = concated.concat(x.asEnumerable()));
    return concated;
  }
}
