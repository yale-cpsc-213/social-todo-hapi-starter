'use strict';

function logout(request, reply) {
  request.cookieAuth.clear();
  reply.redirect('/');
}

function setCookie(request, user) {
  request.cookieAuth.set({
    id: user.id,
    name: user.name,
    email: user.email,
  });
}

function login(request, reply) {
  if (!(request.payload.email && request.payload.password)) {
    return reply.view('index', {
      errors: [
        'No such user',
      ],
    });
  }
  return this.models.users.findOne({
    where: {
      email: request.payload.email.toLowerCase(),
    },
  }).then((user) => {
    if (!user || !user.checkPassword(request.payload.password)) {
      // The password is invalid
      return reply.view('index', {
        errors: ['No such user'],
      });
    }
    // The user was found and the password is valid
    setCookie(request, user);
    return reply.redirect('/');
  });
}

function register(request, reply) {
  const params = request.payload;

  // See if the password exists and matches passwordConfirmation
  if (!(params.password === params.passwordConfirmation && typeof params.password === 'string')) {
    const errors = ['Passwords do not match'];
    return reply.view('index', {
      errors,
    });
  }
  if (params.password.length > 50) {
    return reply.view('index', {
      errors: ['Password is too long'],
    });
  }

  // Save the user, we'll let the database handle the rest of the validation.
  const newUser = this.models.users.ezBuild(params);
  return newUser
    .save()
    .then(() => {
      setCookie(request, newUser);
      reply.redirect('/');
    })
    .catch((err) => {
      const errors = err.errors.map(dbErr => dbErr.message);
      reply.view('index', {
        errors,
        params,
      }).code(400);
    });
}

module.exports = exports = {
  logout,
  login,
  register,
};
