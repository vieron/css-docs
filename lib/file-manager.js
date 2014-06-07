;(function() {

    'use strict';

    var fs = require('fs-extra');
    var path = require('path');
    var util = require('util');

    var _  = require('lodash');
    var multimatch = require('multimatch');
    var glob = require('glob');

    var log = function(obj) {
        console.log('> ', util.inspect(obj, false, null));
    };




    function FileManager(opts) {
        this.opts = _.defaults(opts || {}, FileManager.defaults);
        this.init();
    }

    FileManager.defaults = {
        styleDir: 'assets/sass/',
        styleFileExt: ['.scss', '.css', '.sass', '.styl', '.less'],
        ignore: ['**/bourbon/**'],

        builtAssetsDir: 'assets/'
    };

    _.extend(FileManager.prototype, {
        init: function() {

        },

        _ignorePath: function(path) {
            return _.filter(this.opts.ignore, function(pattern) {
                return multimatch(path, pattern)[0];
            }).length;
        },

        copyAssets: function() {
            fs.copySync(path.join(__dirname, '../template/assets'), path.join(this.opts.docsAssetsPath));
            fs.removeSync(path.join(this.opts.docsAssetsPath, 'styl'));

            // copy final compiled, cleaned, minified, wathever..
            fs.copySync(path.join(this.opts.builtAssetsDir), path.join(this.opts.docsPath, 'assets'));

            return this;
        },

        read: function(dir) {
            dir || (dir = path.join(this.opts.styleDir));

            if (! fs.existsSync(dir)) { return []; }

            var dirContents = fs.readdirSync(dir);
            if (! dirContents) { return []; }

            var cssFiles = [];
            _.each(dirContents, function(val) {
                var ext = path.extname(val);
                var cssPath = path.join(dir, val);
                var stat = fs.lstatSync(cssPath);

                // skip if ignored by `ignore` config option
                if (this._ignorePath(cssPath)) {
                    return;
                }

                if (stat.isDirectory()) {
                    cssFiles = cssFiles.concat(this.read(cssPath));
                    return;
                }

                // skip if not a valid css extensions
                if (_.indexOf(this.opts.styleFileExt, ext) === -1) {
                    return;
                }

                cssFiles.push(cssPath);
            }, this);

            return cssFiles;
        },

        readFile: function(filePath) {
            return fs.readFileSync(filePath);
        },

        write: function(filePath, content) {
            return fs.outputFileSync(filePath, content);
        },

        removeDocs: function() {
            fs.removeSync(path.join(this.opts.docsPath, 'assets'));

            var  files = glob.sync(path.join(this.opts.docsPath, '**/*.html'));
            files = files.concat(glob.sync(path.join(this.opts.docsPath, '*/**')));
            files = multimatch(files, ['!.git', '!.gitignore']);

            _.each(files, function(file, a) {
                fs.removeSync(file);
            });
        }
    });




    module.exports = FileManager;

})();