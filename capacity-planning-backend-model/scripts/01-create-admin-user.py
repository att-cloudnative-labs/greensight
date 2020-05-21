#!/usr/bin/python3

from pymongo import MongoClient

# Creates the root node for the TreeNode structure.

mongo_host = 'localhost'
mongo_port = 27017
mongo_db_name = 'cpt'

client = MongoClient(mongo_host, mongo_port)
db = client[mongo_db_name]

user_collection = db.appUser

admin_user_document = {
    "_class" : "com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.model.AppUser",
    "isLdapUser" : "false",
    "username" : "admin",
    "password" : "$2a$10$YzQ8Csg.hNHbv2nqNk0N5OJYOc8t7iCP1u2oszLjJZXS8o.w.p1q.",
    "role" : "ADMIN",
    "settings" : {
        "BREAKDOWN_DECIMAL" : "1",
        "VARIABLE_DECIMAL" : "2",
        "SIGMA" : "75,95,99",
        "COMMA_CHECK" : "false",
        "TIMEZONE" : "US/Pacific: GMT-0800"
    }
}

user_collection.save(admin_user_document)
