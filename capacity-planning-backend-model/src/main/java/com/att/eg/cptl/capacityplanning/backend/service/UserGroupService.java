package com.att.eg.cptl.capacityplanning.backend.service;

import com.att.eg.cptl.capacityplanning.backend.dto.UserGroupDto;
import com.att.eg.cptl.capacityplanning.backend.model.UserGroup;
import java.util.List;

public interface UserGroupService {

  List<UserGroupDto> getAllUserGroups();

  void addUserGroup(UserGroupDto userGroupDto);

  UserGroupDto updateUserGroup(UserGroupDto userGroup);

  UserGroup updateUserGroup(UserGroup userGroup);

  void deleteUserGroup(String userGroupId);

  UserGroupDto getUserGroupByName(String userGroupName);

  UserGroupDto getUserGroupById(String userGroupId);

  List<UserGroup> getUserGroupsForUser(String userId);

  List<UserGroupDto> getUserGroupDtosForUser(String userId);
}
