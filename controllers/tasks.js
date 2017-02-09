'use strict';

const validator = require('validator');

function create(request, reply) {
  reply('woot');
}

function destroy(request, reply) {
  reply('woot');
}

function toggle(request, reply) {
  reply('woot');
}

module.exports = exports = {
  create,
  destroy,
  toggle,
};
