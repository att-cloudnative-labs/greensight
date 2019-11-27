package com.att.eg.cptl.capacityplanning.backend.dto.treenode;

import com.att.eg.cptl.capacityplanning.backend.model.treenode.AccessIdType;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.Permission;
import java.util.List;
import lombok.Data;

@Data
public class AccessPermissionDto {
  private String id;
  private String name;
  private AccessIdType type;
  private List<Permission> permissions;
}
