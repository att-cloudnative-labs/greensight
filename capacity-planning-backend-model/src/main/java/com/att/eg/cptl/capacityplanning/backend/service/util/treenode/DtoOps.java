package com.att.eg.cptl.capacityplanning.backend.service.util.treenode;

import com.att.eg.cptl.capacityplanning.backend.dao.UserGroupRepository;
import com.att.eg.cptl.capacityplanning.backend.dao.UserMongoRepository;
import com.att.eg.cptl.capacityplanning.backend.dto.treenode.AccessPermissionDto;
import com.att.eg.cptl.capacityplanning.backend.dto.treenode.TreeNodeDto;
import com.att.eg.cptl.capacityplanning.backend.model.AppUser;
import com.att.eg.cptl.capacityplanning.backend.model.NamedOwnerObject;
import com.att.eg.cptl.capacityplanning.backend.model.UserGroup;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.AccessIdType;
import java.util.*;
import org.apache.commons.lang3.StringUtils;

public class DtoOps {
  public static void addUserAndGroupNames(
      List<TreeNodeDto> dtos, UserMongoRepository userRepo, UserGroupRepository userGroupRepo) {
    Map<String, AppUser> userMap = new HashMap<>();
    Map<String, UserGroup> userGroupMap = new HashMap<>();

    if (dtos == null || dtos.size() < 1) {
      return;
    }

    // figure out which user and groups we need
    for (TreeNodeDto dto : dtos) {
      userMap.putIfAbsent(dto.getOwnerId(), null);
      if (dto.getAcl() != null)
        for (AccessPermissionDto perm : dto.getAcl()) {
          String permId = perm.getId();
          if (StringUtils.isNotBlank(permId)) {
            if (perm.getType() == AccessIdType.GROUP) {
              userGroupMap.putIfAbsent(perm.getId(), null);
            } else if (perm.getType() == AccessIdType.USER) {
              userMap.putIfAbsent(perm.getId(), null);
            }
          }
        }
    }

    // fetch them
    List<AppUser> users = userRepo.findByIdIn(userMap.keySet());
    List<UserGroup> userGroups = userGroupRepo.findByIdIn(userGroupMap.keySet());
    // add to maps
    for (AppUser user : users) {
      if (user.getId() != null) {
        userMap.put(user.getId(), user);
      }
    }
    for (UserGroup group : userGroups) {
      if (group.getId() != null) {
        userGroupMap.put(group.getId(), group);
      }
    }

    // apply to nodes
    for (TreeNodeDto dto : dtos) {
      try {
        dto.setOwnerName(userMap.get(dto.getOwnerId()).getUsername());
      } catch (NullPointerException ignored) {
      }
      ;
      if (dto.getAcl() != null)
        for (AccessPermissionDto perm : dto.getAcl()) {
          String permId = perm.getId();
          if (!StringUtils.isNotBlank(permId)) {
            if (perm.getType() == AccessIdType.GROUP) {
              try {
                perm.setName(userGroupMap.get(permId).getUserGroupName());
              } catch (NullPointerException ignored) {
              }
              ;
            } else if (perm.getType() == AccessIdType.USER) {
              try {
                perm.setName(userMap.get(permId).getUsername());
              } catch (NullPointerException ignored) {
              }
            }
          }
        }
    }
  }

  // FIXME: unify with function above
  public static <T extends NamedOwnerObject> void lookupOwnerNames(
      List<T> dtos, UserMongoRepository userRepo) {
    Map<String, AppUser> userMap = new HashMap<>();
    if (dtos == null || dtos.size() < 1) {
      return;
    }

    // figure out which user and groups we need
    for (NamedOwnerObject dto : dtos) {
      userMap.putIfAbsent(dto.getOwnerId(), null);
    }

    // fetch them
    List<AppUser> users = userRepo.findByIdIn(userMap.keySet());

    // add to maps
    for (AppUser user : users) {
      if (user.getId() != null) {
        userMap.put(user.getId(), user);
      }
    }

    // apply to dtos
    for (NamedOwnerObject dto : dtos) {
      try {
        dto.setOwnerName(userMap.get(dto.getOwnerId()).getUsername());
      } catch (NullPointerException ignored) {
      }
      ;
    }
  }
}
