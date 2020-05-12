// Process @[toc](|Title)

var markdownItToc = function (md) {

  const TOC_REGEXP = /^@\[toc\](?:\((?:\s+)?([^\)]+)(?:\s+)?\)?)?(?:\s+?)?$/im;
  const TOC_DEFAULT = 'Table of Contents';
  let gstate;
  let tocHeadings = {};
  let bodyHeadings = {};

  function toc(state, silent) {
    while (state.src.indexOf('\n') >= 0 && state.src.indexOf('\n') < state.src.indexOf('@[toc]')) {
      if ([ 'softbreak', 'hardbreak' ].indexOf(state.tokens.slice(-1)[0].type) > -1) {
        state.src = state.src.split('\n').slice(1).join('\n');
        state.pos = 0;
      }
    }
    let token;

    // trivial rejections
    if (state.src.charCodeAt(state.pos) !== 0x40 /* @ */) {
      return false;
    }
    if (state.src.charCodeAt(state.pos + 1) !== 0x5B /* [ */) {
      return false;
    }

    let match = TOC_REGEXP.exec(state.src);
    if (!match) {
      return false;
    }
    match = match.filter(function (m) {
      return m;
    });
    if (match.length < 1) {
      return false;
    }
    if (silent) { // don't run any pairs in validation mode
      return false;
    }

    token = state.push('toc_open', 'toc', 1);
    token.markup = '@[toc]';

    token = state.push('toc_body', '', 0);
    let label = state.env.tocHeader || TOC_DEFAULT;
    if (match.length > 1) {
      label = match.pop();
    }
    token.content = label;

    token = state.push('toc_close', 'toc', -1);

    let offset = 0;
    let newline = state.src.indexOf('\n');
    if (newline !== -1) {
      offset = state.pos + newline;
    } else {
      offset = state.pos + state.posMax + 1;
    }
    state.pos = offset;

    return true;
  }

  function makeSafe(label) {
    return label.replace(/[^\w\s]/gi, '').split(' ').join('_');
  }

  md.renderer.rules.heading_open = function (tokens, index) {
    let level = tokens[index].tag;
    let label = tokens[index + 1];
    if (label.type === 'inline') {
      let anchor = makeSafe(label.content);
      let appendix = '';
      if (isNaN(Number(tocHeadings[anchor]))) {
        tocHeadings[anchor] = 0;
      } else {
        tocHeadings[anchor]++;
        appendix = '_' + tocHeadings[anchor];
      }
      return '<' + level + '><a id="' + anchor + appendix + '"></a>';
    }
    return '</h1>';

  };

  md.renderer.rules.toc_open = function (tokens, index) {
    return '';
  };

  md.renderer.rules.toc_close = function (tokens, index) {
    return '';
  };

  md.renderer.rules.toc_body = function (tokens, index) {
    // Wanted to avoid linear search through tokens here,
    // but this seems the only reliable way to identify headings
    let headings = [];
    let gtokens = gstate.tokens;
    let size = gtokens.length;
    for (let i = 0; i < size; i++) {
      if (gtokens[i].type !== 'heading_close') {
        continue;
      }
      let token = gtokens[i];
      let heading = gtokens[i - 1];
      if (heading.type === 'inline') {
        let anchor = makeSafe(heading.content);
        let appendix = '';
        if (isNaN(Number(bodyHeadings[anchor]))) {
          bodyHeadings[anchor] = 0;
        } else {
          bodyHeadings[anchor]++;
          appendix = '_' + bodyHeadings[anchor];
        }
        headings.push({
          level: +token.tag.substr(1, 1),
          anchor: anchor + appendix,
          content: heading.content
        });
      }
    }

    let indent = 0;
    let list = headings.map(function (heading) {
      let res = [];
      if (heading.level > indent) {
        let ldiff = (heading.level - indent);
        for (let i = 0; i < ldiff; i++) {
          res.push('<ul>');
          indent++;
        }
      } else if (heading.level < indent) {
        let ldiff = (indent - heading.level);
        for (let i = 0; i < ldiff; i++) {
          res.push('</ul>');
          indent--;
        }
      }
      res = res.concat([ '<li><a href="#', heading.anchor, '">', heading.content, '</a></li>' ]);
      return res.join('');
    });

    return '<h3>' + tokens[index].content + '</h3>' + list.join('') + new Array(indent + 1).join('</ul>');
  };

  md.core.ruler.push('grab_state', function (state) {
    gstate = state;

    // reset lookup tables for the next independent run:
    tocHeadings = {};
    bodyHeadings = {};
  });
  md.inline.ruler.after('emphasis', 'toc', toc);
};

export default markdownItToc;
