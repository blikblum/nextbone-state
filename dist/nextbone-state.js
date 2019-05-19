import { Model, Collection, Events } from 'nextbone';
import pathToRegexp from 'path-to-regexp';

function getResourcePath(resourceDef, params = {}, resourceId) {
  const toPath = pathToRegexp.compile(resourceDef.path);
  let query = '';
  let result = toPath(params);

  if (resourceDef.params) {
    resourceDef.params.forEach(paramDef => {
      const paramValue = params[paramDef.name];
      const isQuery = paramDef.location === 'query';
      const isRequired = typeof paramDef.required === 'undefined' && !isQuery || paramDef.required === true;

      if (isRequired && paramValue == null) {
        throw new Error(`Param ${paramDef.name} is not defined for resource ${resourceDef.name}`);
      }

      if (isQuery && paramValue != null) {
        query += `${query ? '&' : ''}${encodeURIComponent(paramDef.name)}=${encodeURIComponent(paramValue)}`;
      }
    });
  }

  if (resourceId) {
    result = result.replace(/[^/]$/, '$&/') + encodeURIComponent(resourceId);
  }

  if (query) {
    result += `?${query}`;
  }

  return result;
}

function findResourceDef(client, resource) {
  const result = client.resourceDefs.find(def => def.name === resource);

  if (!result) {
    throw new Error(`Unable to find resource definition for ${resource}`);
  }

  return result;
}

function createResourceSync(originalSync) {
  return function resourceSync(method, model, options) {
    const ctor = model.constructor;
    const resource = ctor.resource || ctor.model && ctor.model.resource;

    if (resource) {
      let resourceId;
      const client = ctor.resourceClient || model.collection && model.collection.constructor.resourceClient || ctor.model && ctor.model.resourceClient;

      if (!client) {
        throw new Error(`resourceClient not defined for ${ctor.name}${model.cid ? ` (${model.cid})` : ''}`);
      }

      const resourceDef = findResourceDef(client, resource);

      if (model instanceof Model) {
        const idAttribute = 'idAttribute' in resourceDef ? resourceDef.idAttribute : model.idAttribute;

        if (idAttribute) {
          resourceId = model.get(idAttribute);
        } else if (method === 'create') {
          method = 'update';
        }
      }

      options = options ? Object.assign({}, options) : {};
      options.url = client.baseUrl + getResourcePath(resourceDef, model.params, resourceId);
    }

    return originalSync(method, model, options);
  };
}
const paramsMixin = {
  clearParams() {
    this.params && (this.params = {});
  },

  setParam(name, value) {
    this.params || (this.params = {});
    this.params[name] = value;
  }

};

class ResourceModel extends Model {}

class ResourceCollection extends Collection {}

Object.assign(ResourceModel.prototype, paramsMixin);
Object.assign(ResourceCollection.prototype, paramsMixin);

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

/**
 * A container for all the models of a particular type. Manages requests to your
 * server.
 * Original author: James Kyle <me@thejameskyle.com>
 * @example
 * var BookStorage = Storage.extend({
 *   model: Book,
 *   collection: Books
 * });
 * var bookStorage = new BookStorage();
 *
 * bookStorage.find(1).then(function(model) {
 *   model.doSomething();
 * });
 *
 * bookStorage.findAll().then(function(collection) {
 *   collection.doSomething();
 * });
 *
 * var book = new Book({ title: 'Lord of the Flies' });
 *
 * bookStorage.save(book).then(function() {
 *   book.isNew(); // false
 * });
 *
 * @public
 * @class Storage
 */

class Storage extends Events {
  /**
   * The model class to store.
   * @type {Model}
   */

  /**
   * The collection class to store.
   * @type {Collection}
   */

  /**
   * @public
   * @constructs Storage
   */
  constructor() {
    super();
    this.records = new this.constructor.collection();
    this.listenToOnce(this.records, 'sync', () => {
      this._hasSynced = true;
    });
  }
  /**
   * Find a specific model from the store or fetch it from the server and insert
   * it into the store.
   *
   * @public
   * @instance
   * @method find
   * @memberOf Storage
   * @param {Number|String|Object|Model} model - The model to find.
   * @param {Boolean} forceFetch - Force fetch model from server.
   * @returns {Promise} - A promise that will resolve to the model.
   */


  find(model, forceFetch = false) {
    let record = this.records.get(model);

    if (record && !forceFetch) {
      return Promise.resolve(record);
    } else {
      model = this._ensureModel(model);
      return Promise.resolve(model.fetch()).then(() => {
        return this.insert(model);
      });
    }
  }
  /**
   * Find all the models in the store or fetch them from the server if they
   * haven't been fetched before.
   *
   * @public
   * @instance
   * @method findAll
   * @memberOf Storage
   * @param {Object} options - Options to pass to collection fetch. Also allows
   * setting parameters on collection.
   * @param {Boolean} forceFetch - Force fetch model from server.
   * @returns {Promise} - A promise that will resolve to the entire collection.
   */


  findAll(options = {}, forceFetch = false) {
    if (this._hasSynced && !forceFetch) {
      return Promise.resolve(this.records);
    } else {
      return Promise.resolve(this.records.fetch(options)).then(() => {
        return this.records;
      });
    }
  }
  /**
   * Save a model to the server.
   *
   * @public
   * @instance
   * @method save
   * @memberOf Storage
   * @param {Number|String|Object|Model} model - The model to save
   * @returns {Promise} - A promise that will resolve to the saved model.
   */


  save(model, options) {
    let attributes;
    let record = this.records.get(model);

    if (record) {
      if (typeof model === 'object' && record !== model) {
        attributes = model instanceof this.constructor.model ? model.attributes : model;
      }

      model = record;
    } else {
      model = this._ensureModel(model);
    }

    return Promise.resolve(model.save(attributes, options)).then(() => {
      if (!record) {
        this.insert(model);
      }

      return model;
    });
  }
  /**
   * Insert a model into the store.
   *
   * @public
   * @instance
   * @method insert
   * @memberOf Storage
   * @params {Object|Model} - The model to add.
   * @returns {Promise} - A promise that will resolve to the added model.
   */


  insert(model) {
    model = this.records.add(model, {
      merge: true
    });
    return Promise.resolve(model);
  }
  /**
   * Ensure that we have a real model from an id, object, or model.
   *
   * @private
   * @instance
   * @method _ensureModel
   * @memberOf Storage
   * @params {Number|String|Object|Model} - An id, object, or model.
   * @returns {Model} - The model.
   */


  _ensureModel(model) {
    const ModelClass = this.constructor.model;

    if (model instanceof ModelClass) {
      return model;
    } else if (typeof model === 'object') {
      return new ModelClass(model);
    } else {
      return new ModelClass({
        id: model
      });
    }
  }

}

_defineProperty(Storage, "model", Model);

_defineProperty(Storage, "collection", Collection);

export { ResourceCollection, ResourceModel, Storage, createResourceSync, paramsMixin };
//# sourceMappingURL=nextbone-state.js.map
