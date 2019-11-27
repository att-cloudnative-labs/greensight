package com.att.eg.cptl.capacityplanning.backend.model.converter;

import com.att.eg.cptl.capacityplanning.backend.dto.AppUserDto;
import com.att.eg.cptl.capacityplanning.backend.dto.UserGroupDto;
import com.att.eg.cptl.capacityplanning.backend.dto.treenode.AccessPermissionDto;
import com.att.eg.cptl.capacityplanning.backend.dto.treenode.TreeNodeDto;
import com.att.eg.cptl.capacityplanning.backend.dto.treenode.TreeNodeVersionDto;
import com.att.eg.cptl.capacityplanning.backend.model.AppUser;
import com.att.eg.cptl.capacityplanning.backend.model.ForecastVariableDescriptor;
import com.att.eg.cptl.capacityplanning.backend.model.ProcessInterfaceDescription;
import com.att.eg.cptl.capacityplanning.backend.model.UserGroup;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.*;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.NodeType;
import com.att.eg.cptl.capacityplanning.backend.util.Constants;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class ModelToDtoConverter {
  private static final DateTimeFormatter dateTimeFormatter =
      DateTimeFormatter.ofPattern(Constants.ZONED_DATE_TIME_FORMAT);

  /**
   * Converts a List of AppUser objects to a List of their DTO representations.
   *
   * @param appUsers The list of AppUser objects to convert.
   * @return List of DTOs representing the list of AppUsers.
   */
  public List<AppUserDto> convertAppUserListToDtos(List<AppUser> appUsers) {
    List<AppUserDto> appUserDtos = new ArrayList<>();
    appUsers.forEach(appUser -> appUserDtos.add(convertAppUserToOutputDto(appUser)));
    return appUserDtos;
  }

  /**
   * Converts an AppUser object to it's DTO representation.
   *
   * @param appUser The user to convert to it's DTO representation.
   * @return The DTO representation of the given user.
   */
  public AppUserDto convertAppUserToOutputDto(AppUser appUser) {
    if (appUser == null) {
      return null;
    }
    AppUserDto appUserDto = new AppUserDto();
    appUserDto.setId(appUser.getId());
    appUserDto.setUsername(appUser.getUsername());
    appUserDto.setRole(appUser.getRole());
    appUserDto.setProjectId(appUser.getProjectId());
    appUserDto.setBranchId(appUser.getBranchId());
    appUserDto.setModelBranchId(appUser.getModelBranchId());
    appUserDto.setUserGroupId(appUser.getUserGroupId());
    appUserDto.setSettings(appUser.getSettings());
    return appUserDto;
  }

  /**
   * Convert a TreeNode to a TreeNode DTO.
   *
   * @param treeNode The TreeNode to convert.
   * @return TreeNodeDto representing the inputted TreeNode
   */
  public TreeNodeDto createTreeNodeDto(
      TreeNode treeNode, List<Permission> userPermissionsForThisNode) {
    TreeNodeDto treeNodeDto = new TreeNodeDto();
    treeNodeDto.setId(treeNode.getId());
    treeNodeDto.setName(treeNode.getName());
    treeNodeDto.setType(treeNode.getType());
    treeNodeDto.setContent(treeNode.getContent());
    treeNodeDto.setAccessControl(treeNode.getAccessControl());
    treeNodeDto.setVersion(treeNode.getVersion() == null ? 0 : treeNode.getVersion());
    if (treeNode.getAcl() != null) {
      treeNodeDto.setAcl(
          treeNode
              .getAcl()
              .stream()
              .map(this::createAccessPermissionDto)
              .collect(Collectors.toList()));
    }
    treeNodeDto.setDescription(treeNode.getDescription());
    treeNodeDto.setOwnerId(treeNode.getOwnerId());
    treeNodeDto.setTrashed(treeNode.getTrashed());
    if (treeNode.getTrashedDate() != null) {
      treeNodeDto.setTrashedDate(getTimestampString(treeNode.getTrashedDate()));
    }

    if (treeNode.getType() == NodeType.MODEL && treeNode.getContent() != null) {
      treeNodeDto.setProcessInterface(createProcessInterfaceDescription(treeNode));
    }
    if (treeNode.getProcessDependencies() != null) {
      treeNodeDto.setProcessDependencies(treeNode.getProcessDependencies());
    }
    treeNodeDto.setCurrentUserAccessPermissions(userPermissionsForThisNode);
    return treeNodeDto;
  }

  public TreeNodeDto createTreeNodeDto(
      TreeNode treeNode, List<Permission> userPermissionsForThisNode, List<TreeNode> ancestors) {
    TreeNodeDto dto = createTreeNodeDto(treeNode, userPermissionsForThisNode);
    if (ancestors != null && !ancestors.isEmpty()) {
      TreeNode parent = ancestors.get(ancestors.size() - 1);
      dto.setParentId(parent.getId());
      dto.setParentType(parent.getType());
    }
    return dto;
  }

  public TreeNodeVersionDto createTreeNodeVersion(TreeNodeVersion versionInfo) {
    TreeNodeVersionDto dto = new TreeNodeVersionDto();
    dto.setId(versionInfo.getId());
    dto.setComment(versionInfo.getComment());
    dto.setObjectId(versionInfo.getObjectId());
    dto.setTimestamp(versionInfo.getTimestamp());
    dto.setUserId(versionInfo.getUserId());
    dto.setUserName(versionInfo.getUserName());
    dto.setVersionId(versionInfo.getVersionId());
    return dto;
  }

  public List<TreeNodeVersionDto> createTreeNodeVersionsDto(List<TreeNodeVersion> versionInfo) {
    ArrayList<TreeNodeVersionDto> dtos = new ArrayList<>();
    versionInfo.forEach(version -> dtos.add(createTreeNodeVersion(version)));
    return dtos;
  }

  public ForecastVariableDescriptor createForecastVariableDescriptor(
      TreeNode variableNode, List<TreeNode> ancestors) {
    if (variableNode.getType() != NodeType.FC_VARIABLE_BD
        && variableNode.getType() != NodeType.FC_VARIABLE_NUM) {
      throw new IllegalArgumentException("only accepting variable nodes");
    }
    if (variableNode.getAncestors().size() != 3) {
      throw new IllegalArgumentException("can only work with level 3 nodes");
    }
    TreeNode project = ancestors.get(1);
    TreeNode sheet = ancestors.get(2);
    ForecastVariableDescriptor varDesc = new ForecastVariableDescriptor();
    varDesc.setVariableId(variableNode.getId());
    varDesc.setVariableName(variableNode.getName());
    varDesc.setVariableType(
        variableNode.getType() == NodeType.FC_VARIABLE_BD ? "BREAKDOWN" : "INTEGER");
    varDesc.setVariableUnit(variableNode.getDescription());

    varDesc.setProjectBranchId(sheet.getId());
    varDesc.setProjectBranchName(sheet.getName());
    varDesc.setProjectId(project.getId());
    varDesc.setProjectName(project.getName());

    varDesc.setSearchKey(project.getName() + "." + sheet.getName() + "." + variableNode.getName());

    return varDesc;
  }

  private AccessPermissionDto createAccessPermissionDto(AccessPermission accessPermission) {
    AccessPermissionDto accessPermissionDto = new AccessPermissionDto();
    accessPermissionDto.setId(accessPermission.getId());
    accessPermissionDto.setType(accessPermission.getType());
    accessPermissionDto.setPermissions(accessPermission.getPermissions());
    return accessPermissionDto;
  }

  /**
   * Creates a DTO representation of a UserGroup, given the UserGroup object and a list of the users
   * in the group.
   *
   * @param userGroup The group to convert.
   * @param usersInGroup A list of the users who are in the group.
   * @return DTO representing the group and it's users.
   */
  public UserGroupDto createUserGroupDto(UserGroup userGroup, List<AppUser> usersInGroup) {
    UserGroupDto userGroupDto = new UserGroupDto();
    userGroupDto.setId(userGroup.getId());
    userGroupDto.setUserGroupName(userGroup.getUserGroupName());
    userGroupDto.setRoleId(userGroup.getRoleId() == null ? null : userGroup.getRoleId().toString());
    if (usersInGroup != null) {
      List<AppUserDto> appUserDtos = new ArrayList<>();
      usersInGroup.forEach(appUser -> appUserDtos.add(convertAppUserToOutputDto(appUser)));
      userGroupDto.setUsersWithAccess(appUserDtos);
    }
    return userGroupDto;
  }

  /**
   * Converts a list of all UserGroup objects stored to a list of DTOs representing them, given the
   * groups and a list of all stored users.
   *
   * @param userGroups A list of all of the UserGroup objects stored.
   * @param allUsers A list of all users currently stored.
   * @return List of DTOs representing all UserGroup objects.
   */
  public List<UserGroupDto> convertListOfAllUserGroups(
      List<UserGroup> userGroups, List<AppUser> allUsers) {
    List<UserGroupDto> outputDtos = new ArrayList<>();
    Map<String, AppUser> appUsersById =
        allUsers.stream().collect(Collectors.toMap(AppUser::getId, Function.identity()));
    for (UserGroup userGroup : userGroups) {
      UserGroupDto userGroupDto = new UserGroupDto();
      userGroupDto.setId(userGroup.getId());
      userGroupDto.setUserGroupName(userGroup.getUserGroupName());
      userGroupDto.setRoleId(
          userGroup.getRoleId() == null ? null : userGroup.getRoleId().toString());
      if (userGroup.getUsers() != null) {
        List<AppUserDto> users = new ArrayList<>();
        userGroup
            .getUsers()
            .forEach(userId -> users.add(convertAppUserToOutputDto(appUsersById.get(userId))));
        userGroupDto.setUsersWithAccess(users);
      }
      outputDtos.add(userGroupDto);
    }
    return outputDtos;
  }

  /**
   * Convert a ZonedDateTime object to a String representing the timestamp.
   *
   * @param zonedDateTime The ZonedDateTime to be converted to a formatted timestamp.
   * @return String timestamp representing the ZonedDateTime.
   */
  private String getTimestampString(ZonedDateTime zonedDateTime) {
    return dateTimeFormatter.format(zonedDateTime);
  }

  public ProcessInterfaceDescription createProcessInterfaceDescription(TreeNode treeNode) {
    if (treeNode.getContent() == null || treeNode.getType() != NodeType.MODEL) {
      return null;
    }
    ProcessInterfaceDescription pid = new ProcessInterfaceDescription();
    pid.setName(treeNode.getName());
    pid.setDescription(treeNode.getDescription());
    pid.setObjectType("PROCESS_INTERFACE_DESCRIPTION");
    pid.setImplementation("GRAPH_MODEL");
    pid.setObjectId(treeNode.getId());
    pid.setPortTemplates(new HashMap<>());
    pid.setDependencies(treeNode.getProcessDependencies());
    pid.setInports((Map<String, Object>) treeNode.getContent().get("inports"));
    pid.setOutports((Map<String, Object>) treeNode.getContent().get("outports"));
    List<String> ancestors = treeNode.getAncestors();
    if (ancestors.size() > 0) {
      String parentId = ancestors.get(ancestors.size() - 1);
      if (StringUtils.hasText(parentId)) {
        pid.setParentId(parentId);
      }
    }

    return pid;
  }
}
