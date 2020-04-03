package com.att.eg.cptl.capacityplanning.backend.dto.treenode;

import com.att.eg.cptl.capacityplanning.backend.model.NamedOwnerObject;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.Permission;
import java.util.List;
import lombok.Data;

@Data
public class TreeNodeReleaseDto implements NamedOwnerObject {
  private String id;
  private String objectId;
  private Long versionId;
  private Long releaseNr;
  private String timestamp;
  private String ownerId;
  private String ownerName;
  private String description;
  private List<String> tags;
  private List<Permission> currentUserAccessPermissions;
  private TreeNodeDto treeNode;
}
