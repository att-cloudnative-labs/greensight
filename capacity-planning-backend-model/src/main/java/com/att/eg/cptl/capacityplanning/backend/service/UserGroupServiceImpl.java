package com.att.eg.cptl.capacityplanning.backend.service;

import com.att.eg.cptl.capacityplanning.backend.dao.UserGroupRepository;
import com.att.eg.cptl.capacityplanning.backend.dao.UserMongoRepository;
import com.att.eg.cptl.capacityplanning.backend.dto.UserGroupDto;
import com.att.eg.cptl.capacityplanning.backend.exception.BadRequestException;
import com.att.eg.cptl.capacityplanning.backend.exception.DocumentExistsException;
import com.att.eg.cptl.capacityplanning.backend.model.AppUser;
import com.att.eg.cptl.capacityplanning.backend.model.UserGroup;
import com.att.eg.cptl.capacityplanning.backend.model.auth.Role;
import com.att.eg.cptl.capacityplanning.backend.model.converter.DtoToModelConverter;
import com.att.eg.cptl.capacityplanning.backend.model.converter.ModelToDtoConverter;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserGroupServiceImpl implements UserGroupService {

  @Autowired private UserGroupRepository repository;

  @Resource private ModelToDtoConverter modelToDtoConverter;

  @Resource private DtoToModelConverter dtoToModelConverter;

  @Resource private UserMongoRepository userRepository;

  @Override
  public List<UserGroupDto> getAllUserGroups() {
    List<UserGroup> userGroups = repository.findAll();
    List<AppUser> allUsers = userRepository.findAll();
    return modelToDtoConverter.convertListOfAllUserGroups(userGroups, allUsers);
  }

  @Override
  public UserGroupDto addUserGroup(UserGroupDto userGroupDto) {
    if (StringUtils.isBlank(userGroupDto.getUserGroupName())) {
      throw new BadRequestException("User group name must not be left blank.");
    }
    if (!validateRoleId(userGroupDto.getRoleId())) {
      throw new BadRequestException("Role must not be omitted and must have a valid value.");
    }
    if (userGroupDto.getUsersWithAccess() == null) {
      throw new BadRequestException("usersWithAccess must be set (even if it is empty).");
    }
    UserGroup userGroup = dtoToModelConverter.convertDtoToUserGroup(userGroupDto);
    if (userGroupDto.getId() == null || !repository.existsById(userGroupDto.getId())) {
      UserGroup newGroup = repository.save(userGroup);
      List<AppUser> usersInGroup = userRepository.findByIdIn(newGroup.getUsers());
      return modelToDtoConverter.createUserGroupDto(newGroup, usersInGroup);
    } else {
      throw new DocumentExistsException("UserGroup with this ID already exists.");
    }
  }

  @Override
  public UserGroupDto updateUserGroup(UserGroupDto userGroupDto) {
    if (StringUtils.isBlank(userGroupDto.getUserGroupName())) {
      throw new BadRequestException("User group name must not be left blank.");
    }
    if (!validateRoleId(userGroupDto.getRoleId())) {
      throw new BadRequestException("Role must not be omitted and must have a valid value.");
    }
    if (userGroupDto.getUsersWithAccess() == null) {
      throw new BadRequestException("usersWithAccess must be set (even if it is empty).");
    }
    UserGroup userGroup = dtoToModelConverter.convertDtoToUserGroup(userGroupDto);
    repository.save(userGroup);
    return userGroupDto;
  }

  @Override
  public UserGroup updateUserGroup(UserGroup userGroup) {
    if (StringUtils.isBlank(userGroup.getUserGroupName())) {
      throw new BadRequestException("User group name must not be left blank.");
    }
    if (!validateRoleId(userGroup.getRoleId())) {
      throw new BadRequestException("Role must not be omitted and must have a valid value.");
    }
    if (userGroup.getUsers() == null) {
      throw new BadRequestException("usersWithAccess must be set (even if it is empty).");
    }
    repository.save(userGroup);
    return userGroup;
  }

  @Override
  public void deleteUserGroup(String userGroupId) {
    repository.deleteById(userGroupId);
  }

  @Override
  public UserGroupDto getUserGroupByName(String userGroupName) {
    UserGroup userGroup = repository.findByUserGroupName(userGroupName);
    List<AppUser> usersInGroup = null;
    if (userGroup.getUsers() != null) {
      usersInGroup = userRepository.findByIdIn(userGroup.getUsers());
    }
    return modelToDtoConverter.createUserGroupDto(userGroup, usersInGroup);
  }

  @Override
  public UserGroupDto getUserGroupById(String userGroupId) {
    UserGroup userGroup = repository.findById(userGroupId).get();
    List<AppUser> usersInGroup = userRepository.findByIdIn(userGroup.getUsers());
    return modelToDtoConverter.createUserGroupDto(userGroup, usersInGroup);
  }

  @Override
  public List<UserGroup> getUserGroupsForUser(String userId) {
    return repository.findByUserId(userId);
  }

  @Override
  public List<UserGroupDto> getUserGroupDtosForUser(String userId) {
    List<UserGroup> usersGroups = repository.findByUserId(userId);
    List<UserGroupDto> userGroupDtos = new ArrayList<>();
    usersGroups.forEach(
        userGroup -> {
          if (userGroup.getUsers() != null) {
            List<AppUser> usersInGroup = userRepository.findByIdIn(userGroup.getUsers());
            userGroupDtos.add(modelToDtoConverter.createUserGroupDto(userGroup, usersInGroup));
          }
        });
    return userGroupDtos;
  }

  private boolean validateRoleId(String roleId) {
    for (Role role : Role.values()) {
      if (role.toString().equals(roleId)) {
        return true;
      }
    }
    return false;
  }

  private boolean validateRoleId(Role roleToCheck) {
    return roleToCheck != null;
  }
}
