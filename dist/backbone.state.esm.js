import Backbone, { Model, Collection } from 'backbone';
import pathToRegexp from 'path-to-regexp';

function getResourcePath(resourceDef) {
  var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var resourceId = arguments[2];

  var toPath = pathToRegexp.compile(resourceDef.path);
  var query = '';
  var result = toPath(params);
  if (resourceDef.params) {
    resourceDef.params.forEach(function (paramDef) {
      var paramValue = params[paramDef.name];
      var isQuery = paramDef.location === 'query';
      var isRequired = typeof paramDef.required === 'undefined' && !isQuery || paramDef.required === true;
      if (isRequired && paramValue == null) {
        throw new Error('Param ' + paramDef.name + ' is not defined for resource ' + resourceDef.name);
      }
      if (isQuery && paramValue != null) {
        query += '' + (query ? '&' : '') + encodeURIComponent(paramDef.name) + '=' + encodeURIComponent(paramValue);
      }
    });
  }
  if (resourceId) {
    result = result.replace(/[^/]$/, '$&/') + encodeURIComponent(resourceId);
  }
  if (query) {
    result += '?' + query;
  }
  return result;
}

function findResourceDef(client, resource) {
  var result = client.resourceDefs.find(function (def) {
    return def.name === resource;
  });
  if (!result) {
    throw new Error('Unable to find resource definition for ' + resource);
  }
  return result;
}

function createResourceSync(originalSync) {
  return function resourceSync(method, model, options) {
    if (model.resource) {
      var resourceId = void 0;
      var client = model.resourceClient || model.collection && model.collection.resourceClient;
      if (!client) {
        throw new Error('resourceClient not defined for ' + model.cid);
      }
      var resourceDef = findResourceDef(client, model.resource);
      if (model instanceof Model) {
        var idAttribute = 'idAttribute' in resourceDef ? resourceDef.idAttribute : model.idAttribute;
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

var paramsMixin = {
  clearParams: function clearParams() {
    this.params && (this.params = {});
  },
  setParam: function setParam(name, value) {
    this.params || (this.params = {});
    this.params[name] = value;
  }
};

var ResourceModel = Model.extend(paramsMixin);

var ResourceCollection = Collection.extend(paramsMixin);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var Storage = function () {

  /**
   * @public
   * @constructs Storage
   */


  /**
   * The model class to store.
   * @type {Backbone.Model}
   */
  function Storage() {
    var _this = this;

    _classCallCheck(this, Storage);

    this.records = new this.constructor.collection();
    this.listenToOnce(this.records, 'sync', function () {
      _this._hasSynced = true;
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
   * @param {Number|String|Object|Backbone.Model} model - The model to find.
   * @param {Boolean} forceFetch - Force fetch model from server.
   * @returns {Promise} - A promise that will resolve to the model.
   */


  /**
   * The collection class to store.
   * @type {Backbone.Collection}
   */


  Storage.prototype.find = function find(model) {
    var _this2 = this;

    var forceFetch = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    var record = this.records.get(model);

    if (record && !forceFetch) {
      return Promise.resolve(record);
    } else {
      model = this._ensureModel(model);
      return Promise.resolve(model.fetch()).then(function () {
        return _this2.insert(model);
      });
    }
  };

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


  Storage.prototype.findAll = function findAll() {
    var _this3 = this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var forceFetch = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    if (this._hasSynced && !forceFetch) {
      return Promise.resolve(this.records);
    } else {
      return Promise.resolve(this.records.fetch(options)).then(function () {
        return _this3.records;
      });
    }
  };

  /**
   * Save a model to the server.
   *
   * @public
   * @instance
   * @method save
   * @memberOf Storage
   * @param {Number|String|Object|Backbone.Model} model - The model to save
   * @returns {Promise} - A promise that will resolve to the saved model.
   */


  Storage.prototype.save = function save(model, options) {
    var _this4 = this;

    var attributes = void 0;
    var record = this.records.get(model);
    if (record) {
      if (typeof model === 'object' && record !== model) {
        attributes = model instanceof this.constructor.model ? model.attributes : model;
      }
      model = record;
    } else {
      model = this._ensureModel(model);
    }
    return Promise.resolve(model.save(attributes, options)).then(function () {
      if (!record) {
        _this4.insert(model);
      }
      return model;
    });
  };

  /**
   * Insert a model into the store.
   *
   * @public
   * @instance
   * @method insert
   * @memberOf Storage
   * @params {Object|Backbone.Model} - The model to add.
   * @returns {Promise} - A promise that will resolve to the added model.
   */


  Storage.prototype.insert = function insert(model) {
    model = this.records.add(model, { merge: true });
    return Promise.resolve(model);
  };

  /**
   * Ensure that we have a real model from an id, object, or model.
   *
   * @private
   * @instance
   * @method _ensureModel
   * @memberOf Storage
   * @params {Number|String|Object|Backbone.Model} - An id, object, or model.
   * @returns {Backbone.Model} - The model.
   */


  Storage.prototype._ensureModel = function _ensureModel(model) {
    var ModelClass = this.constructor.model;
    if (model instanceof ModelClass) {
      return model;
    } else if (typeof model === 'object') {
      return new ModelClass(model);
    } else {
      return new ModelClass({ id: model });
    }
  };

  return Storage;
}();

Storage.model = Backbone.Model;
Storage.collection = Backbone.Collection;


Object.assign(Storage.prototype, Backbone.Events);

export { createResourceSync, paramsMixin, ResourceCollection, ResourceModel, Storage };
//# sourceMappingURL=backbone.state.esm.js.map
