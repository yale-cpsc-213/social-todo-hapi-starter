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

lab.beforeEach(async () => {
  await Users.sync({
    // Clear the database after each test
    force: true,
  });
});

/**
 * Pass test if user.save throws error, fail otherwise.
 * @param {User} user The pre-built user model
 * @param {done} done The callback for when test is completed
 */
async function expectUserSaveErrorNotNull(user) {
  let error = null;
  try {
    await user.save();
  } catch (err) {
    error = err;
  }
  Code.expect(error).to.not.be.null();
}

lab.experiment('Users model', () => {
  lab.test('setSalt sets the salt to a random string', () => {
    const user = Users.build({
      name: 'Kyle Jensen',
      email: 'foo@foo.com',
    });
    user.setSalt();
    Code.expect(user.salt).to.be.a.string();
  });

  lab.test('setPassword sets the passwordHash', () => {
    const user = Users.build({
      name: 'Kyle Jensen',
      email: 'foo@foo.com',
    });
    Code.expect(user.passwordHash).to.be.undefined();
    user.setSalt();
    user.setPassword('foo');
    Code.expect(user.passwordHash).to.be.a.string();
  });

  lab.test('setPassword does not set the passwordHash given empty password', () => {
    const user = Users.build({
      name: 'Kyle Jensen',
      email: 'foo@foo.com',
    });
    Code.expect(user.passwordHash).to.be.undefined();
    user.setSalt();
    const result = user.setPassword('');
    Code.expect(user.passwordHash).to.be.undefined();
    Code.expect(result).to.be.null();
  });

  lab.test('throws an error if email is null', async () => {
    const user = Users.ezBuild({
      name: 'Kyle Jensen',
      password: 'foo',
    });
    await expectUserSaveErrorNotNull(user);
  });

  lab.test('throws an error if name is null', async () => {
    const user = Users.ezBuild({
      email: 'foo@foo.com',
      password: 'foo',
    });
    await expectUserSaveErrorNotNull(user);
  });

  lab.test('throws an error if passwordHash is null', async () => {
    const user = Users.build({
      name: 'Kyle Jensen',
      email: 'foo@foo.com',
      salt: 'sdfsd',
    });
    await expectUserSaveErrorNotNull(user);
  });

  lab.test('throws an error if salt is null', async () => {
    const user = Users.build({
      name: 'Kyle Jensen',
      email: 'foo@foo.com',
      passwordHash: 'wetwetsdf',
    });
    await expectUserSaveErrorNotNull(user);
  });

  lab.test('Email is transformed to lowercase automatically', async () => {
    const user = Users.ezBuild({
      name: 'Kyle Jensen',
      email: 'FOO@bar.com',
      password: 'foo',
    });
    let error = null;
    try {
      await user.save();
    } catch (err) {
      error = err;
    }
    Code.expect(error).to.be.null;
    Code.expect(user.email).to.equal('foo@bar.com');
  });

  lab.test('Two users cannot have the same email address', async () => {
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
    await user1.save();
    await expectUserSaveErrorNotNull(user2);
  });

  lab.test('checkPassword is returns true/false appropriately', async () => {
    const user = Users.ezBuild({
      name: 'Kyle Jensen',
      email: 'FOO@bar.com',
      password: 'foo',
    });
    await user
      .save();
    Code.expect(user.checkPassword('x')).to.be.false();
    Code.expect(user.checkPassword('foo')).to.be.true();
  });
});