package com.att.eg.cptl.capacityplanning.backend.service;

import com.att.eg.cptl.capacityplanning.backend.dto.AppUserInputDto;
import com.att.eg.cptl.capacityplanning.backend.dto.LoginInputDto;
import com.att.eg.cptl.capacityplanning.backend.dto.LoginOutputDto;
import com.att.eg.cptl.capacityplanning.backend.dto.SettingDto;
import com.att.eg.cptl.capacityplanning.backend.model.AppUser;
import java.util.List;
import java.util.Map;

public interface UserService {

  List<AppUser> getAllUsers();

  List<AppUser> findByRoleName(String roleId);

  AppUser getUserById(String userId);

  AppUser getUserByName(String username);

  AppUser addUser(AppUserInputDto appUserInputDto);

  AppUser updateUser(String userId, AppUserInputDto appUserInputDto, boolean allowRoleChange);

  void deleteUser(String userId, AppUser user);

  LoginOutputDto loginUser(LoginInputDto loginInput);

  Map<String, Object> getSettingsForUser(String userId);

  void addSettingToUser(String userId, SettingDto settingDto);

  boolean usesLdap();
}
