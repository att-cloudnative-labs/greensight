package com.att.eg.cptl.capacityplanning.backend.model;

import com.att.eg.cptl.capacityplanning.backend.model.auth.Role;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.Map;
import org.springframework.data.annotation.Id;

@JsonIgnoreProperties(ignoreUnknown = true)
public class AppUser {
  private static final long serialVersionUID = 6186672026885046548L;

  @Id private String id;

  @JsonIgnore private boolean isLdapUser;

  private String username;

  private String password;

  private Role role;

  private String projectId;

  private String branchId;

  private String modelBranchId;

  private String userGroupId;

  private Map<String, Object> settings;

  public AppUser() {
    super();
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public Role getRole() {
    return role;
  }

  public void setRole(Role role) {
    this.role = role;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  @Override
  public int hashCode() {
    final int prime = 31;
    int result = 1;
    result = prime * result + ((username == null) ? 0 : username.hashCode());
    return result;
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj) {
      return true;
    }
    if (obj == null) {
      return false;
    }
    if (getClass() != obj.getClass()) {
      return false;
    }
    AppUser other = (AppUser) obj;
    if (username == null) {
      if (other.username != null) {
        return false;
      }
    } else if (!username.equals(other.username)) {
      return false;
    }
    return true;
  }

  public String getProjectId() {
    return projectId;
  }

  public void setProjectId(String projectId) {
    this.projectId = projectId;
  }

  public String getBranchId() {
    return branchId;
  }

  public void setBranchId(String branchId) {
    this.branchId = branchId;
  }

  public String getModelBranchId() {
    return modelBranchId;
  }

  public void setModelBranchId(String modelBranchId) {
    this.modelBranchId = modelBranchId;
  }

  public String getUserGroupId() {
    return userGroupId;
  }

  public void setUserGroupId(String userGroupId) {
    this.userGroupId = userGroupId;
  }

  public String getUsername() {
    return username;
  }

  public boolean isLdapUser() {
    return isLdapUser;
  }

  public void setLdapUser(boolean ldapUser) {
    isLdapUser = ldapUser;
  }

  public Map<String, Object> getSettings() {
    return settings;
  }

  public void setSettings(Map<String, Object> settings) {
    this.settings = settings;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }
}
