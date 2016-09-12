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



var defaults = {
    preserve: false
};

module.exports = postcss.plugin('postcss-css-variables', function(options) {
    return _.partial(transformAST, _.defaults(options, defaults));
});

function transformAST(options, ast, result) {
    // Map of variable names to a list of declarations
    var map = {};

    map = collectVarsDeclarations(options, ast);

    // Resolve variables everywhere
    // ---------------------------------------------------------
    // ---------------------------------------------------------

    // Collect all the rules that have declarations that use variables
    var rulesThatHaveDeclarationsWithVariablesList = [];
    ast.walkRules(function(rule) {
        var doesRuleUseVariables = rule.nodes.some(function(node) {
            if(node.type === 'decl') {
                var decl = node;
                // If it uses variables
                // and is not a variable declarations that we may be preserving from earlier
                if(resolveValue.RE_VAR_FUNC.test(decl.value) && !utils.isItCustomVariableDeclaration(decl)) {
                    return true;
                }
            }

            return false;
        });

        if(doesRuleUseVariables) {
            rulesThatHaveDeclarationsWithVariablesList.push(rule);
        }
    });

    rulesThatHaveDeclarationsWithVariablesList.forEach(function(rule) {
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
                    resolveDecl(decl, map, options.preserve);
                }
            });
        });

    });





}





function cleanUpNode(node) {
    // If we removed all of the declarations in the rule(making it empty),
    // then just remove it
    var nodeToPossiblyCleanUp = node;
    while(nodeToPossiblyCleanUp && nodeToPossiblyCleanUp.nodes.length <= 0) {
        var nodeToRemove = nodeToPossiblyCleanUp.type !== 'root' ? nodeToPossiblyCleanUp : null;

        if(nodeToRemove) {
            // Get a reference to it before we remove
            // and lose reference to the child after removing it
            nodeToPossiblyCleanUp = nodeToRemove.parent;

            nodeToRemove.remove();
        }
        else {
            nodeToPossiblyCleanUp = null;
        }
    }
}
