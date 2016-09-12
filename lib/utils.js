 // A custom property is any property whose name starts with two dashes (U+002D HYPHEN-MINUS)
 // `--foo`
 // See: http://dev.w3.org/csswg/css-variables/#custom-property
 var RE_VAR_PROP = /(--(.+))/;

module.exports = {
    isItCustomVariableDeclaration: function(decl) {
        return RE_VAR_PROP.test(decl.prop);
    }
};
