(function() {


'use strict';

var dotaccess = require('dotaccess');
var util = require('util');

module.exports.register = function(Handlebars, tree) {

    Handlebars.registerHelper('use', function(dotPath) {
        var classes = '';
        var modifierIndex = dotPath.indexOf(' ');

        if (modifierIndex > 1) {
            classes = dotPath.slice(modifierIndex + 1);
            dotPath = dotPath.slice(0, modifierIndex);
        }

        dotPath = dotPath.replace(/\./g, '.childs.');

        var block = dotaccess.get(tree, dotPath);
        if (! block) { return ''; }

        return new Handlebars.SafeString(block.markup_tpl({
            classes: classes
        }));
    });
};

})();