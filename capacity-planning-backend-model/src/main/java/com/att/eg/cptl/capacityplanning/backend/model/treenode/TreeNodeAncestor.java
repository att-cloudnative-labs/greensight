package com.att.eg.cptl.capacityplanning.backend.model.treenode;

import java.util.List;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document
public class TreeNodeAncestor implements AccessControlledTreeObject {
  // node and version are not getting mapped correctly from
  // mongodb. that's why ownerId and nodeId had to be introduced
  // as workaround.
  @Id private String id;
  private Long version;
  private String ownerId;
  private String nodeId;
  private Long nodeVersion;
  private NodeType type;
  private List<String> ancestors;
  private AccessControlType accessControl;
  private List<AccessPermission> acl;
  private Boolean trashed;
  private String name;

  @Override
  public String getId() {
    return nodeId;
  }

  public Long getVersion() {
    return nodeVersion;
  }
}
