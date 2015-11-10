var path = require('path');

var cdnRoot = 'cdn_source/'
var cdnOutRoot = 'cdn/'
var appRoot = cdnRoot + 'aurelia/';
var otherMiscRoot = cdnRoot + 'misc/';
var otherAppRoot = cdnRoot + 'app/';
var outputRoot = cdnOutRoot + 'aurelia/dist/';
var otherOutputRoot = cdnOutRoot;

module.exports = {
  realRoot: '',
  root: appRoot,
  cdnRoot: cdnRoot,
  cdnOutRoot: cdnOutRoot,
  source: appRoot + '**/*.js',
  tsSource: appRoot + '**/*.ts',
  otherSource: otherAppRoot + '**/*.js',
  otherMiscSource: otherMiscRoot + '**/*.js',
  html: appRoot + '**/*.html',
  style: outputRoot + 'styles/**/*.css',
  css: appRoot + '**/*.css',
  scss: appRoot + '**/*.scss',
  scssGlobal: cdnRoot + 'scss/**/*.scss',
  additionalPaths: [
    otherAppRoot + '**/*.html', otherAppRoot + '**/*.js', otherOutputRoot + 'css/**/*.css',
    otherOutputRoot + 'js/**/*.js', otherOutputRoot + 'data/**/*.json'],
  output: outputRoot,
  otherOutput: otherOutputRoot + 'app/dist/',
  otherMiscOutput: otherOutputRoot + 'misc/dist/',
  doc:'./doc',
  e2eSpecsSrc: 'test/e2e/src/*.js',
  e2eSpecsDist: 'test/e2e/dist/'
};
