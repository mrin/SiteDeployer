exports.replaceHtmlEntites = (function() {
  var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
  var translate = {
    "nbsp": " ",
    "amp" : "&",
    "quot": "\"",
    "lt"  : "<",
    "gt"  : ">"
  };
  return function(s) {
    return ( s.replace(translate_re, function(match, entity) {
      return translate[entity];
    }) );
  }
})();