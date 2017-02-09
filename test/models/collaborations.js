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
const demoUsersOpts = [
  {
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

const demoTaskOpts = [
  {
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

function setupDemoUsers(done) {
  const opts = {
    force: true,
  };
  // Set up the database. It is flushed each time.
  Promise.all([db.sequelize.sync(opts)]).then(() => {
    // Then create some demo users.
    const tmpUsers = demoUsersOpts.map(userOpts => Users.ezBuild(userOpts));
    const savePromises = tmpUsers.map(u => u.save());
    Promise.all(savePromises).then(() => {
      demoUsers = tmpUsers;
      done();
    });
  });
}

lab.beforeEach((done) => {
  setupDemoUsers(done);
});

lab.experiment('For collections of users and tasks', () => {
  let demoTasks = [];

  function setupDemoTasks(done) {
    const taskPromises = demoTaskOpts.map(t => Tasks.build(t).save());
    Promise.all(taskPromises).then((results) => {
      demoTasks = results;
      const promises = [];
      promises.push(demoTasks[0].addCollaborator(demoUsers[2]));
      Promise
        .all(promises)
        .then(() => {
          done();
        });
    });
  }

  lab.beforeEach({
    timeout: 10000,
  }, (done) => {
    setupDemoUsers(() => {
      setupDemoTasks(done);
    });
  });

  function testUserTaskCount(promise, expectedCount, done) {
    let error = null;
    promise
      .catch((err) => {
        error = err;
      })
      .then((tasks) => {
        Code.expect(error).to.be.null();
        Code.expect(tasks.length).to.equal(expectedCount);
      }).finally(() => {
        done();
      });
  }

  lab.test('a tasks owner can be queried', (done) => {
    let error = null;
    demoTasks[0]
      .getOwner()
      .catch((err) => {
        error = err;
      })
      .then((owner) => {
        Code.expect(error).to.be.null();
        Code.expect(owner.id).to.equal(1);
      }).finally(() => {
        done();
      });
  });

  lab.test('a users owned tasks can be queried', (done) => {
    const u = demoUsers[0];
    testUserTaskCount(u.getTasks(), 2, done);
  });

  lab.test('a users shared tasks can be queried', (done) => {
    testUserTaskCount(demoUsers[0].getSharedTasks(), 0, () => {
      testUserTaskCount(demoUsers[2].getSharedTasks(), 1, done);
    });
  });

  lab.test('a users findOneWithTasks eagerly loads tasks', (done) => {
    Users
      .findOneWithTasks({
        id: 1,
      })
      .then((user) => {
        Code.expect(user.tasks.length).to.equal(2);
        done();
      });
  });

  lab.test('a tasks addCollaborators method adds collaborators', (done) => {
    let error = null;
    demoTasks[2]
      .addCollaborators([demoUsers[2], demoUsers[3]])
      .catch((err) => {
        error = err;
      })
      .finally(() => {
        Code.expect(true).to.be.true();
        testUserTaskCount(demoUsers[3].getSharedTasks(), 1, () => {
          Code.expect(error).to.be.null();
          done();
        });
      });
  });
});
