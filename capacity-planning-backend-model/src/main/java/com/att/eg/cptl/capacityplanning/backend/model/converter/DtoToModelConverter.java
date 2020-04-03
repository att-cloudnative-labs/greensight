package com.att.eg.cptl.capacityplanning.backend.model.converter;

import com.att.eg.cptl.capacityplanning.backend.dto.AppUserInputDto;
import com.att.eg.cptl.capacityplanning.backend.dto.UserGroupDto;
import com.att.eg.cptl.capacityplanning.backend.dto.treenode.AccessPermissionDto;
import com.att.eg.cptl.capacityplanning.backend.dto.treenode.TreeNodeDto;
import com.att.eg.cptl.capacityplanning.backend.dto.treenode.TreeNodeReleaseDto;
import com.att.eg.cptl.capacityplanning.backend.model.AppUser;
import com.att.eg.cptl.capacityplanning.backend.model.UserGroup;
import com.att.eg.cptl.capacityplanning.backend.model.auth.Role;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.AccessPermission;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.TreeNode;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.TreeNodeRelease;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DtoToModelConverter {

  public TreeNodeRelease convertDtoToRelease(TreeNodeReleaseDto dto) {
    TreeNodeRelease trn = new TreeNodeRelease();
    trn.setObjectId(dto.getObjectId());
    trn.setVersionId(dto.getVersionId());
    trn.setOwnerId(dto.getOwnerId());
    trn.setTimestamp(dto.getTimestamp());
    trn.setId(dto.getId());
    trn.setDescription(dto.getDescription());
    if (dto.getTags() != null) {
      trn.setTags(new ArrayList<>(dto.getTags()));
    }
    return trn;
  }

  public AppUser convertInputDtoToAppUser(AppUserInputDto appUserInputDto) {
    if (appUserInputDto == null) {
      return null;
    }
    AppUser appUser = new AppUser();
    appUser.setId(appUserInputDto.getId());
    appUser.setUsername(appUserInputDto.getUsername());
    BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    if (appUserInputDto.getPassword() != null) {
      appUser.setPassword(passwordEncoder.encode(appUserInputDto.getPassword()));
    }
    appUser.setRole(appUserInputDto.getRole());
    appUser.setProjectId(appUserInputDto.getProjectId());
    appUser.setBranchId(appUserInputDto.getBranchId());
    appUser.setModelBranchId(appUserInputDto.getModelBranchId());
    appUser.setUserGroupId(appUserInputDto.getUserGroupId());
    appUser.setSettings(appUserInputDto.getSettings());
    return appUser;
  }

  public void updateTreeNodeFromDto(TreeNode treeNode, TreeNodeDto treeNodeDto, boolean sparse) {
    if (!treeNode.getName().equals(treeNodeDto.getName())) {
      treeNode.setName(treeNodeDto.getName());
    }
    if (!treeNode.getType().equals(treeNodeDto.getType())) {
      treeNode.setType(treeNodeDto.getType());
    }
    treeNode.setDescription(treeNodeDto.getDescription());
    if (treeNodeDto.getAccessControl() != null) {
      treeNode.setAccessControl(treeNodeDto.getAccessControl());
    }
    if (treeNodeDto.getAcl() != null) {
      treeNode.setAcl(
          treeNodeDto
              .getAcl()
              .stream()
              .map(this::convertDtoToAccessPermission)
              .collect(Collectors.toList()));
    }
    if (!sparse) {
      treeNode.setContent(treeNodeDto.getContent());
    }
  }

  public TreeNode convertDtoToTreeNode(TreeNodeDto treeNodeDto, List<String> ancestors) {
    TreeNode treeNode = new TreeNode();
    treeNode.setId(treeNodeDto.getId());
    treeNode.setName(treeNodeDto.getName());
    treeNode.setType(treeNodeDto.getType());
    treeNode.setContent(treeNodeDto.getContent());
    treeNode.setAncestors(ancestors);
    treeNode.setAccessControl(treeNodeDto.getAccessControl());
    treeNode.setDescription(treeNodeDto.getDescription());
    if (treeNodeDto.getAcl() != null) {
      treeNode.setAcl(
          treeNodeDto
              .getAcl()
              .stream()
              .map(this::convertDtoToAccessPermission)
              .collect(Collectors.toList()));
    }
    if (treeNodeDto.getProcessDependencies() != null) {
      treeNode.setProcessDependencies(treeNodeDto.getProcessDependencies());
    }
    return treeNode;
  }

  private AccessPermission convertDtoToAccessPermission(AccessPermissionDto accessPermissionDto) {
    AccessPermission accessPermission = new AccessPermission();
    accessPermission.setId(accessPermissionDto.getId());
    accessPermission.setType(accessPermissionDto.getType());
    accessPermission.setPermissions(accessPermissionDto.getPermissions());
    return accessPermission;
  }

  public UserGroup convertDtoToUserGroup(UserGroupDto userGroupDto) {
    UserGroup userGroup = new UserGroup();
    userGroup.setId(userGroupDto.getId());
    userGroup.setUserGroupName(userGroupDto.getUserGroupName());
    userGroup.setRoleId(Role.valueOf(userGroupDto.getRoleId()));
    if (userGroupDto.getUsersWithAccess() != null) {
      userGroup.setUsers(
          userGroupDto
              .getUsersWithAccess()
              .stream()
              .map(appUserDto -> appUserDto.getId())
              .collect(Collectors.toList()));
    }
    return userGroup;
  }
}
