package com.att.eg.cptl.capacityplanning.backend.controller.util.accesscontrol;

import com.att.eg.cptl.capacityplanning.backend.exception.InvalidPermissionsDefinedException;
import com.att.eg.cptl.capacityplanning.backend.exception.NotFoundException;
import com.att.eg.cptl.capacityplanning.backend.model.AppUser;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

@Component
public class AccessControlUtil {

  /**
   * Check if the user has Read permission for this node.
   *
   * @param appUser The user trying to access/edit this node.
   * @param accessControlledTreeObject The object to check access permissions on.
   * @param ancestors The ancestors of this node.
   * @param usersGroups The user groups which this user is a member of.
   * @return true if the user has read access.
   */
  public boolean doesUserHaveReadPermission(
      AppUser appUser,
      AccessControlledTreeObject accessControlledTreeObject,
      List<? extends AccessControlledTreeObject> ancestors,
      List<String> usersGroups) {
    return doesUserHavePermission(
        appUser,
        accessControlledTreeObject,
        ancestors,
        usersGroups,
        Permission.READ,
        AccessControlType.PUBLIC_READ_ONLY,
        AccessControlType.PUBLIC_READ_WRITE);
  }

  /**
   * Check if the user has Modify permission for this node.
   *
   * @param appUser The user trying to access/edit this node.
   * @param accessControlledTreeObject The object to check access permissions on.
   * @param ancestors The ancestors of this node.
   * @param usersGroups The user groups which this user is a member of.
   * @return true if the user has modify access.
   */
  public boolean doesUserHaveModifyPermission(
      AppUser appUser,
      AccessControlledTreeObject accessControlledTreeObject,
      List<? extends AccessControlledTreeObject> ancestors,
      List<String> usersGroups) {
    return doesUserHavePermission(
        appUser,
        accessControlledTreeObject,
        ancestors,
        usersGroups,
        Permission.MODIFY,
        AccessControlType.PUBLIC_READ_WRITE);
  }

  /**
   * Check if the user has Create permission for this node.
   *
   * @param appUser The user trying to access/edit this node.
   * @param accessControlledTreeObject The object to check access permissions on.
   * @param ancestors The ancestors of this node.
   * @param usersGroups The user groups which this user is a member of.
   * @return true if the user has create access.
   */
  public boolean doesUserHaveCreatePermission(
      AppUser appUser,
      AccessControlledTreeObject accessControlledTreeObject,
      List<? extends AccessControlledTreeObject> ancestors,
      List<String> usersGroups) {
    return doesUserHavePermission(
        appUser,
        accessControlledTreeObject,
        ancestors,
        usersGroups,
        Permission.CREATE,
        AccessControlType.PUBLIC_READ_WRITE);
  }

  /**
   * Check if the user has Delete permission for this node.
   *
   * @param appUser The user trying to access/edit this node.
   * @param accessControlledTreeObject The object to check access permissions on.
   * @param ancestors The ancestors of this node.
   * @param usersGroups The user groups which this user is a member of.
   * @return true if the user has delete access.
   */
  public boolean doesUserHaveDeletePermission(
      AppUser appUser,
      AccessControlledTreeObject accessControlledTreeObject,
      List<? extends AccessControlledTreeObject> ancestors,
      List<String> usersGroups) {
    return doesUserHavePermission(
        appUser,
        accessControlledTreeObject,
        ancestors,
        usersGroups,
        Permission.DELETE,
        AccessControlType.PUBLIC_READ_WRITE);
  }

  /**
   * @param appUser The user trying to retrieve permissions for.
   * @param accessControlledTreeObject The object to check access permissions on.
   * @param ancestors The ancestors of this node.
   * @param usersGroups The user groups which this user is a member of.
   * @return List of the permissions which a user has for this node. Empty if none.
   */
  public List<Permission> getCurrentUsersPermissionsForThisNode(
      AppUser appUser,
      AccessControlledTreeObject accessControlledTreeObject,
      List<? extends AccessControlledTreeObject> ancestors,
      List<String> usersGroups) {
    AccessControlType accessControlType = accessControlledTreeObject.getAccessControl();
    validateAccessControlTypeAndAppUser(accessControlType, appUser);
    if (appUser.getId().equals(accessControlledTreeObject.getOwnerId())
        || AccessControlType.PUBLIC_READ_WRITE.equals(
            accessControlledTreeObject.getAccessControl())) {
      return Arrays.asList(Permission.values());
    }
    if (AccessControlType.PUBLIC_READ_ONLY.equals(accessControlledTreeObject.getAccessControl())) {
      return Collections.singletonList(Permission.READ);
    }
    if (AccessControlType.INHERIT.equals(accessControlledTreeObject.getAccessControl())) {
      List<String> ancestorIds = accessControlledTreeObject.getAncestors();
      validateAncestorIds(ancestorIds);
      return getCurrentUsersPermissionsForThisNode(
          appUser,
          getAncestorFromWhichPermissionsAreInherited(ancestorIds, ancestors),
          null,
          usersGroups);
    }
    if (AccessControlType.ADVANCED.equals(accessControlledTreeObject.getAccessControl())) {
      return getAclPermissions(appUser, accessControlledTreeObject.getAcl(), usersGroups);
    }

    return Collections.emptyList();
  }

