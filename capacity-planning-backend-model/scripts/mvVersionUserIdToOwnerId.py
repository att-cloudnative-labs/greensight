#!/usr/bin/python3

from pymongo import MongoClient

# fetches the version nr from the object history and updated the
# the treenode with it
mongo_host = 'localhost'
mongo_port = 27017
mongo_db_name = 'cpt'

client = MongoClient(mongo_host, mongo_port)
db = client[mongo_db_name]

version_collection = db.treeNodeVersion

for v in version_collection.find():
  if 'userId' in v:
    userId = v['userId']
    print ('updating '+userId)
    v['ownerId'] = userId
    del v['userId']
    version_collection.save(v);
