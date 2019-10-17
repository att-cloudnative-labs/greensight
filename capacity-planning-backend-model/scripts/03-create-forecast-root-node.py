#!/usr/bin/python3

from pymongo import MongoClient

# Creates the root node for the TreeNode structure.

mongo_host = 'localhost'
mongo_port = 27017
mongo_db_name = 'cpt'

client = MongoClient(mongo_host, mongo_port)
db = client[mongo_db_name]

new_collection = db.treeNode

new_document = {
    "_id": "fc_root",
    "_class": "com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.model.treenode.TreeNode",
    "name": "fc_root",
    "type": "FOLDER",
    "ancestors": [],
    "accessControl": "ADVANCED",
    "acl": [
        { "type": "ALL",
          "_id": None,
          "permissions": [
              "READ",
              "CREATE"
          ]
        }
    ]
}

new_collection.save(new_document)

object_history_collection = db.objectHistory

new_history = {
    "_id": "history_TreeNode_fc_root",
    "_class": "com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.model.ObjectHistory",
    "objectId": "fc_root",
    "type": "TreeNode",
    "previousVersions": [
        {
            "versionId": 1,
            "timestamp": "2019-01-29T16:10:09Z",
            "userId": "admin",
            "object": {
                "_id": "fc_root",
                "_class": "com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.model.treenode.TreeNode",
                "name": "fc_root",
                "type": "FOLDER",
                "ancestors": [],
                "accessControl": "ADVANCED",
                "acl": [
                    { "type": "ALL",
                      "_id": None,
                      "permissions": [
                          "READ",
                          "CREATE"
                      ]
                    }
                ]
            }
        }
    ]
}

object_history_collection.save(new_history)
