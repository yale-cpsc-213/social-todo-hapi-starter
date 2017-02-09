'use strict';

module.exports = exports = {
  index(request, reply) {
    const context = {};
    if (request.auth.credentials) {
      context.user = request.auth.credentials;
      context.tasks = context.user.tasks;
    }
    reply.view('index.html', context);
  },
};
