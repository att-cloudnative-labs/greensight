# Service Now Configuration Management Database


## Overview

CMDBs are used to keep track of the state of assets such as products, systems, software, facilities, and people as they exist at specific points in time, as well as the relationships between such assets.

The different configurations are stored in a configuration management database, a CMDB, which consists of entities, called Configuration Items, or CIs. 

There are several different types of CIs:

* Hardware
* Software
* Communications/Networks
* Location
* Documentation
* People (staff and contractors)

A CI, in relation to the CPT would represent one of the different components of a model, such as a micro-service component. 


CIs have attributes and can have dependencies and relationships with other CIs.

CMDB baselines are snapshots of the CIs and provide capabilities that help you to understand and control the changes that have been made to your configuration items.

You can review the changes that have been made to that configuration item since a previous baseline. Multiple baselines may be created and the system tracks the changes that have been made per baseline.
Creating a baseline captures the attributes of the CI as well as all first level relationships for the CI. Any changes to the base CI or to any related CIs are captured and displayed. Newly created CIs are not automatically added to a baseline.


A relationship in the CMDB consists of two CIs and a relationship type:

* Parent CI
* Child CI
* Type of the relationship that links both CIs

These CI relationships will represent the connections between the different model components within the tool.

CIs can be grouped together into a CMDB group. CI groups let the user apply CI actions collectively to all the CIs that are members in the group. 

## The CMDB SDK

There are several REST APIs available that allow the user to perform create, update and read operations on the CMDB. The CMDB SDK provides invokable Javascript functions that allow the user to call these APIs for accessing the CMDB. 

Here are several of the Javascript functions that are readily available from the CMDB SDK:

### CMDBGroupAPI - performs actions on CMDB groups

**CMDBGroupAPI.getManualCIList(String groupId, Boolean requireCompleteSet)** 

Returns the CMDB group's manual CI list.

**CMDBGroupAPI.getAllCI( String groupId, Boolean requireCompleteSet)**

Returns all CIs for this group. This includes all manual CIs and the list of CIs from the Query Builder's saved query.


*requireCompleteSet: When true, returns an error string if any CIs are filtered out by other restrictions.


### CMDBUtil - provides utility methods for creating and managing table relationships in the CMDB and managing CMDB baselines

**CMDBUtil.getAllChildrenOfAsCommaList(String baseTable)**

Gets all the child tables of the specified table as a comma-separated list.

**CMDBUtil.createCIRelationship(String tableName, String parentField, String childField, String parentDesc, Object childDesc)**

Creates the specified CI relationship using the specified invocation parameters.

**CMDBUtil.getTables(String tableName)**

Gets a list of all the parents of a table.


## Other possible API calls

Here are several other REST APIs found on https://developer.servicenow.com :

GET /now/table/{tableName}

This API retrieves multiple records for the specified table.

GET /now/table/{tableName}/{sys-id}

This API retrieves the record identified by the specified sys_id from the specified table.

GET -/now/cmdb/instance/{classname}

Query records for a CMDB class.


## Reference

https://docs.servicenow.com/bundle/london-servicenow-platform/page/product/configuration-management/concept/c_ITILConfigurationManagement.html

https://developer.servicenow.com/app.do#!/rest_api_doc?v=jakarta&id=c_TableAPI
