package com.att.eg.cptl.capacityplanning.backend.model.treenode;

import lombok.Data;

@Data
public class TreeNodeDependency {
  private Long releaseNr;
  private TrackingMode trackingMode;
  private String ref;
}
