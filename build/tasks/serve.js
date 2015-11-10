var gulp = require('gulp');
var browserSync = require('browser-sync');
var runSequence = require('run-sequence');

historyApiFallback = require('connect-history-api-fallback')

// this task utilizes the browsersync plugin
// to create a dev server instance
// at http://localhost:9000
gulp.task('serve-only', function(done) {
  runSequence(['srv1', 'srv2'], done);
});

gulp.task('serve', function() { runSequence('build', 'serve-only'); });

gulp.task('srv1', function(done) {
  browserSync.create().init({
    open: "external",
    port: 9000, // 80
    host: "local.withsix.net",
    online: true,
    server: {
      baseDir: ['.'],
      middleware: [historyApiFallback(),
        function (req, res, next) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          next();
        }]
    },
    ui: {
      port: 8081
    }
  }, done);
});

gulp.task('srv2', function(done) {
  browserSync.create().init({
    open: false,
    https: {
        key: "local.withsix.net.key",
        cert: "local.withsix.net.crt"
    },
    port: 9001, // 443
    host: "local.withsix.net",
    online: true,
    server: {
      baseDir: ['.'],
      middleware: [historyApiFallback(),
        function (req, res, next) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          next();
        }]
    },
    ui: {
      port: 8082
    }
  }, done);
})
