package com.att.eg.cptl.capacityplanning.backend.model.converter;

import com.att.eg.cptl.capacityplanning.backend.dto.AppUserInputDto;
import com.att.eg.cptl.capacityplanning.backend.model.AppUser;
import com.att.eg.cptl.capacityplanning.backend.model.auth.Role;
import java.util.HashMap;
import java.util.Map;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class DtoToModelConverterTest {
  private DtoToModelConverter dtoToModelConverter;

  @Before
  public void setup() {
    dtoToModelConverter = new DtoToModelConverter();
  }

  @Test
  public void testConvertInputDtoToAppUser() {
    String userId = "testuser";
    AppUserInputDto appUserInputDto = createTestAppUserInputDto(userId);
    AppUser appUser = dtoToModelConverter.convertInputDtoToAppUser(appUserInputDto);
    Assert.assertEquals(userId, appUser.getId());
    Assert.assertEquals(userId + "_user", appUser.getUsername());
    Assert.assertTrue(BCrypt.checkpw("password", appUser.getPassword()));
    Assert.assertEquals(Role.READ_AND_WRITE, appUser.getRole());
    Assert.assertEquals("testproj", appUser.getProjectId());
    Assert.assertEquals("testbranch", appUser.getBranchId());
    Assert.assertEquals("testmodelbranch", appUser.getModelBranchId());
    Assert.assertEquals("testusergroup", appUser.getUserGroupId());
    Assert.assertEquals(createTestSettings(), appUser.getSettings());
  }

  private AppUserInputDto createTestAppUserInputDto(String userId) {
    AppUserInputDto appUserInputDto = new AppUserInputDto();
    BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    appUserInputDto.setPassword("password");
    appUserInputDto.setId(userId);
    appUserInputDto.setUsername(userId + "_user");
    appUserInputDto.setRole(Role.READ_AND_WRITE);
    appUserInputDto.setProjectId("testproj");
    appUserInputDto.setBranchId("testbranch");
    appUserInputDto.setModelBranchId("testmodelbranch");
    appUserInputDto.setUserGroupId("testusergroup");
    appUserInputDto.setSettings(createTestSettings());
    return appUserInputDto;
  }

  private Map<String, Object> createTestSettings() {
    Map<String, Object> settings = new HashMap<>();
    settings.put("testval1", "Something");
    settings.put("testval2", 2);
    return settings;
  }
}