  /**
   * Checks if the user has permission for a given Permission type or if the node has one of the
   * given access control types.
   *
   * @param appUser The user trying to access/edit this node.
   * @param accessControlledTreeObject The object to check access permissions on.
   * @param ancestors The ancestors of this node.
   * @param usersGroups The user groups which this user is a member of.
   * @param permissionToCheck The permission type to check.
   * @param accessControlTypesToCheck The access control type(s) to check.
   * @return true if the user has the given permission.
   */
  private boolean doesUserHavePermission(
      AppUser appUser,
      AccessControlledTreeObject accessControlledTreeObject,
      List<? extends AccessControlledTreeObject> ancestors,
      List<String> usersGroups,
      Permission permissionToCheck,
      AccessControlType... accessControlTypesToCheck) {
    AccessControlType accessControlType = accessControlledTreeObject.getAccessControl();
    validateAccessControlTypeAndAppUser(accessControlType, appUser);
    if (appUser.getId().equals(accessControlledTreeObject.getOwnerId())) {
      return true;
    }
    if (accessControlType.equals(AccessControlType.INHERIT)) {
      List<String> ancestorIds = accessControlledTreeObject.getAncestors();
      validateAncestorIds(ancestorIds);
      return doesUserHavePermission(
          appUser,
          getAncestorFromWhichPermissionsAreInherited(ancestorIds, ancestors),
          null,
          usersGroups,
          permissionToCheck,
          accessControlTypesToCheck);
    }
    for (AccessControlType accessControlTypeToCheck : accessControlTypesToCheck) {
      if (accessControlType.equals(accessControlTypeToCheck)) {
        return true;
      }
    }
    if (accessControlType.equals(AccessControlType.ADVANCED)
        && checkAcl(appUser, accessControlledTreeObject.getAcl(), permissionToCheck, usersGroups)) {
      return true;
    }
    return false;
  }

