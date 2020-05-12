'use strict';

/*eslint-env mocha*/

let path = require('path');
let generate = require('markdown-it-testgen');
let md = require('markdown-it')({
  html: true,
  linkify: true,
  typography: true
}).use(require('../'));

describe('markdown-it-toc', function () {
  generate(path.join(__dirname, 'fixtures/toc.txt'), md);
});

describe('markdown-it-toc-default', function () {
  generate(path.join(__dirname, 'fixtures/toc2.txt'), {
  	tocHeader: 'test'
  }, md);
});
