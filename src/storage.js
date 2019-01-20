import { Collection, Model, Events } from 'nextbone'

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
  static model = Model

  /**
   * The collection class to store.
   * @type {Collection}
   */
  static collection = Collection

  /**
   * @public
   * @constructs Storage
   */
  constructor () {
    super()
    this.records = new this.constructor.collection()
    this.listenToOnce(this.records, 'sync', () => {
      this._hasSynced = true
    })
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
  find (model, forceFetch = false) {
    let record = this.records.get(model)

    if (record && !forceFetch) {
      return Promise.resolve(record)
    } else {
      model = this._ensureModel(model)
      return Promise.resolve(model.fetch()).then(() => {
        return this.insert(model)
      })
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
  findAll (options = {}, forceFetch = false) {
    if (this._hasSynced && !forceFetch) {
      return Promise.resolve(this.records)
    } else {
      return Promise.resolve(this.records.fetch(options)).then(() => {
        return this.records
      })
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
  save (model, options) {
    let attributes
    let record = this.records.get(model)
    if (record) {
      if (typeof model === 'object' && record !== model) {
        attributes = model instanceof this.constructor.model ? model.attributes : model
      }
      model = record
    } else {
      model = this._ensureModel(model)
    }
    return Promise.resolve(model.save(attributes, options)).then(() => {
      if (!record) {
        this.insert(model)
      }
      return model
    })
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
  insert (model) {
    model = this.records.add(model, { merge: true })
    return Promise.resolve(model)
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
  _ensureModel (model) {
    const ModelClass = this.constructor.model
    if (model instanceof ModelClass) {
      return model
    } else if (typeof model === 'object') {
      return new ModelClass(model)
    } else {
      return new ModelClass({ id: model })
    }
  }
}

export default Storage
