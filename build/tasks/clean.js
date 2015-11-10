var gulp = require('gulp');
var paths = require('../paths');
var del = require('del');
var vinylPaths = require('vinyl-paths');
var runSequence = require('run-sequence');

function map(p) {
  return p + '.map';
}

gulp.task('clean-scripts', function() {
  return gulp.src([paths.source, paths.otherSource, paths.otherMiscSource, map(paths.source), map(paths.otherSource), map(paths.otherMiscSource)])
    .pipe(vinylPaths(del))
})

gulp.task('clean-css', function() {
  return gulp.src([paths.css, map(paths.css)])
    .pipe(vinylPaths(del))
})

// deletes all files in the output path
gulp.task('clean-system', function() {
  return gulp.src([paths.output])
    .pipe(vinylPaths(del));
});

gulp.task('clean-other', function() {
  return gulp.src([paths.otherOutput])
    .pipe(vinylPaths(del));
});

gulp.task('clean-misc', function() {
  return gulp.src([paths.otherMiscOutput])
    .pipe(vinylPaths(del));
});

gulp.task('clean', function(callback) {
  return runSequence(
    'unbundle',
    'bundleChDirBack',
    ['clean-css', 'clean-system', 'clean-other', 'clean-misc'],
    callback
  );
});
