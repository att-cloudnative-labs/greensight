#!/usr/bin/python3

from pymongo import MongoClient

# adds the outer process dependencies description to each model tree node
mongo_host = 'localhost'
mongo_port = 27017
mongo_db_name = 'cpt'

client = MongoClient(mongo_host, mongo_port)
db = client[mongo_db_name]

node_collection = db.treeNode

for node in node_collection.find():
  if node['type'] == 'MODEL':
    if 'content' in node and node['content']:
      ids = []
      for processId in node['content']['processes']:
        process = node['content']['processes'][processId]

        if process['type'] == 'GRAPH_MODEL':
          ids.append(process['ref'])
      if ids:
        print(node['name'])
        node['processDependencies'] = ids
        node_collection.save(node)
