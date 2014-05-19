/**
  Create a simple BBCode tag handler

  @method replaceBBCode
  @param {tag} tag the tag we want to match
  @param {function} emitter the function that creates JsonML for the tag
  @param {Object} opts options to pass to Discourse.Dialect.inlineBetween
    @param {Function} [opts.emitter] The function that will be called with the contents and returns JsonML.
    @param {String} [opts.start] The starting token we want to find
    @param {String} [opts.stop] The ending token we want to find
    @param {String} [opts.between] A shortcut for when the `start` and `stop` are the same.
    @param {Boolean} [opts.rawContents] If true, the contents between the tokens will not be parsed.
    @param {Boolean} [opts.wordBoundary] If true, the match must be on a word boundary
    @param {Boolean} [opts.spaceBoundary] If true, the match must be on a space boundary
**/
function replaceBBCode(tag, emitter, opts) {
  opts = opts || {};
  opts = _.merge(opts, { emitter: emitter });

  Discourse.Dialect.inlineBetween(_.merge(opts, { start: "[" + tag + "]", stop: "[/" + tag + "]"}));

  tag = tag.toUpperCase();
  Discourse.Dialect.inlineBetween(_.merge(opts, { start: "[" + tag + "]", stop: "[/" + tag + "]" }));
}

/**
  Shortcut to call replaceBBCode with `rawContents` as true.

  @method replaceBBCode
  @param {tag} tag the tag we want to match
  @param {function} emitter the function that creates JsonML for the tag
**/
function rawBBCode(tag, emitter) {
  replaceBBCode(tag, emitter, { rawContents: true });
}

