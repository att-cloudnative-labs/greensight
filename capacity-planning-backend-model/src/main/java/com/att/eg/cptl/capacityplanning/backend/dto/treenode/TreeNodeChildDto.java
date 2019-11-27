package com.att.eg.cptl.capacityplanning.backend.dto.treenode;

import com.att.eg.cptl.capacityplanning.backend.model.treenode.NodeType;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.Permission;
import java.util.List;
import lombok.Data;

@Data
public class TreeNodeChildDto {
  private String id;
  private String name;
  private NodeType type;
  private String description;
  private Long version;
  private String ownerId;
  private String ownerName;
  private List<Permission> currentUserAccessPermissions;
}
