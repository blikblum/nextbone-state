import { Model, Collection } from 'nextbone'
import { extend } from 'lodash-es'
import { compile } from 'path-to-regexp'

function getResourcePath(resourceDef, params = {}, resourceId) {
  const toPath = compile(resourceDef.path)
  let query = ''
  if (resourceDef.params) {
    resourceDef.params.forEach(paramDef => {
      const paramValue = params[paramDef.name]
      const isQuery = paramDef.location === 'query'
      const isRequired =
        (typeof paramDef.required === 'undefined' && !isQuery) || paramDef.required === true
      if (isRequired && paramValue == null) {
        throw new Error(`Param ${paramDef.name} is not defined for resource ${resourceDef.name}`)
      }
      if (isQuery && paramValue != null) {
        query += `${query ? '&' : ''}${encodeURIComponent(paramDef.name)}=${encodeURIComponent(
          paramValue
        )}`
      }
    })
  }
  let result = toPath(params)
  if (resourceId) {
    result = result.replace(/[^/]$/, '$&/') + encodeURIComponent(resourceId)
  }
  if (query) {
    result += `?${query}`
  }
  return result
}

function findResourceDef(client, resource) {
  const result = client.resourceDefs.find(def => def.name === resource)
  if (!result) {
    throw new Error(`Unable to find resource definition for ${resource}`)
  }
  return result
}

export function createResourceSync(originalSync) {
  return function resourceSync(method, model, options) {
    const ctor = model.constructor
    const resource = ctor.resource || (ctor.model && ctor.model.resource)
    if (resource) {
      let resourceId
      const client =
        ctor.resourceClient ||
        (model.collection && model.collection.constructor.resourceClient) ||
        (ctor.model && ctor.model.resourceClient)
      if (!client) {
        throw new Error(
          `resourceClient not defined for ${ctor.name}${model.cid ? ` (${model.cid})` : ''}`
        )
      }
      const resourceDef = findResourceDef(client, resource)
      if (model instanceof Model) {
        const idAttribute =
          'idAttribute' in resourceDef ? resourceDef.idAttribute : model.idAttribute
        if (idAttribute) {
          resourceId = model.get(idAttribute)
        } else if (method === 'create') {
          method = 'update'
        }
      }
      options = options ? Object.assign({}, options) : {}
      const params = model.collection
        ? extend({}, model.collection.params, model.params)
        : model.params
      options.url = client.baseUrl + getResourcePath(resourceDef, params, resourceId)
    }
    return originalSync(method, model, options)
  }
}

export const paramsMixin = {
  clearParams() {
    this.params && (this.params = {})
  },

  setParam(name, value) {
    this.params || (this.params = {})
    this.params[name] = value
  }
}

class ResourceModel extends Model {}
class ResourceCollection extends Collection {}
Object.assign(ResourceModel.prototype, paramsMixin)
Object.assign(ResourceCollection.prototype, paramsMixin)

export { ResourceModel, ResourceCollection }
