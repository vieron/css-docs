;(function() {

    'use strict';

    var fs = require('fs-extra');
    var path = require('path');
    var util = require('util');

    var _  = require('lodash');
    var dotaccess = require('dotaccess');
    var stylus = require('stylus');
    var CSSOM = require('cssom');

    var log = function(obj) {
        console.log('> ', util.inspect(obj, false, null));
    };


    function CSSDocs(opts) {
        this.opts = _.defaults(opts || {}, CSSDocs.defaults);
        this.init();
    }

    CSSDocs.CommentParser = require('./comment-parser');
    CSSDocs.FileManager = require('./file-manager');
    CSSDocs.DocGenerator = require('./doc-generator');

    CSSDocs.defaults = {
        title: 'css-docs',
        logo: false,
        docsPath: 'docs/',
        docsAssetsPath: 'docs/assets/css-docs/',
        builtCSSPath: 'css/built.css',
        templatePath: path.join(__dirname, '../template/')
    };

    _.extend(CSSDocs.prototype, {
        init: function() {
            this.commentParser = new CSSDocs.CommentParser(this.opts);
            this.fileManager = new CSSDocs.FileManager(this.opts);
            this.docGenerator = new CSSDocs.DocGenerator(this, this.opts);

            this.docsPath = path.join(this.opts.docsPath);
            this.builtCSSPath = 'assets/' + this.opts.builtCSSPath;
            this.templatePath = path.join(this.opts.templatePath);
        },

        run: function() {
            var blocks = this.commentParser.parse();
            var cssFiles = this.fileManager.read();
            var data = {};
            _.each(cssFiles, function(cssPath) {
                data[cssPath] = this.commentParser.parseFile(cssPath);
            }, this);

            this.hierarchize(data);
            this.generateDocs();
        },

        hierarchize: function(data) {
            this.tree = {};
            this.blocks = [];

            // Note that comment blocks without `@styleguide` directive are
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

                    this.blocks.push(block);

                    // TODO: warn if overwriting styleguide rule (if it's being overwrited)
                    dotaccess.set(this.tree, dotPath, block);
                }, this);
            }, this);

            return this;
        },

        generateDocs: function() {
            this.fileManager.removeDocs();
            this.docGenerator.run();

            this.fileManager.copyAssets();
            this.replacePseudoElements();
            this.compileDocsStyles();
        },

        compileDocsStyles: function() {
            var stylPath = path.join(this.templatePath, 'assets/styl/css-docs.styl');
            var styl = this.fileManager.readFile(stylPath);


            stylus(styl.toString())
                .set('filename', stylPath)
                .set('paths', [path.join(this.templatePath, 'assets/styl')])
                .render(function(err, css) {
                    if (err) console.log(err);

                    var cssPath = path.join(this.opts.docsAssetsPath, 'css/css-docs.css');
                    css = css.replace(/!important/g, '').replace(/\;/g, ' !important;');
                    this.fileManager.write(cssPath, css);

                }.bind(this));
        },

        replacePseudoElements: function() {
            // This is totally inspired from kss-node but done in server-side
            // with cssom. https://github.com/hughsk/kss-node/blob/master/lib/template/public/kss.js
            var pseudos = /(\:hover|\:disabled|\:active|\:visited|\:focus)/g;
            var cssPath = path.join(this.docsPath, this.builtCSSPath);
            var css = fs.readFileSync(cssPath);
            var cssom = CSSOM.parse(css.toString());
            var replaceRule, newRules = [];

            _.each(cssom.cssRules, function(rule) {
                if (rule.style && rule.selectorText && pseudos.test(rule.selectorText)) {
                    replaceRule = function(matched, stuff) {
                        return ".pseudo-class-" + matched.replace(':', '');
                    };
                    newRules.push(rule.cssText.replace(pseudos, replaceRule));
                }
            });

            _.each(newRules, function(ruleText) {
                cssom.insertRule(ruleText);
            });

            this.fileManager.write(cssPath, cssom.toString());
        }
    });


    module.exports = CSSDocs;

})();