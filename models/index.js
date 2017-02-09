'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const url = require('url');

function load(databaseURL, databaseOptions) {
  const db = {};
  // Load models files. This is taken from
  // http://docs.sequelizejs.com/en/1.7.0/articles/express/#modelsuserjs
  const defaultOptions = {};
  if (databaseURL.startsWith('sqlite')) {
    defaultOptions.storage = url.parse(databaseURL).path;
  }
  const opts = Object.assign(defaultOptions, databaseOptions || {});
  const sequelize = new Sequelize(databaseURL, opts);
  const models = [];

  /**
   * Load up all our model files in this directory.
   */
  fs
    .readdirSync(__dirname)
    .filter(file => file.endsWith('_model.js') && (file !== 'index.js'))
    .forEach((file) => {
      const model = sequelize.import(path.join(__dirname, file));
      db[model.name] = model;
      models.push(model);
      sequelize.models[model.name] = model;
    });

  Object.keys(db).forEach((modelName) => {
    if ('associate' in db[modelName]) {
      db[modelName].associate(db);
    }
  });
  // Sync the database and wait for it to complete.
  models.map(m => m.sync());
  db.sequelize = sequelize;

  return db;
}

module.exports = exports = {
  load,
};
