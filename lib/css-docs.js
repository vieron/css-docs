;(function() {

    'use strict';

    var fs = require('fs-extra');
    var path = require('path');
    var util = require('util');

    var _  = require('lodash');
    var dotaccess = require('dotaccess');
    var Handlebars = require('handlebars');
    var stylus = require('stylus');

    var log = function(obj) {
        console.log('> ', util.inspect(obj, false, null));
    };




    function CSSDocs(opts) {
        this.opts = _.defaults(opts || {}, CSSDocs.defaults);
        this.init();
    }

    CSSDocs.CommentParser = require('./comment-parser');
    CSSDocs.FileManager = require('./file-manager');

    CSSDocs.defaults = {
        title: 'css-docs',
        logo: false,
        docsPath: 'docs/',
        docsAssetsPath: 'docs/assets/css-docs/'
    };

    _.extend(CSSDocs.prototype, {
        init: function() {
            this.commentParser = new CSSDocs.CommentParser(this.opts);
            this.fileManager = new CSSDocs.FileManager(this.opts);

            // TODO: move this to a compileTemplates method (templateFolder must be configurable)
            var block_tpl_content = fs.readFileSync(path.join('./../template/doc-block.hbs'));
            var nav_tpl_content = fs.readFileSync(path.join('./../template/navigation.hbs'));
            var layout_tpl_content = fs.readFileSync(path.join('./../template/layout.hbs'));
            this.tpl_block = Handlebars.compile(block_tpl_content.toString());
            this.tpl_layout = Handlebars.compile(layout_tpl_content.toString());
            this.tpl_nav = Handlebars.compile(nav_tpl_content.toString());
        },

        run: function() {
            var blocks = this.commentParser.parse();
            var cssFiles = this.fileManager.read();
            var data = {};
            _.each(cssFiles, function(cssPath) {
                data[cssPath] = this.commentParser.parseFile(cssPath);
            }, this);

            this.hierarchize(data).generateDocs();
        },

        hierarchize: function(data) {
            this.tree = {};

            // TODO: note that comment blocks without `@styleguide` directive are
            // not included here.
            _.each(data, function(blocks, filePath) {
                if (! blocks.length) { return; }

                _.each(blocks, function(block) {
                    if (! block.styleguide) { return; }

                    var dotPath = block.styleguide.replace(/\./g, '.childs.');

                    // TODO: maybe this should be moved to CommentParser
                    block.filePath = filePath;
                    block.absoluteFilePath = path.resolve(filePath);
                    block.treePath = dotPath;

                    // TODO: warn if overwriting styleguide rule (if it's being overwrited)
                    dotaccess.set(this.tree, dotPath, block);
                }, this);
            }, this);

            return this;
        },

        removeDocs: function() {
            fs.removeSync(path.join(this.opts.docsPath));
            return this;
        },

        generateDocs: function() {
            this.removeDocs();
            this.generateDocPages();

            this.fileManager.copyAssets();
            this.compileDocsStyles();
        },

        generateDocPages: function(tree) {
            tree || (tree = this.tree);
            var docsPath = path.join(this.opts.docsPath);

            _.each(tree, function(block, key) {
                var deepFileName, pagePath;

                if (block.childs) {
                    this.generateDocPages(block.childs);
                }

                block.name = _.capitalize(key);

                if (! block.styleguide) { return; }

                deepFileName = block.styleguide.replace(/\./g, '/') + '.html';
                pagePath = path.join(this.opts.docsPath, deepFileName);

                block.markup && Handlebars.registerPartial('markup', block.markup);
                this.generateReferenceLinks('depends', block, pagePath);
                this.generateReferenceLinks('extends', block, pagePath);

                // needs to be created after childs generation
                this._buildPage(pagePath, {
                    body: this.tpl_block(block),
                    breadcrumbs: this.getBreadcrumbs(block, pagePath)
                });

                console.log('Generated page for:', block.name, 'in:', pagePath);
            }, this);

            this.generateIndex();

            return this;
        },

        _buildPage: function(pagePath, content) {
            var docsPath = path.join(this.opts.docsPath);

            var relativePathtoDocsRoot = this._ensureRelativePath(
                path.relative(path.dirname(pagePath), docsPath));

            var tplData = _.extend({
                title: this.opts.title,
                relativePath: relativePathtoDocsRoot,
                nav: this.generateNav(pagePath)
            }, content || {});

            var fileContent = this.tpl_layout(tplData);

            this.fileManager.write(pagePath, fileContent);
        },

        generateIndex: function() {
            var pagePath = path.join(this.opts.docsPath, 'index.html');

            this._buildPage(pagePath);

            return this;
        },

        _ensureRelativePath: function(relativePath) {
            return relativePath ? relativePath + '/' : '';
        },

        getRelativePathFromDotNotation: function(dotPath, pagePath) {
            var destinationPath = path.join(this.opts.docsPath, dotPath.replace(/\./g, '/') + '.html');
            return path.relative(path.dirname(pagePath), destinationPath);
        },

        getRelativeLinkFromDotNotation: function(dotPath, pagePath) {
            var href = this.getRelativePathFromDotNotation(dotPath, pagePath);
            var name = _(dotPath).strRightBack('.').capitalize().value();
            return '<a href="' + href + '">' + name + '</a>';
        },

        generateReferenceLinks: function(attr, block, pagePath) {
            if (!block[attr] || (block[attr] && ! block[attr].length)) {
                return;
            }

            var linkList = _.map(block[attr], function(dotPath) {
                return '<li>' + this.getRelativeLinkFromDotNotation(dotPath, pagePath) + '</li>';
            }, this).join('\n');

            block[attr + '_html'] = '<ul>' + linkList + '</ul>';
        },

        getBreadcrumbs: function(block, pagePath) {
            var paths = block.styleguide.split('.');

            return _.map(paths, function(name, i) {
                var dotPath = paths.slice(0, i + 1).join('.');
                return this.getRelativeLinkFromDotNotation(dotPath, pagePath);
            }, this).join(' &raquo; ');
        },

        generateNav: function(currentPath, tree) {
            tree || (tree = this.tree);

            var links = [];
            _.each(tree, function(block, key) {
                var deepFileName = (block.styleguide ?
                    block.styleguide.replace(/\./g, '/') : key) + '.html';
                var pagePath = path.join(this.opts.docsPath, deepFileName);
                var childs = '';

                if (block.childs) {
                    childs = this.generateNav(currentPath, block.childs);
                }

                links.push({
                    title: _.capitalize(key),
                    href: path.relative(path.dirname(currentPath), pagePath),
                    childs: childs,
                    pageExists: !! block.styleguide,
                    isCurrent: currentPath === pagePath
                });
            }, this);

            return this.tpl_nav({links: links});
        },

        compileDocsStyles: function() {
            var stylPath = path.join('./../template/assets/styl/css-docs.styl');
            var styl = this.fileManager.readFile(stylPath);

            stylus.render(styl.toString(), {
                filename: path.basename(stylPath)
            }, function(err, css) {
                if (err) console.log(err);

                var cssPath = path.join(this.opts.docsAssetsPath, 'css/css-docs.css');
                this.fileManager.write(cssPath, css);

            }.bind(this));
        }
    });




    module.exports = CSSDocs;

})();