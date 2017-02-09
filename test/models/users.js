/* eslint-disable import/no-extraneous-dependencies,strict */

'use strict';

const Lab = require('lab');
const Code = require('code');
const Sequelize = require('sequelize');

const userModelPath = '../../models/users_model.js';
const lab = exports.lab = Lab.script();

// Create a in-memory sqlite database. Does not write to disk.
const sequelize = new Sequelize('sqlite://', {
  logging: false,
});
const Users = sequelize.import(userModelPath);

lab.beforeEach((done) => {
  Users.sync({
    // Clear the database after each test
    force: true,
  }).then(() => done());
});

/**
 * Pass test if user.save throws error, fail otherwise.
 * @param {User} user The pre-built user model
 * @param {done} done The callback for when test is completed
 */
function expectUserSaveErrorNotNull(user, done) {
  let error = null;
  user
    .save()
    .catch((err) => {
      error = err;
    }).finally(() => {
      Code.expect(error).to.not.be.null();
      done();
    });
}

lab.experiment('Users model', () => {
  lab.test('setSalt sets the salt to a random string', (done) => {
    const user = Users.build({
      name: 'Kyle Jensen',
      email: 'foo@foo.com',
    });
    user.setSalt();
    Code.expect(user.salt).to.be.a.string();
    done();
  });

  lab.test('setPassword sets the passwordHash', (done) => {
    const user = Users.build({
      name: 'Kyle Jensen',
      email: 'foo@foo.com',
    });
    Code.expect(user.passwordHash).to.be.undefined();
    user.setSalt();
    user.setPassword('foo');
    Code.expect(user.passwordHash).to.be.a.string();
    done();
  });

  lab.test('setPassword does not set the passwordHash given empty password', (done) => {
    const user = Users.build({
      name: 'Kyle Jensen',
      email: 'foo@foo.com',
    });
    Code.expect(user.passwordHash).to.be.undefined();
    user.setSalt();
    const result = user.setPassword('');
    Code.expect(user.passwordHash).to.be.undefined();
    Code.expect(result).to.be.null();
    done();
  });

  lab.test('throws an error if email is null', (done) => {
    const user = Users.ezBuild({
      name: 'Kyle Jensen',
      password: 'foo',
    });
    expectUserSaveErrorNotNull(user, done);
  });

  lab.test('throws an error if name is null', (done) => {
    const user = Users.ezBuild({
      email: 'foo@foo.com',
      password: 'foo',
    });
    expectUserSaveErrorNotNull(user, done);
  });

  lab.test('throws an error if passwordHash is null', (done) => {
    const user = Users.build({
      name: 'Kyle Jensen',
      email: 'foo@foo.com',
      salt: 'sdfsd',
    });
    expectUserSaveErrorNotNull(user, done);
  });

  lab.test('throws an error if salt is null', (done) => {
    const user = Users.build({
      name: 'Kyle Jensen',
      email: 'foo@foo.com',
      passwordHash: 'wetwetsdf',
    });
    expectUserSaveErrorNotNull(user, done);
  });

  lab.test('Email is transformed to lowercase automatically', (done) => {
    const user = Users.ezBuild({
      name: 'Kyle Jensen',
      email: 'FOO@bar.com',
      password: 'foo',
    });
    user
      .save()
      .finally(() => {
        Code.expect(user.email).to.equal('foo@bar.com');
        done();
      });
  });

  lab.test('Two users cannot have the same email address', (done) => {
    const user1 = Users.ezBuild({
      name: 'Kyle Jensen',
      email: 'FOO@bar.com',
      password: 'foo',
    });
    const user2 = Users.ezBuild({
      name: 'Bob Bar',
      email: 'FOO@bar.com',
      password: 'bar',
    });
    user1
      .save()
      .then(() => {
        expectUserSaveErrorNotNull(user2, done);
      });
  });

  lab.test('checkPassword is returns true/false appropriately', (done) => {
    const user = Users.ezBuild({
      name: 'Kyle Jensen',
      email: 'FOO@bar.com',
      password: 'foo',
    });
    user
      .save();
    Code.expect(user.checkPassword('x')).to.be.false();
    Code.expect(user.checkPassword('foo')).to.be.true();
    done();
  });
});
