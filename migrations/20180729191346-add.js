'use strict';

var dbm;
var type;
var seed;
let date = new Date();

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  db.addColumn('Users', 'createdAt', {
    type: 'timestamp',
    defaultValue: 'CURRENT_TIMESTAMP',
    notNull: true
  } )
  return null;
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
