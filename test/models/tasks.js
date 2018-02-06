/* eslint-disable import/no-extraneous-dependencies,strict */

'use strict';

const Lab = require('lab');
const Code = require('code');

const lab = exports.lab = Lab.script();

// Create a in-memory sqlite database. Does not write to disk.
const db = require('../../models/index.js').load('sqlite://', {
  logging: false,
});

const Users = db.users;
const Tasks = db.tasks;
let demoUsers = [];
const demoUsersOpts = [{
    name: 'Lauren Blake',
    email: 'lauren@foo.com',
    password: 'foo',
  },
  {
    name: 'Joe Carlson',
    email: 'joe@foo.com',
    password: 'foo',
  },
  {
    name: 'Kathryn Muller',
    email: 'kathryn@bar.edu',
    password: 'foo',
  },
];

async function setupDemoUsers() {
  const opts = {
    force: true,
  };
  // Set up the database. It is flushed each time.
  await Promise.all([db.sequelize.sync(opts)]);
  // Then create some demo users.
  const tmpUsers = demoUsersOpts.map(userOpts => Users.ezBuild(userOpts));
  const savePromises = tmpUsers.map(u => u.save());
  await Promise.all(savePromises);
  demoUsers = tmpUsers;
}

lab.beforeEach(async () => {
  await setupDemoUsers();
});

/**
 * Pass test if task.save throws error, fail otherwise.
 * @param {Task} user The pre-built task model
 */
async function expectTaskSaveErrorNotNull(task) {
  let error = null;
  try {
    await task.save();
  } catch (err) {
    error = err;
  }
  Code.expect(error).to.not.be.null();
}

/**
 * Pass test if task.save does not throw error, fail otherwise.
 * @param {Task} user The pre-built task model
 */
async function expectTaskSaveErrorNull(task) {
  let error = null;
  try {
    await task.save();
  } catch (err) {
    error = err;
  }
  Code.expect(error).to.be.null();
}

lab.experiment('Tasks model', () => {
  lab.test('has a setOwner method', () => {
    const task = Tasks.build({
      name: 'Get milk',
      description: 'The bulk stuff at Costco',
    });
    Code.expect(task.setOwner).to.be.a.function();
  });

  lab.test('throws an error if no owner is specified', async () => {
    const task = Tasks.build({
      name: 'Get milk',
      description: 'The bulk stuff at Costco',
    });
    await expectTaskSaveErrorNotNull(task);
  });

  lab.test('throws an error if name is empty', async () => {
    const task = Tasks.build({
      name: '',
      description: 'The bulk stuff at Costco',
      ownerId: demoUsers[0].id,
    });
    await expectTaskSaveErrorNotNull(task);
  });

  lab.test('throws an error if name is over 500 letters', async () => {
    const task = Tasks.build({
      name: 'x'.repeat(501),
      description: 'The bulk stuff at Costco',
      ownerId: demoUsers[0].id,
    });
    await expectTaskSaveErrorNotNull(task);
  });

  lab.test('does not throw an error if description is empty', async () => {
    const task = Tasks.build({
      name: 'Buy milk',
      description: '',
      ownerId: demoUsers[0].id,
    });
    await expectTaskSaveErrorNull(task);
  });

  lab.test('throws an error if name is over 5000 letters', async () => {
    const task = Tasks.build({
      name: 'Buy milk',
      description: 'x'.repeat(5001),
      ownerId: demoUsers[0].id,
    });
    await expectTaskSaveErrorNotNull(task);
  });

  lab.test('can be saved when given valid data', async () => {
    const task = Tasks.build({
      name: 'Buy milk',
      description: 'The bulk stuff at Costco',
      ownerId: demoUsers[0].id,
    });
    let error = null;
    try {
      await task.save();
    } catch (err) {
      error = err;
    }
    Code.expect(error).to.be.null();
    Code.expect(task.ownerId).to.equal(demoUsers[0].id);
    Code.expect(task.getOwner).to.be.a.function();
    const owner = await task.getOwner();
    Code.expect(owner.id).to.equal(demoUsers[0].id);
  });

  lab.test('is not complete by default', async () => {
    const task = Tasks.build({
      name: 'Buy milk',
      description: 'The bulk stuff at Costco',
      ownerId: demoUsers[0].id,
    });
    await task.save();
    Code.expect(task.isComplete).to.be.a.false();
  });

  lab.test('has an addCollaborator method', async () => {
    const task = Tasks.build({
      name: 'Buy milk',
      description: 'The bulk stuff at Costco',
      ownerId: demoUsers[0].id,
    });
    await task.save();
    Code.expect(task.addCollaborator).to.be.a.function();
  });

  lab.test('has an getCollaborators method', async () => {
    const task = Tasks.build({
      name: 'Buy milk',
      description: 'The bulk stuff at Costco',
      ownerId: demoUsers[0].id,
    });
    await task.save();
    Code.expect(task.getCollaborators).to.be.a.function();
  });

  lab.test('collaborators can be added', async () => {
    const task = Tasks.build({
      name: 'Buy milk',
      description: 'The bulk stuff at Costco',
      ownerId: demoUsers[0].id,
    });
    await task.save();
    await task.addCollaborator(demoUsers[1]);
    const collaborators = await task.getCollaborators();
    Code.expect(collaborators.length).to.equal(1);
  });
});