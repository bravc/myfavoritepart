import { User } from './src/models/User';
import { addAttributeOptions, getAttributes, addOptions, getOptions } from 'sequelize-typescript/lib/services/models';

export const addmodel = async model => {
  const target = model.prototype;
  const options = getOptions(target);
  const attributes = getAttributes(target);

  addOptions(target, {
    tableName: options.tableName
  });

  Object.keys(attributes).forEach(key => {
    addAttributeOptions(target, key, { field: key });
  });

  await this.sequelize.addModels([model]);

  this.sequelize.sync();
};

addmodel(User);
