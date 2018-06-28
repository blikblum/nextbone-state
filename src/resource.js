import { Model, Collection } from 'backbone'
import pathToRegexp from 'path-to-regexp'

function getResourcePath (resourceDef, params = {}, resourceId) {
  const toPath = pathToRegexp.compile(resourceDef.path)
  let query = ''
  let result = toPath(params)
  if (resourceDef.params) {
    resourceDef.params.forEach(paramDef => {
      const paramValue = params[paramDef.name]
      const isQuery = paramDef.location === 'query'
      const isRequired = (typeof paramDef.required === 'undefined' && !isQuery) || paramDef.required === true
      if (isRequired && paramValue == null) {
        throw new Error(`Param ${paramDef.name} is not defined for resource ${resourceDef.name}`)
      }
      if (isQuery && paramValue != null) {
        query += `${query ? '&' : ''}${encodeURIComponent(paramDef.name)}=${encodeURIComponent(paramValue)}`
      }
    })
  }
  if (resourceId) {
    result = result.replace(/[^/]$/, '$&/') + encodeURIComponent(resourceId)
  }
  if (query) {
    result += `?${query}`
  }
  return result
}

function findResourceDef (client, resource) {
  const result = client.resourceDefs.find(def => def.name === resource)
  if (!result) {
    throw new Error(`Unable to find resource definition for ${resource}`)
  }
  return result
}

export function createResourceSync (originalSync) {
  return function resourceSync (method, model, options) {
    if (model.resource) {
      let resourceId
      const client = model.resourceClient || (model.collection && model.collection.resourceClient)
      if (!client) {
        throw new Error(`resourceClient not defined for ${model.cid}`)
      }
      const resourceDef = findResourceDef(client, model.resource)
      if (model instanceof Model) {
        const idAttribute = 'idAttribute' in resourceDef ? resourceDef.idAttribute : model.idAttribute
        if (idAttribute) {
          resourceId = model.get(idAttribute)
        } else if (method === 'create') {
          method = 'update'
        }
      }
      options = options ? Object.assign({}, options) : {}
      options.url = client.baseUrl + getResourcePath(resourceDef, model.params, resourceId)
    }
    return originalSync(method, model, options)
  }
}

export const paramsMixin = {
  clearParams () {
    this.params && (this.params = {})
  },

  setParam (name, value) {
    this.params || (this.params = {})
    this.params[name] = value
  }
}

export const ResourceModel = Model.extend(paramsMixin)

export const ResourceCollection = Collection.extend(paramsMixin)
