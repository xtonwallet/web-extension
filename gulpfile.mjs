import gulp from 'gulp';
import imagemin from 'gulp-imagemin';
import rename from 'gulp-rename';
import replace from 'gulp-replace';
import jsoneditor from 'gulp-json-editor';
import zip from 'gulp-zip';
import del from 'del';
import { readFileSync } from 'fs';
const manifest = JSON.parse(readFileSync('./src/manifest.json'));

const browserPlatforms = [
  'firefox',
  'chrome',
  'edge',
  'opera',
  'safari'
];

// copy universal
const copyTaskNames = [];

createCopyTasks('pure_dist', {
  source: './dist/',
  destinations: browserPlatforms.map((platform) => `./builds/${platform}`),
});

function createCopyTasks (label, opts) {
  const copyTaskName = `copy:${label}`;
  copyTask(copyTaskName, opts);
  copyTaskNames.push(copyTaskName);
}

function copyTask (taskName, opts) {
  const source = opts.source;
  const destination = opts.destination;
  const destinations = opts.destinations || [destination];
  const pattern = opts.pattern || '/**/*';

  return gulp.task(taskName, function () {
    return performCopy();
  });

  function performCopy () {
    // stream from source
    let stream = gulp.src(source + pattern, { base: source });

    // copy to destinations
    destinations.forEach(function (destination) {
      stream = stream.pipe(gulp.dest(destination));
    });

    return stream;
  }
}

// task generators
function zipTask (target) {
  return () => {
    return gulp.src(`./builds/${target}/**`)
      .pipe(zip(`ext-${target}-${manifest.version}.zip`))
      .pipe(gulp.dest('./builds'));
  };
}

// clean dist
gulp.task('clean', function clean () {
  return del(['./builds/*']);
});

// manifest tinkering
gulp.task('manifest:chrome', function () {
  return gulp.src('./builds/chrome/manifest.json')
    .pipe(jsoneditor(function (json) {
      json.minimum_chrome_version = '88';
      return json;
    }))
    .pipe(gulp.dest('./builds/chrome', { overwrite: true }));
});

gulp.task('manifest:firefox', function () {
  return gulp.src('./builds/firefox/manifest.json')
    .pipe(jsoneditor(function (json) {
      json.browser_specific_settings = {
        "gecko": {
          "id": "askme@xtonwallet.com",
          "strict_min_version": "107.0"
        }
      };
      return json;
    }))
    .pipe(gulp.dest('./builds/firefox', { overwrite: true }));
});

gulp.task('manifest:opera', function () {
  return gulp.src('./builds/opera/manifest.json')
    .pipe(jsoneditor(function (json) {
      delete json.short_name;
      return json;
    }))
    .pipe(gulp.dest('./builds/opera', { overwrite: true }));
});

gulp.task('optimize:images', function () {
  return gulp.src('./builds/**/images/**', { base: './builds/' })
    .pipe(imagemin())
    .pipe(gulp.dest('./builds/', { overwrite: true }));
});

gulp.task('delete:development', function () {
  return del(
    browserPlatforms.map((platform) => `./builds/${platform}/livereload.js`)
      .concat(browserPlatforms.map((platform) => `./builds/${platform}/chromereload.js`))
      .concat(browserPlatforms.map((platform) => `./builds/${platform}/*.css.map`))
  );
});

gulp.task('copy',
  gulp.series(
    gulp.parallel(...copyTaskNames),
    'manifest:firefox',
    'manifest:chrome',
    'manifest:opera',
  )
);

// zip tasks for distribution
gulp.task('zip:chrome', zipTask('chrome'));
gulp.task('zip:firefox', zipTask('firefox'));
gulp.task('zip:opera', zipTask('opera'));
gulp.task('zip:edge', zipTask('edge'));
gulp.task('zip:safari', zipTask('safari'));
gulp.task('zip', gulp.parallel('zip:chrome', 'zip:firefox', 'zip:opera', 'zip:edge', 'zip:safari'));

// high level tasks
gulp.task('build',
  gulp.series(
    'clean',
    'copy',
    'optimize:images',
    'delete:development',
    'zip'
  )
);

// clean mobile dist
gulp.task('clean:mobile', function clean_mobile () {
  return del(['./builds/mobile*']);
});

// create mobile version
gulp.task('mobile:polyfill', 
  gulp.series(
    function mobile_polyfill () {
      return gulp.src('./tools/mobile-polyfill.js')
        .pipe(rename('browser-polyfill.js'))
        .pipe(gulp.dest('./builds/mobile/', { overwrite: true }));
    },
    function mobile_background () {
      return gulp.src('./tools/background.html')
        .pipe(gulp.dest('./builds/mobile/', { overwrite: true }));
    }
  )
);

// replace pathes for mobile version
gulp.task('mobile:assets', 
  gulp.series(
    function replace_js() {
      return gulp.src('./builds/mobile/*.js')
        .pipe(replace('/assets/', '/assets/wallet-js/assets/'))
        .pipe(gulp.dest('./builds/mobile/', { overwrite: true }));
    },
    function replace_css() {
      return gulp.src('./builds/mobile/*.css')
        .pipe(replace('./', '/assets/wallet-js/'))
        .pipe(replace('(assets/', '(/assets/wallet-js/'))
        .pipe(gulp.dest('./builds/mobile/', { overwrite: true }));
    }
  )
);

copyTask('copy:mobile', {
  source: './dist/',
  destination: './builds/mobile',
});

gulp.task('optimize:images:mobile', function () {
  return gulp.src('./builds/mobile/images/**', { base: './builds/' })
    .pipe(imagemin())
    .pipe(gulp.dest('./builds/', { overwrite: true }));
});

gulp.task('delete:development:mobile', function () {
  return del(['./builds/mobile/livereload.js',
              './builds/mobile/chromereload.js',
              './builds/mobile/*.css.map'
              ]);
});

// high level tasks
gulp.task('mobile',
  gulp.series(
    'clean:mobile',
    'copy:mobile',
    'mobile:polyfill',
    'mobile:assets',
    'optimize:images:mobile',
    'delete:development:mobile',
  )
);

// patch version in manifest
gulp.task('patchVersion', function () {
  return gulp.src('./src/manifest.json')
    .pipe(jsoneditor(function (json) {
      const lastIndex = json.version.lastIndexOf(".");
      json.version = json.version.substr(0, lastIndex) + "." + (new Number(json.version.substr(lastIndex + 1)) + 1);
      return json;
    }))
    .pipe(gulp.dest('./src/', { overwrite: true }));
});
