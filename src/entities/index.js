'use strict'

const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')
const sequelize = require('../core/config/database')

const db = {}

// 🔥 scan domain folders
fs.readdirSync(__dirname)
  .forEach((folder) => {

    const folderPath =
      path.join(__dirname, folder)

    // skip files (only folders)
    if (!fs.lstatSync(folderPath).isDirectory()) {
      return
    }

    // read models inside each domain
    fs.readdirSync(folderPath)
      .filter(file => file.endsWith('.js'))
      .forEach(file => {

        const defineModel =
          require(path.join(folderPath, file))

        const model =
          defineModel(sequelize, Sequelize.DataTypes)

        db[model.name] = model
      })
  })

// 🔗 associations (after all models loaded)
Object.keys(db).forEach(modelName => {

  if (typeof db[modelName].associate === 'function') {
    db[modelName].associate(db)
  }
})

// attach sequelize instance
db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db