(function() {

    'use strict';

    var Handlebars = require('handlebars');

    var repeatHelper = require('handlebars-helper-repeat');
    repeatHelper.register(Handlebars);

    module.exports = Handlebars;

})();