var gulp = require('gulp');
var runSequence = require('run-sequence');
var bundler = require('aurelia-bundler');
var paths = require('../paths');

// var config = {
//   force: true,
//   packagePath: ".",
//   bundles: {
//     "dist/app-build": {
//       includes: [
//         '**/*'
//       ],
//       excludes: [
//         'aurelia.js'
//       ],
//       options: {
//         inject: true,
//         minify: true
//       }
//     },
//     "dist/aurelia": {
//       includes: [
//         'aurelia-bootstrapper',
//         'aurelia-computed',
//         'aurelia-html-import-template-loader',
//         'aurelia-fetch-client',
//         'aurelia-router',
//         'aurelia-animator-css',
//         'github:aurelia/templating-binding',
//         'github:aurelia/templating-resources',
//         'github:aurelia/templating-router',
//         'github:aurelia/loader-default',
//         'github:aurelia/history-browser',
//         'github:aurelia/logging-console'
//       ],
//       options: {
//         inject: true,
//         minify: true
//       }
//     },
//     "dist/view-bundle": {
//       htmlimport: true,
//       includes: 'dist/**/*.html',
//       options: {
//         inject: {
//           indexFile : '../../index.html',
//           destFile : 'dest_index.html',
//         }
//       }
//     }
//   }
// };

var aurConfig = {
  force: true,
  packagePath: ".",
  bundles: {
    "dist/aurelia": {
      includes: [
        // TODO: How to html and css?
//        'aurelia-*',
        'npm:rx@*', // rx etc
        'github:*/*',
        'github:*/**/*.html!text',
        'github:*/**/*.css!text'
      ],
      excludes: [
        'github:twbs/bootstrap@*'
      ],
      options: {
        inject: false,
        minify: true,
        sourceMaps: true
      }
    }
  }
};


var devConfig = {
  force: true,
  packagePath: ".",
  bundles: {
    "dist/app-build": {
      includes: [
        '*',
        '*.html!text',
        '*.css!text',
        '*/**/*',
        '*/**/*.html!text',
        '*/**/*.css!text',
      ],
      excludes: [
        'npm:*',
        'github:*',
        'github:*/*'
      ],
      // excludes: [
      //   'aurelia.*',
      //   'app-build.*',
      //   'github:*',
      //   'github:*/**/*'
      // ],
      options: {
        inject: false,
        minify: true,
        sourceMaps: true
      }
    }
  }
};

// var devViewsConfig = {
//   force: true,
//   packagePath: ".",
//   bundles: {
//     "dist/view-bundle": {
//       htmlimport: true,
//       includes: 'dist/**/*.html',
//       options: {
//         inject: false
//         // inject: {
//         //   indexFile : '../../index.html',
//         //   destFile : 'dest_index.html',
//         // }
//       }
//     }
//   }
// };

var curDir = process.cwd();

gulp.task('bundle', function(callback) {
  return runSequence(
    ['bundleDev', 'bundleAur'],
    callback
  );
});
gulp.task('bundleDev', function(callback) {
  return runSequence(
    // these should actually run in sequence because of overlapping config.js editing, however they will unlikely finish at the same time so we run them parallel anyway..
    ['bundleDevJs'], // , 'bundleDevViews'
    callback
  );
});
gulp.task('bundleChDir', function() {
  process.chdir(paths.cdnOutRoot + "aurelia");
});

gulp.task('bundleChDirBack', function() {
  process.chdir(curDir);
});

gulp.task('bundleDevJs', ['bundleChDir'], function() {
return bundler.bundle(devConfig);
});

// gulp.task('bundleDevViews', ['bundleChDir'], function() {
//  return bundler.bundle(devViewsConfig);
// });

gulp.task('bundleAur', ['bundleChDir'], function() {
 return bundler.bundle(aurConfig);
});

gulp.task('unbundle', function(callback) {
  return runSequence(
    ['unbundleDev', 'unbundleAur'],
    callback
  );
});
gulp.task('unbundleDev', function(callback) {
  return runSequence(
    ['unbundleDevJs'], // , 'unbundleDevViews'
    callback
  );
});
gulp.task('unbundleDevJs', ['bundleChDir'], function() {
return bundler.unbundle(devConfig);
});

// gulp.task('unbundleDevViews', ['bundleChDir'], function() {
//  return bundler.unbundle(devViewsConfig);
// });

gulp.task('unbundleAur', ['bundleChDir'], function() {
 return bundler.unbundle(aurConfig);
});
