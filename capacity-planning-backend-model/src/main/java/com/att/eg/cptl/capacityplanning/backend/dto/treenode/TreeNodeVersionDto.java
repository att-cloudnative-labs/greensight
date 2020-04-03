package com.att.eg.cptl.capacityplanning.backend.dto.treenode;

import com.att.eg.cptl.capacityplanning.backend.model.NamedOwnerObject;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.Permission;
import java.util.List;
import lombok.Data;

@Data
public class TreeNodeVersionDto implements NamedOwnerObject {
  private String id;
  // Metadata
  private Long versionId;
  private String timestamp;
  private String ownerId;
  private String ownerName;
  private String description;
  private String objectId;

  private List<Permission> currentUserAccessPermissions;

  // Object data
  private TreeNodeDto object;
}
