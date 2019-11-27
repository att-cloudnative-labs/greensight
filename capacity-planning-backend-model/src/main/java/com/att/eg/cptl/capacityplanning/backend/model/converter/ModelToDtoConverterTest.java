package com.att.eg.cptl.capacityplanning.backend.model.converter;

import com.att.eg.cptl.capacityplanning.backend.dto.AppUserDto;
import com.att.eg.cptl.capacityplanning.backend.model.AppUser;
import com.att.eg.cptl.capacityplanning.backend.model.auth.Role;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class ModelToDtoConverterTest {
  private ModelToDtoConverter modelToDtoConverter;

  @Before
  public void setup() {
    modelToDtoConverter = new ModelToDtoConverter();
  }

  @Test
  public void testConvertAppUserToDto() {
    String userId = "testid1";
    AppUser testUser = createTestAppUser(userId);
    AppUserDto appUserDto = modelToDtoConverter.convertAppUserToOutputDto(testUser);
    Assert.assertEquals(userId, appUserDto.getId());
    Assert.assertEquals(userId + "_user", appUserDto.getUsername());
    Assert.assertEquals(Role.READ_AND_WRITE, appUserDto.getRole());
    Assert.assertEquals("testproj", appUserDto.getProjectId());
    Assert.assertEquals("testbranch", appUserDto.getBranchId());
    Assert.assertEquals("testmodelbranch", appUserDto.getModelBranchId());
    Assert.assertEquals("testusergroup", appUserDto.getUserGroupId());
    Assert.assertEquals(createTestSettings(), appUserDto.getSettings());
  }

  @Test
  public void testConvertAppUserListToDtoList() {
    String userId1 = "testid1";
    String userId2 = "testid2";
    AppUser testUser1 = createTestAppUser(userId1);
    AppUser testUser2 = createTestAppUser(userId2);
    List<AppUser> appUsers = new ArrayList<>();
    appUsers.add(testUser1);
    appUsers.add(testUser2);
    List<AppUserDto> appUserDtos = modelToDtoConverter.convertAppUserListToDtos(appUsers);

    Assert.assertEquals(userId1, appUserDtos.get(0).getId());
    Assert.assertEquals(userId1 + "_user", appUserDtos.get(0).getUsername());
    Assert.assertEquals(Role.READ_AND_WRITE, appUserDtos.get(0).getRole());
    Assert.assertEquals("testproj", appUserDtos.get(0).getProjectId());
    Assert.assertEquals("testbranch", appUserDtos.get(0).getBranchId());
    Assert.assertEquals("testmodelbranch", appUserDtos.get(0).getModelBranchId());
    Assert.assertEquals("testusergroup", appUserDtos.get(0).getUserGroupId());
    Assert.assertEquals(createTestSettings(), appUserDtos.get(0).getSettings());

    Assert.assertEquals(userId2, appUserDtos.get(1).getId());
    Assert.assertEquals(userId2 + "_user", appUserDtos.get(1).getUsername());
    Assert.assertEquals(Role.READ_AND_WRITE, appUserDtos.get(1).getRole());
    Assert.assertEquals("testproj", appUserDtos.get(1).getProjectId());
    Assert.assertEquals("testbranch", appUserDtos.get(1).getBranchId());
    Assert.assertEquals("testmodelbranch", appUserDtos.get(1).getModelBranchId());
    Assert.assertEquals("testusergroup", appUserDtos.get(1).getUserGroupId());
    Assert.assertEquals(createTestSettings(), appUserDtos.get(1).getSettings());
  }

  private AppUser createTestAppUser(String id) {
    AppUser appUser = new AppUser();
    appUser.setId(id);
    appUser.setLdapUser(false);
    appUser.setUsername(id + "_user");
    BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    appUser.setPassword(passwordEncoder.encode("password"));
    appUser.setRole(Role.READ_AND_WRITE);
    appUser.setProjectId("testproj");
    appUser.setBranchId("testbranch");
    appUser.setModelBranchId("testmodelbranch");
    appUser.setUserGroupId("testusergroup");
    appUser.setSettings(createTestSettings());
    return appUser;
  }

  private Map<String, Object> createTestSettings() {
    Map<String, Object> settings = new HashMap<>();
    settings.put("testval1", "Something");
    settings.put("testval2", 2);
    return settings;
  }
}
