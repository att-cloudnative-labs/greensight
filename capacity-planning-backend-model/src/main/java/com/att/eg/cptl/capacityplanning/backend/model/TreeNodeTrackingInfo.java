package com.att.eg.cptl.capacityplanning.backend.model;

import com.att.eg.cptl.capacityplanning.backend.model.treenode.NodeType;
import java.util.List;
import lombok.Data;

@Data
public class TreeNodeTrackingInfo {
  private NodeType type;
  private String id;
  private String description;
  private String name;
  private Long releaseNr;
  private Long currentVersionNr;
  private String parentId;
  private String pathName;
  private List<String> processDependencies;
}
