'use strict';

/*eslint-env mocha*/

let path = require('path');
let generate = require('@gerhobbelt/markdown-it-testgen');
let md = require('@gerhobbelt/markdown-it')({
  html: true,
  linkify: true,
  typography: true
}).use(require('../'));

describe('markdown-it-toc', function () {
  generate(path.join(__dirname, 'fixtures/toc.txt'), md);
});

describe('markdown-it-toc-default', function () {
  generate(path.join(__dirname, 'fixtures/toc2.txt'), null, md, {
    tocHeader: 'test'
  });
});
