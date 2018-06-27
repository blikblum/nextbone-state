/* eslint-env jest */

import Backbone from 'backbone'
import { Storage } from '../../src/index'

Backbone.Storage = Storage

describe('Storage', () => {
  let testContext

  beforeEach(() => {
    testContext = {}
  })

  describe('#find', () => {
    beforeEach(() => {
      testContext.storage = new Backbone.Storage()
      testContext.model1 = new Backbone.Model({ id: 1 })
      testContext.model2 = new Backbone.Model({ id: 2 })

      jest.spyOn(Backbone.Model.prototype, 'fetch').mockImplementation(() => testContext.model2)

      return testContext.storage.insert(testContext.model1)
    })

    afterEach(() => {
      Backbone.Model.prototype.fetch.mockClear()
    })

    test('should not fetch twice', () => {
      return testContext.storage.find(2).then(function () {
        return testContext.storage.find(2)
      }).then(function (model) {
        expect(model).toBeInstanceOf(Backbone.Model)
        expect(model.id).toBe(2)
        expect(Backbone.Model.prototype.fetch).toHaveBeenCalledTimes(1)
      })
    })

    test('should call fetch when forceFetch is true', () => {
      return testContext.storage.find(2).then(function () {
        return testContext.storage.find(2, true)
      }).then(function () {
        expect(Backbone.Model.prototype.fetch).toHaveBeenCalledTimes(2)
      })
    })

    describe('by id', () => {
      test('should return the record if it exists', () => {
        return testContext.storage.find(1).then(function (model) {
          expect(model).toBe(testContext.model1)
          expect(Backbone.Model.prototype.fetch).not.toHaveBeenCalled()
        })
      })

      test('should fetch the model if no record exists', () => {
        return testContext.storage.find(2).then(function (model) {
          expect(model).toBeInstanceOf(Backbone.Model)
          expect(model.id).toBe(2)
          expect(Backbone.Model.prototype.fetch).toHaveBeenCalledTimes(1)
        })
      })
    })

    describe('by object', () => {
      test('should return the record if it exists', () => {
        return testContext.storage.find({ id: 1 }).then(function (model) {
          expect(model).toBe(testContext.model1)
          expect(Backbone.Model.prototype.fetch).not.toHaveBeenCalled()
        })
      })

      test('should fetch the model if no record exists', () => {
        return testContext.storage.find({ id: 2 }).then(function (model) {
          expect(model).toBeInstanceOf(Backbone.Model)
          expect(model.id).toBe(2)
          expect(Backbone.Model.prototype.fetch).toHaveBeenCalled()
        })
      })
    })

    describe('by model', () => {
      test('should return the record if it exists', () => {
        return testContext.storage.find(testContext.model1).then(function (model) {
          expect(model).toBe(testContext.model1)
          expect(Backbone.Model.prototype.fetch).not.toHaveBeenCalled()
        })
      })

      test('should fetch the model if no record exists', () => {
        return testContext.storage.find(testContext.model2).then(function (model) {
          expect(model).toBe(testContext.model2)
          expect(Backbone.Model.prototype.fetch).toHaveBeenCalled()
        })
      })
    })
  })

  describe('#findAll', () => {
    beforeEach(() => {
      testContext.storage = new Backbone.Storage()
      testContext.model1 = new Backbone.Model({ id: 1 })
      testContext.model2 = new Backbone.Model({ id: 2 })

      testContext.insertModels = function () {
        return Promise.all([
          testContext.storage.insert(testContext.model1),
          testContext.storage.insert(testContext.model2)
        ])
      }

      jest.spyOn(Backbone.Collection.prototype, 'fetch').mockImplementation(testContext.insertModels)
    })

    afterEach(() => {
      Backbone.Model.prototype.fetch.mockClear()
    })

    test('should return the collection if it has been fetched', () => {
      testContext.storage.records.trigger('sync')
      return testContext.insertModels().then(function () {
        return testContext.storage.findAll()
      }).then(function (collection) {
        expect(collection.length).toBe(2)
        expect(collection).toBe(testContext.storage.records)
        expect(Backbone.Collection.prototype.fetch).not.toHaveBeenCalled()
      })
    })

    test('should call fetch when forceFetch is true', () => {
      return testContext.storage.findAll().then(function () {
        return testContext.storage.findAll({}, true)
      }).then(function () {
        expect(Backbone.Collection.prototype.fetch).toHaveBeenCalledTimes(2)
      })
    })

    test('should fetch the collection if it has not been fetched', () => {
      return testContext.storage.findAll().then(function (collection) {
        expect(collection.length).toBe(2)
        expect(collection).toBe(testContext.storage.records)
        expect(Backbone.Collection.prototype.fetch).toHaveBeenCalled()
      })
    })

    test(
      'should add data parameters on collection url if set in findAll',
      () => {
        return testContext.storage.findAll({
          data: {
            sortBy: 'name'
          }
        }).then(function () {
          expect(Backbone.Collection.prototype.fetch).toHaveBeenCalledWith({
            data: {
              sortBy: 'name'
            }
          })
        })
      }
    )
  })

  describe('#save', () => {
    beforeEach(() => {
      testContext.storage = new Backbone.Storage()
      testContext.model1 = new Backbone.Model({ id: 1 })
      testContext.model2 = new Backbone.Model({ id: 2 })

      testContext.saveSpy = jest.spyOn(Backbone.Model.prototype, 'save').mockImplementation(() => null)

      return testContext.storage.insert(testContext.model1)
    })

    test('should insert a non-existing model', () => {
      return testContext.storage.save(testContext.model2).then(function (model) {
        expect(testContext.storage.records.get(2)).toBe(model)
      })
    })

    describe('by id', () => {
      test('should save an existing model', () => {
        return testContext.storage.save(1).then(function (model) {
          expect(model).toBeInstanceOf(Backbone.Model)
          expect(model.id).toBe(1)
          expect(testContext.saveSpy).toHaveBeenCalled()
        })
      })

      test('should save a non-existing model', () => {
        return testContext.storage.save(2).then(function (model) {
          expect(model).toBeInstanceOf(Backbone.Model)
          expect(model.id).toBe(2)
          expect(Backbone.Model.prototype.save).toHaveBeenCalled()
          expect(testContext.storage.records.get(2)).toBe(model)
        })
      })
    })

    describe('by object', () => {
      test('should save an existing model', () => {
        return testContext.storage.save({ id: 1 }).then(function (model) {
          expect(model).toBeInstanceOf(Backbone.Model)
          expect(model.id).toBe(1)
          expect(Backbone.Model.prototype.save).toHaveBeenCalled()
        })
      })

      test('should save a non-existing model', () => {
        return testContext.storage.save({ id: 2 }).then(function (model) {
          expect(model).toBeInstanceOf(Backbone.Model)
          expect(model.id).toBe(2)
          expect(Backbone.Model.prototype.save).toHaveBeenCalled()
          expect(testContext.storage.records.get(2)).toBe(model)
        })
      })
    })

    describe('by model', () => {
      test('should save an existing model', () => {
        return testContext.storage.save(testContext.model1).then(function (model) {
          expect(model).toBe(testContext.model1)
          expect(Backbone.Model.prototype.save).toHaveBeenCalled()
        })
      })

      test('should save a non-existing model', () => {
        return testContext.storage.save(testContext.model2).then(function (model) {
          expect(model).toBe(testContext.model2)
          expect(Backbone.Model.prototype.save).toHaveBeenCalled()
          expect(testContext.storage.records.get(2)).toBe(model)
        })
      })
    })
  })

  describe('#insert', () => {
    beforeEach(() => {
      testContext.storage = new Backbone.Storage()
    })

    describe('by object', () => {
      test('should create a new model and insert it', () => {
        return testContext.storage.insert({ id: 1 }).then(function (model) {
          expect(model.id).toBe(1)
          expect(testContext.storage.records.get(1)).toBe(model)
        })
      })
    })

    describe('by model', () => {
      test('should insert the model', () => {
        var model1 = new Backbone.Model({ id: 1 })
        return testContext.storage.insert(model1).then(function (model) {
          expect(model).toBe(model1)
          expect(testContext.storage.records.get(1)).toBe(model1)
        })
      })
    })
  })
})
