package com.att.eg.cptl.capacityplanning.backend.model;

import com.att.eg.cptl.capacityplanning.backend.model.auth.Role;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import lombok.Data;
import org.hibernate.validator.constraints.SafeHtml;
import org.springframework.data.annotation.Id;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserGroup {
  @SafeHtml @Id public String id;
  @SafeHtml private String userGroupName;
  @SafeHtml private Role roleId;
  private List<String> users;
}
