package com.att.eg.cptl.capacityplanning.backend.dto.treenode;

import lombok.Data;

@Data
public class TreeNodeVersionDto {
  private String id;
  // Metadata
  private Long versionId;
  private String timestamp;
  private String userId;
  private String userName;
  private String comment;
  private String objectId;

  // Object data
  private TreeNodeDto object;
}
