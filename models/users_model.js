/* eslint no-bitwise: ["error", { "int32Hint": true }] */

'use strict';

const bcrypt = require('bcrypt');

function isInt(value) {
  if (isNaN(value)) {
    return false;
  }
  const x = parseFloat(value);
  return (x | 0) === x;
}

function init(sequelize, DataTypes) {
  /**
   * notNullString - defines options for a non-empty
   * non-null string database field.
   *
   * @param  {Object} overloads Object overloading default values
   * @return {Object} options for the sequelize field.
   */
  function notNullString(overloads) {
    const defaults = {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    };
    const options = Object.assign(defaults, overloads || {});
    return options;
  }

  const fields = {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    name: notNullString({
      validate: {
        len: [1, 50],
        notEmpty: true,
      },
    }),
    email: notNullString({
      unique: {
        msg: 'The specified email address is already in use.',
      },
      validate: {
        isEmail: true,
        len: [1, 50],
      },
      set(val) {
        this.setDataValue('email', val.toLowerCase());
      },
    }),
    passwordHash: notNullString({
      field: 'password_hash',
    }),
    salt: notNullString(),
  };

  let TasksModel = null;
  const Users = sequelize.define('users', fields, {});

  Users.ezBuild = function (opts) {
    const user = this.build(opts);
    user.setSalt();
    user.setPassword(opts.password);
    return user;
  };

  Users.associate = function (models) {
    TasksModel = models.tasks;
    this.hasMany(models.tasks, {
      as: 'tasks',
      foreignKey: 'ownerId',
    });
    this.belongsToMany(models.tasks, {
      through: 'collaborations',
      as: 'sharedTasks',
    });
  };

  /**
   * validateFunc - used by Hapi's auth plugin. This
   * will pass in session data and expect us to change
   * the session data in some way. See
   * https://hapijs.com/tutorials/auth and
   * https://github.com/hapijs/hapi-auth-cookie
   *
   * In this function, we're loading the user based on
   * the session information (which contains the user's id)
   * and we are preloading their tasks.
   *
   * @param  {type} request  the HAPI request
   * @param  {type} session  the session info, in our case from the user's cookie
   * @param  {type} callback see https://github.com/hapijs/hapi-auth-cookie
   */
  Users.validateFunc =
    function (request, session, callback) {
      if (!isInt(session.id)) {
        return callback(null, false, {});
      }
      const id = parseInt(session.id, 10);
      let user = null;
      return Users.findOneWithTasks({
        id,
      }).then((foundUser) => {
        user = foundUser;
      }).error((err) => {
        console.log('Error loading user:', err);
      }).finally(() => {
        if (user == null) {
          request.cookieAuth.clear();
        }
        callback(null, user !== null, user);
      });
    };

  /**
   * findOneWithTasks - Loads a user with a given id and
   * eagerly loads their tasks.
   *
   * @param  {Object} where query that we are running
   * @return {Promise} Promise that resolves to the user or error
   */
  Users.findOneWithTasks = function (where) {
    return this.findOne({
      where,
      include: [{
          model: TasksModel,
          as: 'tasks',
        },
        {
          model: TasksModel,
          as: 'sharedTasks',
        },
      ],
    });
  };

  Users.prototype.setPassword = function (password) {
    if (typeof password === 'string' && password.length > 0 && typeof this.salt === 'string') {
      this.passwordHash = bcrypt.hashSync(password, this.salt);
      return this.passwordHash;
    }
    return null;
  };

  Users.prototype.checkPassword = function (password) {
    const passwordHash = bcrypt.hashSync(password, this.salt);
    return passwordHash === this.passwordHash;
  };

  Users.prototype.setSalt = function () {
    this.salt = bcrypt.genSaltSync(10);
  };

  return Users;
}

module.exports = exports = init;