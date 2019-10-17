#!/usr/bin/python3

from pymongo import MongoClient

# fetches the version nr from the object history and updated the
# the treenode with it
mongo_host = 'localhost'
mongo_port = 27017
mongo_db_name = 'cpt'

client = MongoClient(mongo_host, mongo_port)
db = client[mongo_db_name]

node_collection = db.treeNode
history_collection = db.objectHistory

for node in node_collection.find():
  print (f"updating {node['name']}")
  treeNodeId = node["_id"]
  historyNodeId = f"history_TreeNode_{treeNodeId}"
  historyNode = history_collection.find_one({"_id": historyNodeId})
  lastVersion = historyNode["previousVersions"].pop()
  versionId = lastVersion["versionId"]
  node["version"] = versionId
  node_collection.save(node)
