(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('backbone'), require('backbone-metal')) :
  typeof define === 'function' && define.amd ? define(['exports', 'backbone', 'backbone-metal'], factory) :
  (factory((global.Backbone = global.Backbone || {}, global.Backbone.Storage = {}),global.Backbone,global.Backbone.Metal));
}(this, (function (exports,Backbone,Metal) { 'use strict';

  Backbone = Backbone && Backbone.hasOwnProperty('default') ? Backbone['default'] : Backbone;
  Metal = Metal && Metal.hasOwnProperty('default') ? Metal['default'] : Metal;

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  /**
   * A container for all the models of a particular type. Manages requests to your
   * server.
   *
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
  var Storage = Backbone.Storage = Metal.Class.extend({

    /**
     * The model class to store.
     * @type {Backbone.Model}
     */
    model: Backbone.Model,

    /**
     * The collection class to store.
     * @type {Backbone.Collection}
     */
    collection: Backbone.Collection,

    /**
     * @public
     * @constructs Storage
     */
    constructor: function constructor() {
      var _this = this;

      this.records = new this.collection();
      this.listenToOnce(this.records, 'sync', function () {
        _this._hasSynced = true;
      });
      this._super.apply(this, arguments);
    },


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
    find: function find(model) {
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
    },


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
    findAll: function findAll() {
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
    },


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
    save: function save(model) {
      var _this4 = this;

      var record = this.records.get(model);
      model = record || this._ensureModel(model);
      return Promise.resolve(model.save()).then(function () {
        if (!record) {
          _this4.insert(model);
        }
        return model;
      });
    },


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
    insert: function insert(model) {
      model = this.records.add(model, { merge: true });
      return Promise.resolve(model);
    },


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
    _ensureModel: function _ensureModel(model) {
      if (model instanceof this.model) {
        return model;
      } else if ((typeof model === 'undefined' ? 'undefined' : _typeof(model)) === 'object') {
        return new this.model(model);
      } else {
        return new this.model({ id: model });
      }
    }
  });

  exports.Storage = Storage;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=index.js.map
