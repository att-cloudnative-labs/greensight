package com.att.eg.cptl.capacityplanning.backend.controller;

import com.att.eg.cptl.capacityplanning.backend.dto.UserGroupDto;
import com.att.eg.cptl.capacityplanning.backend.rest.RestResponse;
import com.att.eg.cptl.capacityplanning.backend.service.UserGroupService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(maxAge = 36000)
@RestController
public class UserGroupController {

  @Autowired private UserGroupService userGroupService;

  @GetMapping("/userGroup")
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_ONLY','ROLE_READ_AND_WRITE')")
  public RestResponse getAllUserGroups() {
    List<UserGroupDto> userGroupList = userGroupService.getAllUserGroups();
    return new RestResponse(HttpStatus.OK, userGroupList);
  }

  @PostMapping("/userGroup")
  @PreAuthorize("hasAnyRole('ROLE_ADMIN')")
  public RestResponse addUserGroup(@RequestBody UserGroupDto userGroupDto) {
    userGroupService.addUserGroup(userGroupDto);
    return new RestResponse(HttpStatus.CREATED);
  }

  @PutMapping("/userGroup/{userGroupId}")
  @PreAuthorize("hasAnyRole('ROLE_ADMIN')")
  public RestResponse updateRole(
      @PathVariable("userGroupId") String userGroupId, @RequestBody UserGroupDto userGroupDto) {
    userGroupDto.setId(userGroupId);
    userGroupService.updateUserGroup(userGroupDto);
    return new RestResponse(HttpStatus.OK);
  }

  @DeleteMapping("/userGroup/{userGroupId}")
  @PreAuthorize("hasAnyRole('ROLE_ADMIN')")
  public RestResponse deleteUserGroup(@PathVariable("userGroupId") String userGroupId) {
    userGroupService.deleteUserGroup(userGroupId);
    return new RestResponse(HttpStatus.OK);
  }

  @GetMapping(
      value = "/userGroup/userGroupName/{userGroupName}",
      produces = MediaType.APPLICATION_JSON_VALUE)
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_ONLY','ROLE_READ_AND_WRITE')")
  public RestResponse getUserGroupByName(@PathVariable("userGroupName") String userGroupName) {
    UserGroupDto userGroupDto = userGroupService.getUserGroupByName(userGroupName);
    return new RestResponse(HttpStatus.OK, userGroupDto);
  }

  @GetMapping(value = "/userGroup/{userGroupId}", produces = MediaType.APPLICATION_JSON_VALUE)
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_ONLY','ROLE_READ_AND_WRITE')")
  public RestResponse getUserGroup(@PathVariable("userGroupId") String userGroupId) {
    UserGroupDto userGroupDto = userGroupService.getUserGroupById(userGroupId);
    return new RestResponse(HttpStatus.OK, userGroupDto);
  }

  @GetMapping(value = "/userGroup/user/{userId}", produces = MediaType.APPLICATION_JSON_VALUE)
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_ONLY','ROLE_READ_AND_WRITE')")
  public RestResponse getUserGroups(@PathVariable("userId") String userId) {
    List<UserGroupDto> userGroupDtos = userGroupService.getUserGroupDtosForUser(userId);
    return new RestResponse(HttpStatus.OK, userGroupDtos);
  }
}
