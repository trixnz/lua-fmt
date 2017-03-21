var gulp = require('gulp');
var tslint = require('gulp-tslint');
var shell = require('gulp-shell');
var concat = require('gulp-concat');

// var bump = require('gulp-bump')
// var git = require('gulp-git');
// var tag_version = require('gulp-tag-version');

var files = {
    src: './src/**/*.ts',
    outFiles: ['./dist/**/*.js', '!./dist/**/testPrinter.js']
}

// function bumpVersion(ver) {
//     return gulp.src(['./package.json'])
//         .pipe(bump({ type: ver }))
//         .pipe(gulp.dest('./'))
//         .pipe(git.commit('Bump package version'))
//         .pipe(tag_version());
// }

gulp.task('compile', shell.task([
    'npm run compile'
]));

gulp.task('tslint', function () {
    return gulp.src([files.src])
        .pipe(tslint({
            formatter: "verbose"
        }))
        .pipe(tslint.report())
});

gulp.task('scripts', function () {
    return gulp.src(files.outFiles)
        .pipe(concat('all.js'))
        .pipe(gulp.dest('./dist/'));
});

// gulp.task('patch', ['default'], function () { return bumpVersion('patch'); })
// gulp.task('minor', ['default'], function () { return bumpVersion('minor'); })
// gulp.task('major', ['default'], function () { return bumpVersion('major'); })

gulp.task('default', ['compile', 'tslint']);
