package com.att.eg.cptl.capacityplanning.backend.model;

import com.att.eg.cptl.capacityplanning.backend.dto.UserGroupDto;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import org.hibernate.validator.constraints.NotBlank;
import org.hibernate.validator.constraints.SafeHtml;
import org.springframework.data.annotation.Id;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Project implements OwnedObject {

  @SafeHtml @Id public String id;

  @SafeHtml
  @NotBlank(message = "title can't empty!")
  private String title;

  @SafeHtml private String ownerId;

  @SafeHtml private String ownerName;

  @SafeHtml private String description;

  private Boolean isPrivate;

  private List<AppUser> usersWithAccess;

  private List<UserGroupDto> userGroup;

  public Project() {
    super();
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  @Override
  public String getOwnerId() {
    return ownerId;
  }

  @Override
  public void setOwnerId(String ownerId) {
    this.ownerId = ownerId;
  }

  public String getOwnerName() {
    return ownerName;
  }

  public void setOwnerName(String ownerName) {
    this.ownerName = ownerName;
  }

  public List<AppUser> getUsersWithAccess() {
    return usersWithAccess;
  }

  public void setUsersWithAccess(List<AppUser> usersWithAccess) {
    this.usersWithAccess = usersWithAccess;
  }

  public Boolean getIsPrivate() {
    return isPrivate;
  }

  public void setIsPrivate(Boolean isPrivate) {
    this.isPrivate = isPrivate;
  }

  public List<UserGroupDto> getUserGroups() {
    return userGroup;
  }

  public void setUserGroups(List<UserGroupDto> userGroup) {
    this.userGroup = userGroup;
  }
}
