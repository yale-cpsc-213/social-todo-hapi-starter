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

/**
 * Pass test if task.save throws error, fail otherwise.
 * @param {Task} user The pre-built task model
 * @param {done} done The callback for when test is completed
 */
function expectTaskSaveErrorNotNull(task, done) {
  let error = null;
  task
    .save()
    .catch((err) => {
      error = err;
    }).error((err) => {
      error = err;
    }).finally(() => {
      Code.expect(error).to.not.be.null();
      done();
    });
}

/**
 * Pass test if task.save does not throw error, fail otherwise.
 * @param {Task} user The pre-built task model
 * @param {done} done The callback for when test is completed
 */
function expectTaskSaveErrorNull(task, done) {
  let error = null;
  task
    .save()
    .catch((err) => {
      error = err;
    }).error((err) => {
      error = err;
    }).finally(() => {
      Code.expect(error).to.be.null();
      done();
    });
}

lab.experiment('Tasks model', () => {
  lab.test('has a setOwner method', (done) => {
    const task = Tasks.build({
      name: 'Get milk',
      description: 'The bulk stuff at Costco',
    });
    Code.expect(task.setOwner).to.be.a.function();
    done();
  });

  lab.test('throws an error if no owner is specified', (done) => {
    const task = Tasks.build({
      name: 'Get milk',
      description: 'The bulk stuff at Costco',
    });
    expectTaskSaveErrorNotNull(task, done);
  });

  lab.test('throws an error if name is empty', (done) => {
    const task = Tasks.build({
      name: '',
      description: 'The bulk stuff at Costco',
      ownerId: demoUsers[0].id,
    });
    expectTaskSaveErrorNotNull(task, done);
  });

  lab.test('throws an error if name is over 500 letters', (done) => {
    const task = Tasks.build({
      name: 'x'.repeat(501),
      description: 'The bulk stuff at Costco',
      ownerId: demoUsers[0].id,
    });
    expectTaskSaveErrorNotNull(task, done);
  });

  lab.test('does not throw an error if description is empty', (done) => {
    const task = Tasks.build({
      name: 'Buy milk',
      description: '',
      ownerId: demoUsers[0].id,
    });
    expectTaskSaveErrorNull(task, done);
  });

  lab.test('throws an error if name is over 5000 letters', (done) => {
    const task = Tasks.build({
      name: 'Buy milk',
      description: 'x'.repeat(5001),
      ownerId: demoUsers[0].id,
    });
    expectTaskSaveErrorNotNull(task, done);
  });

  lab.test('can be saved when given valid data', (done) => {
    const task = Tasks.build({
      name: 'Buy milk',
      description: 'The bulk stuff at Costco',
      ownerId: demoUsers[0].id,
    });
    let error = null;
    task
      .save()
      .catch((err) => {
        error = err;
      }).finally(() => {
        Code.expect(error).to.be.null();
        Code.expect(task.ownerId).to.equal(demoUsers[0].id);
        Code.expect(task.getOwner).to.be.a.function();
        task
          .getOwner()
          .then((owner) => {
            Code.expect(owner.id).to.equal(demoUsers[0].id);
          })
          .finally(() => {
            done();
          });
      });
  });

  lab.test('is not complete by default', (done) => {
    const task = Tasks.build({
      name: 'Buy milk',
      description: 'The bulk stuff at Costco',
      ownerId: demoUsers[0].id,
    });
    task
      .save()
      .finally(() => {
        Code.expect(task.isComplete).to.be.a.false();
        done();
      });
  });

  lab.test('has an addCollaborator method', (done) => {
    const task = Tasks.build({
      name: 'Buy milk',
      description: 'The bulk stuff at Costco',
      ownerId: demoUsers[0].id,
    });
    task
      .save()
      .finally(() => {
        Code.expect(task.addCollaborator).to.be.a.function();
        done();
      });
  });

  lab.test('has an getCollaborators method', (done) => {
    const task = Tasks.build({
      name: 'Buy milk',
      description: 'The bulk stuff at Costco',
      ownerId: demoUsers[0].id,
    });
    task
      .save()
      .finally(() => {
        Code.expect(task.getCollaborators).to.be.a.function();
        done();
      });
  });

  lab.test('collaborators can be added', (done) => {
    const task = Tasks.build({
      name: 'Buy milk',
      description: 'The bulk stuff at Costco',
      ownerId: demoUsers[0].id,
    });
    let collaborators = [];
    task
      .save()
      .finally(() => {
        task
          .addCollaborator(demoUsers[1])
          .finally(() => {
            task
              .getCollaborators()
              .then((results) => {
                collaborators = results;
              })
              .finally(() => {
                Code.expect(collaborators.length).to.equal(1);
                done();
              });
          });
      });
  });
});
