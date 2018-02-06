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
  {
    name: 'Charlotte Muller',
    email: 'charlotte@bar.edu',
    password: 'foo',
  },
];

const demoTaskOpts = [{
    name: 'Get milk',
    description: 'From Costco',
    ownerId: 1,
  },
  {
    name: 'Get bread',
    description: 'From Stop and Shop',
    ownerId: 1,
  },
  {
    name: 'Get beer',
    description: 'From the Wine Thief',
    ownerId: 2,
  },
];

async function setupDemoUsers() {
  const opts = {
    force: true,
  };
  // Set up the database. It is flushed each time.
  await db.sequelize.sync(opts);
  const tmpUsers = demoUsersOpts.map(userOpts => Users.ezBuild(userOpts));
  const savePromises = tmpUsers.map(u => u.save());
  await Promise.all(savePromises);
  demoUsers = tmpUsers;
}

lab.experiment('For collections of users and tasks', () => {
  let demoTasks = [];

  async function setupDemoTasks() {
    const demoTaskPromises = await demoTaskOpts.map(t => Tasks.build(t).save());
    demoTasks = await Promise.all(demoTaskPromises);
    await demoTasks[0].addCollaborator(demoUsers[2]);
  }

  lab.beforeEach(async () => {
    await setupDemoUsers();
    await setupDemoTasks();
  });

  async function testUserTaskCount(taskPromise, expectedCount) {
    let error = null;
    let tasks;
    try {
      tasks = await taskPromise;
    } catch (err) {
      error = err;
    }
    Code.expect(error).to.be.null();
    Code.expect(tasks.length).to.equal(expectedCount);
  }

  lab.test('a tasks owner can be queried', async () => {
    let error = null;
    const owner = await demoTasks[0].getOwner();
    Code.expect(error).to.be.null();
    Code.expect(owner.id).to.equal(1);
  });

  lab.test('a users owned tasks can be queried', (done) => {
    const u = demoUsers[0];
    testUserTaskCount(u.getTasks(), 2, done);
  });

  lab.test('a users shared tasks can be queried', async () => {
    await testUserTaskCount(demoUsers[0].getSharedTasks(), 0);
    await testUserTaskCount(demoUsers[2].getSharedTasks(), 1);
  });

  lab.test('a users findOneWithTasks eagerly loads tasks', async () => {
    const user = await Users
      .findOneWithTasks({
        id: 1,
      });
    Code.expect(user.tasks.length).to.equal(2);
  });

  lab.test('a tasks addCollaborators method adds collaborators', async () => {
    let error = null;
    try {
      await demoTasks[2]
        .addCollaborators([demoUsers[2], demoUsers[3]]);
    } catch (err) {
      error = err;
    }
    Code.expect(error).to.be.null;
    await testUserTaskCount(demoUsers[3].getSharedTasks(), 1);
  });
});