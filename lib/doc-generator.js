;(function() {

    'use strict';

    var fs = require('fs-extra');
    var path = require('path');
    var util = require('util');

    var _  = require('lodash');

    var includeHelper = require('./helpers/include');

    var log = function(obj) {
        console.log('> ', util.inspect(obj, false, null));
    };




    function DocGenerator(cssdocs, opts) {
        this.opts = _.defaults(opts || {}, DocGenerator.defaults);
        this.cssdocs = cssdocs;
        this.init();
    }

    DocGenerator.defaults = {};


    _.extend(DocGenerator.prototype, {
        init: function() {
            this.Handlebars = this.cssdocs.constructor.CommentParser.Handlebars;
            this.compileTemplates();
        },

        run: function() {
            includeHelper.register(this.Handlebars, this.cssdocs.tree);
            this.generateDocPages();
        },

        compileTemplates: function() {
            var block_tpl_content = fs.readFileSync(path.join(this.opts.templatePath, 'doc-block.hbs'));
            var nav_tpl_content = fs.readFileSync(path.join(this.opts.templatePath, 'navigation.hbs'));
            var layout_tpl_content = fs.readFileSync(path.join(this.opts.templatePath, 'layout.hbs'));

            this.tpl_block = this.Handlebars.compile(block_tpl_content.toString());
            this.tpl_layout = this.Handlebars.compile(layout_tpl_content.toString());
            this.tpl_nav = this.Handlebars.compile(nav_tpl_content.toString());
        },

        generateDocPages: function(tree) {
            tree || (tree = this.cssdocs.tree);

            _.each(tree, this.generateDocPage, this);
            this.generateIndex();
            return this;
        },

        generateDocPage: function(block, key) {
            if (block.childs) {
                this.generateDocPages(block.childs);
            }

            block.name = _.capitalize(key);

            if (! block.styleguide) { return; }

            var deepFileName = block.styleguide.replace(/\./g, '/') + '.html';
            var pagePath = path.join(this.opts.docsPath, deepFileName);

            if (block.markup) {
                this.cssdocs.commentParser.compileMarkup(block);
                this.Handlebars.registerPartial('markup', block.markup_original);
            }

            this.generateReferenceLinks('depends', block, pagePath);
            this.generateReferenceLinks('extends', block, pagePath);

            // needs to be created after childs generation
            this._buildPage(pagePath, {
                body: this.tpl_block(block),
                breadcrumbs: this.getBreadcrumbs(block, pagePath)
            });

            console.log('Generated page for:', block.name, 'in:', pagePath);
            return this;
        },

        generateIndex: function() {
            var pagePath = path.join(this.opts.docsPath, 'index.html');

            this._buildPage(pagePath);

            return this;
        },

        getRelativePathFromDotNotation: function(dotPath, pagePath) {
            var destinationPath = path.join(this.opts.docsPath, dotPath.replace(/\./g, '/') + '.html');
            return path.relative(path.dirname(pagePath), destinationPath);
        },

        getRelativeLinkFromDotNotation: function(dotPath, pagePath) {
            var href = this.getRelativePathFromDotNotation(dotPath, pagePath);
            var name = _(dotPath).strRightBack('.').capitalize().value();

            if (this.pageExists(dotPath)) {
                return '<a href="' + href + '">' + name + '</a>';
            } else {
                return '<span>' + name + '</span>';
            }
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

        pageExists: function(dotPath) {
            return _(this.cssdocs.blocks).pluck('styleguide').contains(dotPath);
        },

        getBreadcrumbs: function(block, pagePath) {
            var paths = block.styleguide.split('.');

            return _.map(paths, function(name, i) {
                var dotPath = paths.slice(0, i + 1).join('.');
                return this.getRelativeLinkFromDotNotation(dotPath, pagePath);
            }, this).join('<span class="cssd-separator"> &raquo; </span>');
        },

        generateNav: function(currentPath, tree) {
            tree || (tree = this.cssdocs.tree);

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

        _ensureRelativePath: function(relativePath) {
            return relativePath ? relativePath + '/' : '';
        },

        _getPageData: function(pagePath) {
            var relativePathtoDocsRoot = this._ensureRelativePath(
                path.relative(path.dirname(pagePath), this.opts.docsPath));

            return {
                title: this.opts.title,
                relativePath: relativePathtoDocsRoot,
                builtCSSPath: this.cssdocs.builtCSSPath,
                nav: this.generateNav(pagePath)
            };
        },

        _buildPage: function(pagePath, content) {
            var tplData = _.extend(this._getPageData(pagePath), content || {});

            var fileContent = this.tpl_layout(tplData);

            this.cssdocs.fileManager.write(pagePath, fileContent);
        }
    });

    module.exports = DocGenerator;

})();