  /**
   * Check if this user has been granted permission in this node's ACL.
   *
   * @param user The user who is attempting to access/edit this node.
   * @param acl The list of permissions given on this node.
   * @param permissionToCheck The type of permission to check for.
   * @param usersGroups The list of user groups that this user is a member of.
   * @return true if this user has been granted permission in the ACL.
   */
  private boolean checkAcl(
      AppUser user,
      List<AccessPermission> acl,
      Permission permissionToCheck,
      List<String> usersGroups) {
    for (AccessPermission accessPermission : acl) {
      if (AccessIdType.ALL.equals(accessPermission.getType())) {
        if (checkIfPermissionIsInPermissionsList(
            accessPermission.getPermissions(), permissionToCheck)) {
          return true;
        }
      } else if (AccessIdType.USER.equals(accessPermission.getType())) {
        if (StringUtils.isBlank(accessPermission.getId())) {
          throw new InvalidPermissionsDefinedException(
              "Access ID Type of user must have an ID set.");
        }
        if (accessPermission.getId().equals(user.getId())
            && checkIfPermissionIsInPermissionsList(
                accessPermission.getPermissions(), permissionToCheck)) {
          return true;
        }
      } else if (AccessIdType.GROUP.equals(accessPermission.getType())) {
        if (StringUtils.isBlank(accessPermission.getId())) {
          throw new InvalidPermissionsDefinedException(
              "Access ID Type of group must have an ID set.");
        }
        for (String userGroupId : usersGroups) {
          if (accessPermission.getId().equals(userGroupId)
              && checkIfPermissionIsInPermissionsList(
                  accessPermission.getPermissions(), permissionToCheck)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Check if this user has been granted permission in this node's ACL.
   *
   * @param user The user who is attempting to access/edit this node.
   * @param acl The list of permissions given on this node.
   * @param usersGroups The list of user groups that this user is a member of.
   * @return true if this user has been granted permission in the ACL.
   */
  private List<Permission> getAclPermissions(
      AppUser user, List<AccessPermission> acl, List<String> usersGroups) {
    Map<Permission, Boolean> permissionFlags = new EnumMap<>(Permission.class);
    for (Permission permission : Permission.values()) {
      permissionFlags.put(permission, false);
    }

    for (AccessPermission accessPermission : acl) {
      if (AccessIdType.ALL.equals(accessPermission.getType())) {
        for (Permission aclItemPermission : accessPermission.getPermissions()) {
          if (aclItemPermission != null) {
            permissionFlags.put(aclItemPermission, true);
          }
        }
      } else if (AccessIdType.USER.equals(accessPermission.getType())) {
        if (StringUtils.isBlank(accessPermission.getId())) {
          throw new InvalidPermissionsDefinedException(
              "Access ID Type of user must have an ID set.");
        }
        if (accessPermission.getId().equals(user.getId())) {
          for (Permission aclItemPermission : accessPermission.getPermissions()) {
            if (aclItemPermission != null) {
              permissionFlags.put(aclItemPermission, true);
            }
          }
        }
      } else if (AccessIdType.GROUP.equals(accessPermission.getType())) {
        if (StringUtils.isBlank(accessPermission.getId())) {
          throw new InvalidPermissionsDefinedException(
              "Access ID Type of group must have an ID set.");
        }
        for (String userGroupId : usersGroups) {
          if (accessPermission.getId().equals(userGroupId)) {
            for (Permission aclItemPermission : accessPermission.getPermissions()) {
              if (aclItemPermission != null) {
                permissionFlags.put(aclItemPermission, true);
              }
            }
          }
        }
      }
    }
    List<Permission> usersPermissions = new ArrayList<>();
    for (Map.Entry<Permission, Boolean> entry : permissionFlags.entrySet()) {
      if (entry.getValue()) {
        usersPermissions.add(entry.getKey());
      }
    }
    return usersPermissions;
  }

  /**
   * Checks if a permission is in a list of permissions.
   *
   * @param permissions The list to check.
   * @param permissionToCheck The permission.
   * @return true if permissionToCheck is present in permissions.
   */
  private boolean checkIfPermissionIsInPermissionsList(
      List<Permission> permissions, Permission permissionToCheck) {
    if (permissions != null) {
      for (Permission permission : permissions) {
        if (permissionToCheck.equals(permission)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Gets the ancestor from which the permissions are to be inherited, taking the first non-inherit
   * ancestor from the list.
   *
   * @param ancestorIds The ordered list of Ids of this node's ancestors
   * @param ancestors The ancestors for this node.
   * @return The ancestor to check for permissions on.
   */
  private AccessControlledTreeObject getAncestorFromWhichPermissionsAreInherited(
      List<String> ancestorIds, List<? extends AccessControlledTreeObject> ancestors) {
    Map<String, AccessControlledTreeObject> idToAncestorMap = new HashMap<>();
    for (AccessControlledTreeObject accessControlledTreeObject : ancestors) {
      idToAncestorMap.put(accessControlledTreeObject.getId(), accessControlledTreeObject);
    }
    for (int curAncestor = ancestorIds.size() - 1; curAncestor >= 0; curAncestor--) {
      String ancestorId = ancestorIds.get(curAncestor);
      AccessControlledTreeObject ancestor = idToAncestorMap.get(ancestorId);
      if (ancestor != null && ancestor.getAccessControl() != AccessControlType.INHERIT) {
        return ancestor;
      }
    }
    throw new NotFoundException("Could not find non-inherit ancestor in ancestors list.");
  }

  /**
   * Checks if Ancestor Ids are valid for a node with INHERIT access control.
   *
   * @param ancestorIds The list of ancestors of this node.
   */
  private void validateAncestorIds(List<String> ancestorIds) {
    if (ancestorIds == null || ancestorIds.isEmpty()) {
      throw new InvalidPermissionsDefinedException(
          "Node with no ancestors defined as having INHERIT accessControl.");
    }
  }

  /**
   * Performs basic validation on AccessControlType and AppUser
   *
   * @param accessControlType The type of access control which the node uses.
   * @param appUser The user who is attempting to access/edit this node.
   */
  private void validateAccessControlTypeAndAppUser(
      AccessControlType accessControlType, AppUser appUser) {
    if (accessControlType == null) {
      throw new InvalidPermissionsDefinedException(
          "No accessControl defined for AccessControlledObject.");
    }
    if (appUser == null) {
      throw new NotFoundException("User not found.");
    } else if (StringUtils.isBlank(appUser.getId())) {
      throw new NotFoundException("User does not have an ID.");
    }
  }
}
