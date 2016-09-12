var _ = require('lodash');
var utils = require('./utils.js');
var resolveValue = require('./resolve-value');
var shallowCloneNode = require('./shallow-clone-node');

module.exports = function(options, ast) {
    var result = {};

    ast.walkDecls(_.partial(collectVarsFromOneDecl, options, result));

    return result;
};

function collectVarsFromOneDecl(options, result, decl) {
    if(!utils.isItCustomVariableDeclaration(decl)) return;

        var declParentRule = decl.parent;

        var valueResults = resolveValue(decl, result);
        // Split out each selector piece into its own declaration for easier logic down the road
        decl.parent.selectors.forEach(function(selector) {
            // Create a detached clone
            var splitOutRule = shallowCloneNode(decl.parent);
            splitOutRule.selector = selector;
            splitOutRule.parent = decl.parent.parent;

            var declClone = decl.clone();
            declClone.moveTo(splitOutRule);

            var prop = decl.prop;
            result[prop] = (result[prop] || []).concat({
                decl: declClone,
                prop: prop,
                calculatedInPlaceValue: valueResults.value,
                isImportant: decl.important || false,
                variablesUsed: valueResults.variablesUsed,
                parent: splitOutRule,
                // variables inside root or at-rules (eg. @media, @support)
                isUnderAtRule: splitOutRule.parent.type === 'atrule'
            });

        });

        // Remove the variable declaration because they are pretty much useless after we resolve them
        if(!options.preserve) {
            decl.remove();
        }
        // Or we can also just show the computed value used for that variable
        else if(options.preserve === 'computed') {
            decl.value = valueResults.value;
        }

    };
