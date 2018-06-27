import { Model } from 'backbone'
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
        query += `${query ? '&' : ''}${paramDef.name}=${paramValue}`
      }
    })
  }
  if (resourceId) {
    result += `/${resourceId}`
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

function getUrlForModel (model) {
  const client = model.resourceClient || (model.collection || model.collection.resourceClient)
  if (!client) {
    throw new Error(`resourceClient not defined for ${model.cid}`)
  }
  const resourceDef = findResourceDef(client, model.resource)
  return client.baseUrl + getResourcePath(resourceDef, model.params)
}

export function createResourceSync (originalSync) {
  return function resourceSync (method, model, options) {
    if (model.resource) {
      if (model instanceof Model) {
        options.url = getUrlForModel(model)
      } else {

      }
    }
    return originalSync(method, model, options)
  }
}

export const ResourceModel = Model.extend({

})
