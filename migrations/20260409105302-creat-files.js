'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('files', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },

      file_name: {
        type: Sequelize.STRING,
        allowNull: false
      },

      file_type: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'صيغة الملف مثل PDF, DOCX, JPG...'
      },

      type: {
        type: Sequelize.ENUM('اضبارة', 'وثائق للمواطن', 'كتاب وزاري'),
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },

      version: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    })
  },

  down: async queryInterface => {
    await queryInterface.dropTable('files')
  }
}