/**
  Creates a BBCode handler that accepts parameters. Passes them to the emitter.

  @method replaceBBCodeParamsRaw
  @param {tag} tag the tag we want to match
  @param {function} emitter the function that creates JsonML for the tag
**/
function replaceBBCodeParamsRaw(tag, emitter) {
  var opts = {
    rawContents: true,
    emitter: function(contents) {
      var regexp = /^["']?(.+?)["']?\](.*)$/,
          m = regexp.exec(contents);

      if (m) { return emitter.call(this, m[1], m[2]); }
    }
  };

  Discourse.Dialect.inlineBetween(_.merge(opts, { start: "[" + tag + "=", stop: "[/" + tag + "]" }));

  tag = tag.toUpperCase();
  Discourse.Dialect.inlineBetween(_.merge(opts, { start: "[" + tag + "=", stop: "[/" + tag + "]" }));
}

/**
  Creates a BBCode handler that accepts parameters. Passes them to the emitter.
  Processes the inside recursively so it can be nested.

  @method replaceBBCodeParams
  @param {tag} tag the tag we want to match
  @param {function} emitter the function that creates JsonML for the tag
**/
function replaceBBCodeParams(tag, emitter) {
  replaceBBCodeParamsRaw(tag, function (param, contents) {
    return emitter(param, this.processInline(contents));
  });
}

replaceBBCode('b', function(contents) { return ['span', {'class': 'bbcode-b'}].concat(contents); });
replaceBBCode('i', function(contents) { return ['span', {'class': 'bbcode-i'}].concat(contents); });
replaceBBCode('u', function(contents) { return ['span', {'class': 'bbcode-u'}].concat(contents); });
replaceBBCode('s', function(contents) { return ['span', {'class': 'bbcode-s'}].concat(contents); });

replaceBBCode('ul', function(contents) { return ['ul'].concat(contents); });
replaceBBCode('ol', function(contents) { return ['ol'].concat(contents); });
replaceBBCode('li', function(contents) { return ['li'].concat(contents); });

rawBBCode('img', function(contents) { return ['img', { "href": contents }]; });
rawBBCode('email', function(contents) { return ['a', {href: "mailto:" + contents, 'data-bbcode': true}, contents]; });
rawBBCode('url', function(contents) { return ['a', {href: contents, 'data-bbcode': true}, contents]; });
rawBBCode('spoiler', function(contents) {
  if (/<img/i.test(contents)) {
    return ['div', { 'class': 'spoiler' }, contents];
  } else {
    return ['span', { 'class': 'spoiler' }, contents];
  }
});

replaceBBCodeParams("url", function(param, contents) {
  return ['a', {href: param, 'data-bbcode': true}].concat(contents);
});

replaceBBCodeParams("email", function(param, contents) {
  return ['a', {href: "mailto:" + param, 'data-bbcode': true}].concat(contents);
});

replaceBBCodeParams("size", function(param, contents) {
  return ['span', {'class': "bbcode-size-" + (parseInt(param, 10) || 1)}].concat(contents);
});

// Handles `[code] ... [/code]` blocks
Discourse.Dialect.replaceBlock({
  start: /(\[code\])([\s\S]*)/igm,
  stop: /\[\/code\]/i,

  emitter: function(blockContents) {
    return ['p', ['pre'].concat(blockContents.join("\n"))];
  }
});


// TO EXTRACT

replaceBBCodeParams("color", function(param, contents) {
  return ['font', {'color': param}].concat(contents);
});

replaceBBCodeParams("size", function(param, contents) {
  return ['font', {'size': param}].concat(contents);
});

replaceBBCodeParams("font", function(param, contents) {
  return ['font', {'face': param}].concat(contents);
});

replaceBBCode("small", function(contents) { return ['span', {'style': 'font-size:x-small'}].concat(contents); });

replaceBBCode("highlight", function(contents) { return ['span', {'class': 'highlight'}].concat(contents); });

["left", "center", "right"].forEach(function(direction){
  replaceBBCode(direction, function(contents) { return ['div', {'style': "text-align:" + direction}].concat(contents); });
});

rawBBCode("noparse", function(contents) { return contents; });

replaceBBCodeParams("aname", function(param, contents) {
  return ['a', {'name': param, 'data-bbcode': true}].concat(contents);
});

rawBBCode('fphp', function(contents) { return ['a', {href: "http://www.php.net/manual-lookup.php?function=" + contents, 'data-bbcode': true}, contents]; });
replaceBBCodeParamsRaw("fphp", function(param, contents) {
  return ['a', {href: "http://www.php.net/manual-lookup.php?function=" + param, 'data-bbcode': true}, contents];
});

rawBBCode('google', function(contents) { return ['a', {href: "http://www.google.com/search?q=" + contents, 'data-bbcode': true}, contents]; });

replaceBBCodeParams("jumpto", function(param, contents) {
  return ['a', {href: "#" + param, 'data-bbcode': true}].concat(contents);
});

replaceBBCode('edit', function(contents) { return ['div', {'class': 'sepquote'}, ['span', { 'class': 'smallfont' }, "Edit:"], ['br'], ['br']].concat(contents); });
replaceBBCode('ot', function(contents) { return ['div', {'class': 'sepquote'}, ['span', { 'class': 'smallfont' }, "Off Topic:"], ['br'], ['br']].concat(contents); });

replaceBBCode('indent', function(contents) { return ['blockquote', ['div'].concat(contents)]; });

replaceBBCodeParams("rule", function(param, contents) {
  var style = "margin: 6px 0; height: 0; border-top: 1px solid " + contents + "; margin: auto; width: " + param;
  return ['div', { 'style': style }];
});

Discourse.Dialect.replaceBlock({
  start: /\[list=?(\w)?\]([\s\S]*)/igm,
  stop: /\[\/list\]/i,
  emitter: function(blockContents, matches) {
    var contents = matches[1] ? ["ol", { "type": matches[1] }] : ["ul"];

    if (blockContents.length) {
      var self = this;
      blockContents.forEach(function(bc){
        var lines = bc.split(/\n/);
        lines.forEach(function(line) {
          if (line.indexOf("[*]") === 0) {
            var li = self.processInline(line.slice(3));
            if (li) {
              contents.push(["li"].concat(li));
            }
          }
        });
      });
    }

    return contents;
  }
});
