# Nextbone State

State classes for Nextbone Models and Collections.

## Usage

### Storage

Manage data in a centralized store

> _**Note:** Storage class requires a global `Promise` object to
> exist, please include a `Promise` polyfill if necessary.
> It also uses ES6 classes with class properties feature which may require transpilation_

In order to create a new Store extend the `Storage` class and set the model and
collection to the correct classes.

```js
import { Storage } from 'nextbone-state';
import { Book } from './model';
import { Books } from './collection';

class BookStore extends Storage {
  static model = Book
  static collection = Books
};

var bookStore = new BookStore();
```

#### `find`

In order to retrieve a model from the store simply call `find()` with an id,
an object with an id, or a model instance with an id. If the model does not
exist in the store, it will be fetched from the server via the model's `fetch()` method.

```js
bookStore.find(1).then(model => {
  model.get('name'); // >> A Tale of Two Cities
});
```
You can optionally pass a boolean forceFetch to ensure a call is made to the backend. Default is false.
```js
bookStore.find(1, true);
```

#### `findAll`

To retrieve the entire collection from the store call `findAll()`. If the
collection has not previously been synced it will call the collection's
`fetch()` method.

```js
bookStore.findAll().then(collection => {
  collection.length; // >> 10
});
```

Allows a object 'options' that will get passed to the collection fetch call.
```js
bookStore.findAll({
  data: { sortBy: 'name' }
}).then(collection => {
  collection.length; // >> 10
});
```
You can optionally pass a boolean forceFetch to ensure a call is made to the backend. Default is false.
```js
bookStore.findAll({}, true);
```

#### `save`

When you want to save a model back to the server call the `save()` method with
the model you wish to save. If the model did not previously exist in the store
it will be inserted.

```js
var book = new Book({ name: 'Lolita' });
bookStore.save(book).then(model => {
  model.id; // >> 11
});
```

#### `insert`

To insert a model into the store without any server interaction use the
`insert()` method.

```js
var book = new Book({ name: 'Invisible Man' });
bookStore.insert(book).then(model => {
  model.get('name'); // >> Invisible Man
});
```

### Resource

Configures REST resource endpoints declaratively

#### Setup sync handler

```javascript
import { createResourceSync } from "nextbone-state";
import { sync } from "nextbone"

sync.handler = createResourceSync(sync.handler)
```

#### Configure endpoints

```javascript
import { ResourceCollection, ResourceModel } from "nextbone-state";

const baseUrl = '/cgi-bin/books.cgi/'

const resourceDefs = [
  {
    name: 'book',
    path: 'books',
    params: [
      {
        name: 'author',
        location: 'query'
      }
    ]
  },
  {
    name: 'bookbycategory',
    path: 'categories/:categoryid/books',
    params: [
      {
        name: 'categoryid'        
      }
    ]
  }
]

const resourceClient = {
  baseUrl,
  resourceDefs
}

// configure default resourceClient
ResourceCollection.resourceClient = resourceClient
ResourceModel.resourceClient = resourceClient
```

#### Configure Model/Collection

```javascript
import { ResourceCollection, ResourceModel } from "nextbone-state";

class Books extends ResourceCollection {
  static resource = 'book'
}

const books = new Books()
books.fetch() // calls /cgi-bin/books.cgi/books
books.params.author = 'luiz'
books.fetch() // calls /cgi-bin/books.cgi/books?author=luiz
```


### Getting Started

```
npm install
```

### Running Tests

```
npm test
```

===

© 2019 Luiz Américo Pereira Câmara
