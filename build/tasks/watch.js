var gulp = require('gulp');
var paths = require('../paths');
var browserSync = require('browser-sync');
var runSequence = require('run-sequence');

// outputs changes to files to the console
function reportChange(event){
  console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
}

// this task wil watch for changes
// to js, html, and css files and call the
// reportChange method. Also, by depending on the
// serve task, it will instantiate a browserSync session
gulp.task('watch-only', ['serve-only'], function() {
  for (var i in paths.additionalPaths) {
    var p = paths.additionalPaths[i];
    gulp.watch(p, browserSync.reload).on('change', reportChange);
  }
  //gulp.watch(paths.tsSource, ['scripts'])
  gulp.watch(paths.source, ['build-system', browserSync.reload]).on('change', reportChange);
  gulp.watch(paths.otherSource, ['build-other', browserSync.reload]).on('change', reportChange);
  gulp.watch(paths.otherMiscSource, ['build-misc', browserSync.reload]).on('change', reportChange);
  gulp.watch(paths.html, ['build-html', browserSync.reload]).on('change', reportChange);
  gulp.watch(paths.css, ['build-css', browserSync.reload]).on('change', reportChange);
  gulp.watch(paths.scss, ['build-scss']).on('change', reportChange);
  gulp.watch(paths.scssGlobal, ['build-scss']).on('change', reportChange);
  gulp.watch("index.html", ['build-html', browserSync.reload]).on('change', reportChange);
  gulp.watch(paths.style, browserSync.reload).on('change', reportChange);
});


gulp.task('watch', function() { runSequence('build', 'watch-only'); });
