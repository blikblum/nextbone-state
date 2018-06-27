/* eslint-env jest */
import { ResourceModel, createResourceSync } from '../../src/index'
import { Model, Collection } from 'backbone'

const resourceDefs = [
  {
    'name': 'patient',
    'path': 'patients',
    'params': [
      {
        'name': 'registry',
        'location': 'query'
      }
    ]
  },
  {
    'name': 'patientbyregistry',
    'path': 'patients/search',
    'params': [
      {
        'name': 'registry',
        'location': 'query',
        'required': true
      }
    ]
  },
  {
    'name': 'patientaccompaniment',
    'path': 'patients/:patientid/accompaniments',
    'params': [
      {
        'name': 'patientid'
      }
    ]
  },
  {
    'name': 'accompanimentdata',
    'path': 'patients/:patientid/accompanimentdata',
    'params': [
      {
        'name': 'patientid'
      }
    ],
    'idField': ''
  },
  {
    'name': 'patientevaluation',
    'path': 'patients/:patientid/evaluations',
    'params': [
      {
        'name': 'patientid'
      }
    ],
    'idField': 'date'
  },
  {
    'name': 'crdpatient',
    'path': 'patients/crd'
  }
]

const baseUrl = 'http://base/'

const resourceClient = {
  baseUrl: baseUrl,
  resourceDefs: resourceDefs
}

describe('createResourceSync', () => {
  let originalSyncSpy
  let resourceSync
  let model
  let options

  beforeEach(() => {
    originalSyncSpy = jest.fn()
    resourceSync = createResourceSync(originalSyncSpy)
  })

  describe('with a model without resource', () => {
    beforeEach(() => {
      model = new Model()
      options = {parse: true}
    })

    test('should pass unaltered options', () => {
      resourceSync('GET', model, options)
      expect(originalSyncSpy).toBeCalledWith('GET', model, options)
    })
  })

  describe('with a model with resource', () => {
    beforeEach(() => {
      model = new Model()
      model.resourceClient = resourceClient
      options = {}
    })

    const cases = test.each`
      resource | params | url
      ${'patient'} | ${{}} | ${'patients'}
      ${'patient'} | ${{registry: 2}} | ${'patients?registry=2'}
      ${'patientbyregistry'} | ${{registry: 3}} | ${'patients/search?registry=3'}
      ${'patientaccompaniment'} | ${{patientid: 1}} | ${'patients/1/accompaniments'}
      ${'accompanimentdata'} | ${{patientid: 2}} | ${'patients/2/accompanimentdata'}
      ${'patientevaluation'} | ${{patientid: 3}} | ${'patients/3/evaluations'}
      ${'crdpatient'} | ${{}} | ${'patients/crd'}      
      `
    cases('should pass url $url when resource is $resource and params is $params', ({resource, params, url}) => {
      const expectedUrl = baseUrl + url
      model.resource = resource
      model.params = params
      resourceSync('GET', model, options)
      expect(originalSyncSpy).toBeCalledWith('GET', model, {url: expectedUrl})
    })
  })
})
