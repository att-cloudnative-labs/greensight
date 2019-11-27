package com.att.eg.cptl.capacityplanning.backend.controller;

import com.att.eg.cptl.capacityplanning.backend.controller.util.RestResponseUtil;
import com.att.eg.cptl.capacityplanning.backend.dto.AppUserDto;
import com.att.eg.cptl.capacityplanning.backend.dto.AppUserInputDto;
import com.att.eg.cptl.capacityplanning.backend.dto.LoginInputDto;
import com.att.eg.cptl.capacityplanning.backend.dto.SettingDto;
import com.att.eg.cptl.capacityplanning.backend.exception.UnauthorizedException;
import com.att.eg.cptl.capacityplanning.backend.model.AppUser;
import com.att.eg.cptl.capacityplanning.backend.model.converter.ModelToDtoConverter;
import com.att.eg.cptl.capacityplanning.backend.rest.RestResponse;
import com.att.eg.cptl.capacityplanning.backend.service.UserService;
import com.att.eg.cptl.capacityplanning.backend.util.AuthorizationUtil;
import com.att.eg.cptl.capacityplanning.backend.util.MiscUtil;
import java.util.List;
import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(maxAge = 36000)
@RestController
public class UserController {

  @Autowired private UserService userService;

  @Resource private AuthorizationUtil authorizationUtil;

  @Resource private ModelToDtoConverter modelToDtoConverter;

  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_ONLY','ROLE_READ_AND_WRITE')")
  @GetMapping(value = "/user", produces = MediaType.APPLICATION_JSON_VALUE)
  public RestResponse getAllUsers() {
    List<AppUser> userList = userService.getAllUsers();
    List<AppUserDto> dtoList = modelToDtoConverter.convertAppUserListToDtos(userList);
    return new RestResponse(HttpStatus.OK, dtoList);
  }

  @PostMapping(value = "/login", produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<RestResponse> loginUser(@RequestBody LoginInputDto loginInputDto) {
    return RestResponseUtil.createResponse(HttpStatus.OK, userService.loginUser(loginInputDto));
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_ONLY','ROLE_READ_AND_WRITE')")
  @GetMapping(value = "/user/{userId}", produces = MediaType.APPLICATION_JSON_VALUE)
  public RestResponse getUser(@PathVariable("userId") String userId) {
    AppUser user = userService.getUserById(userId);
    AppUserDto dto = modelToDtoConverter.convertAppUserToOutputDto(user);
    return new RestResponse(HttpStatus.OK, dto);
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_ONLY','ROLE_READ_AND_WRITE')")
  @GetMapping(value = "/user/role/{roleId}", produces = MediaType.APPLICATION_JSON_VALUE)
  public RestResponse findByRole(@PathVariable("roleId") String roleId) {
    List<AppUser> userList = userService.findByRoleName(roleId);
    List<AppUserDto> dtoList = modelToDtoConverter.convertAppUserListToDtos(userList);
    return new RestResponse(HttpStatus.OK, dtoList);
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN')")
  @PostMapping(value = "/user", produces = MediaType.APPLICATION_JSON_VALUE)
  public RestResponse addUser(@RequestBody AppUserInputDto appUserInputDto) {
    userService.addUser(appUserInputDto);
    return new RestResponse(HttpStatus.CREATED);
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_AND_WRITE','ROLE_READ_ONLY')")
  @PutMapping(value = "/user/{userId}", produces = MediaType.APPLICATION_JSON_VALUE)
  public RestResponse updateUser(
      HttpServletRequest request,
      @PathVariable("userId") String userId,
      @RequestBody AppUserInputDto appUserInputDto) {
    final String token = MiscUtil.getTokenFromRequest(request);
    boolean hasPermissionToUpdateUser = authorizationUtil.hasPermissionToUpdateUser(token, userId);
    if (hasPermissionToUpdateUser) {
      appUserInputDto.setId(userId);
      userService.updateUser(userId, appUserInputDto, authorizationUtil.isAdminUser(token));
      return new RestResponse(HttpStatus.OK);
    } else {
      return new RestResponse(HttpStatus.UNAUTHORIZED);
    }
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN')")
  @DeleteMapping(value = "/user/{userId}", produces = MediaType.APPLICATION_JSON_VALUE)
  public RestResponse deleteUser(@PathVariable("userId") String userId) {
    userService.deleteUser(userId);
    return new RestResponse(HttpStatus.OK);
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_ONLY','ROLE_READ_AND_WRITE')")
  @GetMapping(value = "/user/username/{username}", produces = MediaType.APPLICATION_JSON_VALUE)
  public RestResponse getUserByName(@PathVariable("username") String username) {
    AppUser user = userService.getUserByName(username);
    AppUserDto dto = modelToDtoConverter.convertAppUserToOutputDto(user);
    return new RestResponse(HttpStatus.OK, dto);
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_ONLY','ROLE_READ_AND_WRITE')")
  @PostMapping(value = "/user/{userId}/setting", produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<RestResponse> addSetting(
      HttpServletRequest request, @PathVariable String userId, @RequestBody SettingDto setting) {
    final String token = MiscUtil.getTokenFromRequest(request);
    if (!authorizationUtil.hasPermissionToUpdateUser(token, userId)) {
      throw new UnauthorizedException("Permission to modify this user denied.");
    }
    userService.addSettingToUser(userId, setting);
    return RestResponseUtil.createResponse(HttpStatus.OK);
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_ONLY','ROLE_READ_AND_WRITE')")
  @GetMapping(value = "/user/{userId}/settings", produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<RestResponse> getSettings(
      HttpServletRequest request, @PathVariable String userId) {
    final String token = MiscUtil.getTokenFromRequest(request);
    if (!authorizationUtil.hasPermissionToUpdateUser(token, userId)) {
      throw new UnauthorizedException("Permission to view this user's settings denied.");
    }
    return RestResponseUtil.createResponse(HttpStatus.OK, userService.getSettingsForUser(userId));
  }
}
