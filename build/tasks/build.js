var gulp = require('gulp');
var runSequence = require('run-sequence');
var changed = require('gulp-changed');
var plumber = require('gulp-plumber');
var to5 = require('gulp-babel');
var sourcemaps = require('gulp-sourcemaps');
var ts = require('gulp-typescript');
var paths = require('../paths');
var compilerOptions = require('../babel-options');
var assign = Object.assign || require('object.assign');
var merge = require('merge2');

var gulp = require('gulp');
var sass = require('gulp-sass');

gulp.task('build-scss', function () {
  gulp.src(paths.scss)
  .pipe(sourcemaps.init())
  .pipe(sass({
    sourceMap: true,
    outputStyle: 'compressed',
    includePaths: ['cdn_source/scss', 'cdn/bower_components/compass-mixins/lib', 'cdn/bower_components/bootstrap-sass-xl/assets/stylesheets']
  }).on('error', sass.logError))
  .pipe(sourcemaps.write())
  .pipe(gulp.dest(paths.root));
});

var tsProject = ts.createProject(paths.realRoot + 'tsconfig.json');
gulp.task('scripts', ['clean-scripts'], function() {
    var tsResult = tsProject.src() //tsProject.src() // instead of gulp.src(...)
        .pipe(sourcemaps.init())
        .pipe(ts(tsProject));

        return merge([ // Merge the two output streams, so this task is finished when the IO of both operations are done.
                      tsResult.js
           .pipe(sourcemaps.write())
           .pipe(gulp.dest(paths.realRoot)),
           tsResult.dts.pipe(gulp.dest(paths.realRoot)),
       ]);
    //return tsResult.js.pipe(gulp.dest(paths.root));
});

// copies changed css files to the output directory
gulp.task('build-css', function () {
  return gulp.src(paths.css)
    .pipe(changed(paths.output, {extension: '.css'}))
    .pipe(gulp.dest(paths.output));
});

// transpiles changed es6 files to SystemJS format
// the plumber() call prevents 'pipe breaking' caused
// by errors from other gulp plugins
// https://www.npmjs.com/package/gulp-plumber
gulp.task('build-system', function () {
  return gulp.src(paths.source)
    .pipe(plumber())
    .pipe(changed(paths.output, {extension: '.js'}))
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(to5(assign({}, compilerOptions, {modules:'system'})))
    .pipe(sourcemaps.write({includeContent: true}))
    .pipe(gulp.dest(paths.output));
});

gulp.task('build-misc', function () {
  var source = paths.otherMiscSource;
  var output = paths.otherMiscOutput;
  return gulp.src(source)
    .pipe(plumber())
    .pipe(changed(output, {extension: '.js'}))
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(to5(assign({}, compilerOptions, {modules:'ignore'})))
    .pipe(sourcemaps.write({includeContent: true}))
    .pipe(gulp.dest(output));
});

gulp.task('build-other', function () {
  var source = paths.otherSource;
  var output = paths.otherOutput;
  return gulp.src(source)
    .pipe(plumber())
    .pipe(changed(output, {extension: '.js'}))
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(to5(assign({}, compilerOptions, {modules:'ignore'})))
    .pipe(sourcemaps.write({includeContent: true}))
    .pipe(gulp.dest(output));
});

// copies changed html files to the output directory
gulp.task('build-html', function () {
  return gulp.src(paths.html)
    .pipe(changed(paths.output, {extension: '.html'}))
    .pipe(gulp.dest(paths.output));
});

// this task calls the clean task (located
// in ./clean.js), then runs the build-system
// and build-html tasks in parallel
// https://www.npmjs.com/package/gulp-run-sequence
gulp.task('build', function(callback) {
  return runSequence(
    'clean',
    ['scripts', 'build-scss'],
    ['build-system', 'build-html', 'build-other', 'build-misc', 'build-css'],
    callback
  );
});
