;(function() {

    'use strict';

    var fs = require('fs');
    var path = require('path');
    var util = require('util');

    var _  = require('lodash');
    _.str = require('underscore.string');
    _.mixin(_.str.exports());

    var Handlebars = require('./hbs-helpers.js');
    var scrawl  = require('scrawl');
    var hljs = require('highlight.js');
    var marked = require('marked');

    var log = function(obj) {
        console.log('> ', util.inspect(obj, false, null));
    };




    function CommentParser(opts) {
        this.opts = _.defaults(opts || {}, CommentParser.defaults);
        this.init();
    }

    CommentParser.Handlebars = Handlebars;

    CommentParser.defaults = {};

    CommentParser.translatorHelpers = {
        _keyValue: function(val) {
            _.isArray(val) || (val = [val]);

            return _.map(val, function(modifier) {
                var i = _.indexOf(modifier, ' ');
                var words = _.words(modifier).length;
                var name = '', description = '';

                // if only one word, infer its a name and description is empty
                if (words === 1) {
                    name = modifier;
                }

                if (i > -1 && words > 1) {
                    name = modifier.slice(0, i);
                    description = modifier.slice(i + 1);
                }

                // replace by whitespace to use in HTML when there are multiple
                // classes (.foo.bar -> foo bar)
                var htmlClasses = name.replace(/\./g, ' ');
                htmlClasses = htmlClasses.replace(/\:/, 'pseudo-class-');


                return {
                    classes: htmlClasses, //to use in HTML
                    name: name,
                    description: description
                };
            });
        },

        _forceArray: function(val) {
            _.isArray(val) || (val = [val]);
            return val;
        }
    };


    CommentParser.translators = {
        state: CommentParser.translatorHelpers._keyValue,
        modifier: CommentParser.translatorHelpers._keyValue,
        markup: function(val, block) {
            _.isArray(val) || (val = [val]);
            // because first line is empty after `@markup`, attr is used as a bool;
            var markup = _.map(val, function(snippet) {
                return snippet.replace(/^true\n/, '');
            }).join('\n');

            if (markup) {
                block.markup_original = markup;
                block.markup_tpl = Handlebars.compile(markup);
            }

            return markup;
        },
        description: function(val) {
            return marked(val);
        },
        depends: CommentParser.translatorHelpers._forceArray,
        extends: CommentParser.translatorHelpers._forceArray
    };

    _.extend(CommentParser.prototype, {
        init: function() {
            // Synchronous highlighting with highlight.js
            marked.setOptions({
                highlightClass: 'hljs',
                highlight: function (code) {
                    return hljs.highlightAuto(code).value;
                }
            });
        },

        parseFile: function(cssPath) {
            var cssStr = fs.readFileSync(cssPath, {encoding: 'utf8'});
            if (!cssStr) { return false; }
            return this.parse(cssStr);
        },

        parse: function(cssStr) {
            var blocks = scrawl.parse(cssStr);
            if (! _.size(blocks)) { return []; } //TODO: return [] or false?

            return this.translateAll(blocks);
        },

        translateAll: function(blocks) {
            return _.each(blocks, this.translate, this);
        },

        translate: function(block) {
            // TODO: comment, move to function, (translators not supported?)
            // description_html needs to be recompiled (is markdown)
            var lines = _.lines(block.description);
            if (lines.length > 1) {
                block.title = lines[0];
                block.description = lines.slice(1).join('\n');
            } else {
                block.title = lines[0];
                block.description = '';
            }


            var keys = _.keys(block);
            _.each(keys, function(key) {
                var translator = CommentParser.translators[key];
                if (_.isUndefined(translator)) {
                    return;
                }

                block[key] = translator(block[key], block);
            });

            return block;
        },

        compileMarkup: function(block) {
            if (! block.markup ) { return block; }

            block.markup = block.markup_tpl();
            block.markup_highlighted = hljs.highlight('html',
                this.beautifyHTML(block.markup)).value;

            return block;
        },

        beautifyHTML: function(content, options) {
            options || (options = {});

            var defaults = {
                condense: true,
                fixspaces: false,
                indent_char: ' ',
                indent_handlebars: false,
                indent_inner_html: true,
                indent_size: 4,
                padcomments: true,
                unformatted: ['code', 'pre', 'em', 'strong']
            };
            var Utils = require('./helpers/beautify-utils');


            // Run js-beautify before cleaning up newlines below.
            content = require('js-beautify').html(content, defaults);

            // Clean up newlines, spacing
            if (options.condense === true) {
                content = Utils.condense(content);
            }

            if (options.padcomments === true) {
                content = Utils.padcomments(content);
            }

            if (options.fixspaces === true) {
                content = Utils.fixspaces(content);
            }

            return content;
        }
    });

    module.exports = CommentParser;

})();