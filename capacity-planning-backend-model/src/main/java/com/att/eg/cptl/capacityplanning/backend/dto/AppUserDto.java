package com.att.eg.cptl.capacityplanning.backend.dto;

import com.att.eg.cptl.capacityplanning.backend.model.auth.Role;
import java.util.Map;
import lombok.Data;

@Data
public class AppUserDto {
  public AppUserDto() {}

  private String id;
  private String username;
  private Role role;
  private String projectId;
  private String branchId;
  private String modelBranchId;
  private String userGroupId;
  private Map<String, Object> settings;
}
