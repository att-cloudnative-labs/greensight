package com.att.eg.cptl.capacityplanning.backendmodel.model;

import java.util.Map;
import lombok.Data;

@Data
public class TreeNodeContentPatch {
  private Map<String, Object> added;
  private Map<String, Object> deleted;
  private Map<String, Object> updated;
}
