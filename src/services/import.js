'use strict';

var projectService = require('./../../src/services/project');
var dataService = require('./../../src/services/data');
var collectionService = require('./../../src/services/collection');
var searchService = require('./../../src/services/search');
var elasticMapping = require('./../../src/elastic/mapping');
var _ = require('underscore');
var fs = require('fs-extra');

(function(module) {

  /**
   * import json and create full project
   * ensure project
   * ensure mapping
   * add documents
   */
  module.import = function(data, callback) {
    collectionService.findCollectionAsync({
      name: data.collectionName
    })
    .then(function(res) {
      data.projectName = res.project;
      return projectService.ensureCollectionAsync(data)
    })
    .then(function(res) {
      dataService.addAllDocuments(data, function(err, res) {
        if (err) {
          return callback(err);
        }
        callback(null, res);
      });
    });
  }

  /**
   * export collection
   */
  module.exportAsync = function(data) {
    return searchService.searchAsync({
      name: data.collectionName,
      project: data.projectName,
      per_page: data.limit || 100
    })
    .then(function(res) {
      return res.data.items;
    })
    .then(function(res) {
      return fs.writeFileAsync(
        './data/exports/collection.json',
        JSON.stringify(res, null, 4),
        {encoding: 'utf8'}
      );
    })
  }

  /**
   * import elastic type and save it to local collections
   */
  module.importElasticTypeMappingAsync = function(data, callback) {
    return elasticMapping.getOneMappingAsync(data)
    .then(function(res) {
      return collectionService.addCollectionAsync({
        name: res.type,
        project: res.index,
        schema: res.properties,
        table: {
          fields: _.keys(res.properties)
        }
      });
    })
  }
}(exports));
