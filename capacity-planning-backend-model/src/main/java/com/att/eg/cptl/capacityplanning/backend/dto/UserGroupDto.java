package com.att.eg.cptl.capacityplanning.backend.dto;

import java.util.List;
import lombok.Data;

@Data
public class UserGroupDto {
  public UserGroupDto() {};

  private String id;
  private String userGroupName;
  private String roleId;
  private List<AppUserDto> usersWithAccess;
}
