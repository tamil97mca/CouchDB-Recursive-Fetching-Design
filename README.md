# CouchDB Search Design Document Basic

```

{
  "_id": "_design/relationshipSearch",
  "language": "javascript",
  "indexes": {
    "objectSearch": {
      "analyzer": "standard",
      "index": "function(doc) {
        function indexAll(doc) {
          for (var key in doc) {
            if (doc.hasOwnProperty(key)) {
              index(key, doc[key], {"store": true});
            }
          }
        }
        if (doc.type) {
          index('type', doc.type, {"store": true});
          indexAll(doc); // Index all fields for search
        }
      }"
    }
  }
}

```

# CouchDB Search Design Document Advance

```

{
  "_id": "_design/relationshipSearch",
  "language": "javascript",
  "indexes": {
    "objectSearch": {
      "analyzer": "standard",
      "index": function(doc) {
        function indexAll(obj, prefix) {
          for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
              var fullKey = prefix ? prefix + '.' + key : key;
              var value = obj[key];

              if (value === null) {
                index(fullKey, 'null', {"store": true});
              } else {
                switch (typeof value) {
                  case 'object':
                    if (Array.isArray(value)) {
                      value.forEach(function(item, i) {
                        indexAll({"" + i: item}, fullKey);
                      });
                    } else if (value instanceof Date) {
                      index(fullKey, value.toISOString(), {"store": true, "facet": true});
                    } else {
                      indexAll(value, fullKey);
                    }
                    break;
                  case 'boolean':
                    index(fullKey, value.toString(), {"store": true, "facet": true});
                    break;
                  case 'number':
                    index(fullKey, value, {"store": true, "facet": true});
                    // Index as string for text search
                    index(fullKey + '_text', value.toString(), {"store": true});
                    break;
                  case 'string':
                    index(fullKey, value, {"store": true});
                    // Add length as a separate field for potential filtering
                    index(fullKey + '_length', value.length, {"store": true, "facet": true});
                    break;
                  default:
                    index(fullKey, value.toString(), {"store": true});
                }
              }
            }
          }
        }

        if (doc._id) {
          index('_id', doc._id, {"store": true});
        }

        if (doc.type) {
          index('type', doc.type, {"store": true, "facet": true});
        }

        indexAll(doc);

        // Add a field for the document's last modification time
        if (doc._rev) {
          var revisionNumber = parseInt(doc._rev.split('-')[0]);
          index('_lastModified', revisionNumber, {"store": true, "facet": true});
        }
      }
    }
  }
}

```
