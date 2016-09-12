// PostCSS CSS Variables (postcss-css-variables)
// v0.5.0
//
// https://github.com/MadLittleMods/postcss-css-variables

// For Debugging
//var nomo = require('node-monkey').start({port: 50501});

var _ = require('lodash');
var postcss = require('postcss');


var utils = require('./lib/utils');
var resolveDecl = require('./lib/resolve-decl');
var resolveValue = require('./lib/resolve-value');
var collectVarsDeclarations = require('./lib/collect-vars-declarations');
var collectRulesThatUsesDeclarations = require('./lib/collect-rules-that-uses-declarations');

var defaults = {
    preserve: false,
    extraVarsDeclaration: ''
};

module.exports = postcss.plugin('postcss-css-variables', function(options) {
    return _.partial(transformAST, _.defaults(options, defaults));
});

function transformAST(options, ast, result) {
    var customVarsDeclarations = _.assign(
            collectVarsDeclarations(options, postcss.parse(options.extraVarsDeclaration)),
            collectVarsDeclarations(options, ast)
        );
    var rulesThatUsesDeclarationsList = collectRulesThatUsesDeclarations(ast);

    rulesThatUsesDeclarationsList.forEach(function(rule) {
        var rulesToWorkOn = [].concat(rule);
        // Split out the rule into each comma separated selector piece
        // We only need to split if is actually comma separted(selectors > 1)
        if(rule.selectors.length > 1) {
            // Reverse the selectors so that we can cloneAfter in the same comma separated order
            rulesToWorkOn = rule.selectors.reverse().map(function(selector) {
                var ruleClone = rule.cloneAfter();
                ruleClone.selector = selector;

                return ruleClone;
            });

            rule.remove();
        }

        // Resolve the declarations
        rulesToWorkOn.forEach(function(ruleToWorkOn) {
            ruleToWorkOn.nodes.slice(0).forEach(function(node) {
                if(node.type === 'decl') {
                    var decl = node;
                    resolveDecl(decl, customVarsDeclarations, options.preserve);
                }
            });
        });

    });

}
