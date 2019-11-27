package com.att.eg.cptl.capacityplanning.backend.model.treenode;

import java.util.List;
import lombok.Data;
import org.springframework.data.annotation.Id;

@Data
public class AccessPermission {
  @Id private String id;
  private AccessIdType type;
  private List<Permission> permissions;
}
