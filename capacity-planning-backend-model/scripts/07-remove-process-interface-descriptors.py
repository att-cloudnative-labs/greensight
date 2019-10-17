#!/usr/bin/python3

from pymongo import MongoClient

# adds the outer process interface description to each model tree node
mongo_host = 'localhost'
mongo_port = 27017
mongo_db_name = 'cpt'

client = MongoClient(mongo_host, mongo_port)
db = client[mongo_db_name]

node_collection = db.treeNode

for node in node_collection.find():
  if node['type'] == 'MODEL':
    if 'processInterface' in node:
      print (node["name"])
      del node['processInterface']
      node_collection.save(node)