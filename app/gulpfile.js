"use strict";

// Load plugins
const gulp = require('gulp');
const sass = require('gulp-sass');
const cleanCSS = require('gulp-clean-css');
const rename = require("gulp-rename");
const uglify = require('gulp-uglify');
const merge = require("merge-stream");
const del = require("del");
const browsersync = require('browser-sync').create();

// BrowserSync
function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "./build"
    },
    port: 3000
  });
  done();
}

// Clean build folder
function clean() {
  return del(["./build/"]);
}

// Bring third party dependencies from node_modules into vendor directory
function modules() {
  // Bootstrap
  var bootstrap = gulp.src([
    './node_modules/bootstrap/dist/**/*',
    '!./node_modules/bootstrap/dist/css/bootstrap-grid*',
    '!./node_modules/bootstrap/dist/css/bootstrap-reboot*'
  ])
  .pipe(gulp.dest('./build/vendor/bootstrap'));

  // jQuery
  var jquery = gulp.src([
    './node_modules/jquery/dist/*',
    '!./node_modules/jquery/dist/core.js'
  ])
  .pipe(gulp.dest('./build/vendor/jquery'))

  // jQuery Easing
  var jqueryEasing = gulp.src([
    './node_modules/jquery.easing/*.js'
  ])
  .pipe(gulp.dest('./build/vendor/jquery-easing'))

  // Simple Line Icons
  var simpleLineIconsFonts = gulp.src([
    './node_modules/simple-line-icons/fonts/**',
  ])
  .pipe(gulp.dest('./build/vendor/simple-line-icons/fonts'))

  var simpleLineIconsCss = gulp.src([
    './node_modules/simple-line-icons/css/**',
  ])
  .pipe(gulp.dest('./build/vendor/simple-line-icons/css'))

  return merge(bootstrap, jquery, jqueryEasing, simpleLineIconsFonts, simpleLineIconsCss);
}

// CSS task
function css() {
  return gulp
    .src('./scss/**/*.scss')
      .pipe(sass.sync({
        outputStyle: 'expanded'
      }).on('error', sass.logError))
      .pipe(rename({
        suffix: ".min"
      }))
      .pipe(cleanCSS())
      .pipe(gulp.dest('./build/css'))
      .pipe(browsersync.stream());
}

// JS task
function js() {
  return gulp
    .src([
      './js/*.js'
    ])
    .pipe(uglify())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('./build/js'))
    .pipe(browsersync.stream());
}

// IMG task
function img() {
  return gulp
    .src([
      './img/**/*'
    ])
    .pipe(gulp.dest('./build/img'))
    .pipe(browsersync.stream());
}

// HTML task
function html() {
  return gulp
    .src([
      './index.html'
    ])
    .pipe(gulp.dest('./build'))
    .pipe(browsersync.stream());
}

// favicon task
function favicon() {
  return gulp
    .src([
      './favicon.ico'
    ])
    .pipe(gulp.dest('./build'))
    .pipe(browsersync.stream());
}

// watch files
function watchFiles() {
  gulp.watch('./scss/**/*', css);
  gulp.watch('./js/**/*', js);
  gulp.watch('./*.html', html);
  gulp.watch('./img/**/*', img);
  gulp.watch('./favicon.ico', favicon);
}

// define complex tasks
const vendor = gulp.series(clean, modules);
// const build = gulp.series(clean);
const build = gulp.series(vendor, gulp.parallel(css, js, img, html, favicon));
const dev = gulp.parallel(watchFiles, browserSync);

// export tasks
exports.build = build;
exports.dev = dev;
exports.default = build;