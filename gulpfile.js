const gulp = require("gulp");

const del = require("del");
const nls = require("vscode-nls-dev");
const webpack = require("webpack-stream");

const inlineMap = true;
const inlineSource = false;
const outDest = "out";

const languages = [{ id: "zh-cn", folderName: "chs" }];

const cleanTask = function () {
  return del(["out/**", "package.nls.*.json"]);
};

const addI18nTask = function () {
  return gulp
    .src(["package.nls.json"])
    .pipe(nls.createAdditionalLanguageFiles(languages, "i18n"))
    .pipe(gulp.dest("."));
};

const nlsCompileTask = function () {
  var r = gulp
    .src("src/extension.ts")
    .pipe(
      webpack({
        devtool: "source-map",
        target: "electron-main",
        output: {
          filename: "extension.js",
          libraryTarget: "commonjs2",
        },
        module: {
          rules: [
            {
              test: /\.(ts)$/i,
              loader: "ts-loader",
              exclude: ["/node_modules/"],
            },
          ],
        },
        resolve: {
          extensions: [".ts", ".js"],
        },
        externals: {
          vscode: "commonjs vscode", // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
        },
      })
    )
    .pipe(nls.rewriteLocalizeCalls())
    .pipe(nls.createAdditionalLanguageFiles(languages, "i18n", "out"));

  return r.pipe(gulp.dest(outDest));
};

const buildTask = gulp.series(cleanTask, nlsCompileTask, addI18nTask);

const watchTask = function () {
  buildTask();
  return gulp.watch(["src/**", "i18n/**"], function (cb) {
    buildTask();
    cb();
  });
};

gulp.task("default", buildTask);

gulp.task("build", buildTask);

gulp.task("watch", watchTask);
