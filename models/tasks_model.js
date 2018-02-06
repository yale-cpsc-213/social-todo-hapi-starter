'use strict';

function init(sequelize, DataTypes) {
  const fields = {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 500],
        notEmpty: true,
      },
    },
    isComplete: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    description: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 5000],
      },
    },
  };


  const Tasks = sequelize.define('tasks', fields, {});

  Tasks.associate = function (models) {
    // Each Task has one owner and many collaborators. The collaborators
    // will be created in a join table.
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
    // and https://github.com/sequelize/express-example/blob/master/models/task.js
    this.belongsTo(models.users, {
      onDelete: 'CASCADE',
      foreignKey: {
        allowNull: false,
      },
      as: 'owner',
    });
    this.belongsToMany(models.users, {
      through: 'collaborations',
      as: 'collaborators',
    });
  };
  return Tasks;
}

module.exports = exports = init;