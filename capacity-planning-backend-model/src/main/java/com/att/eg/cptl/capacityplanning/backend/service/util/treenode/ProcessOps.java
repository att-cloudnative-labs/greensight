package com.att.eg.cptl.capacityplanning.backend.service.util.treenode;

import java.util.Map;

public class ProcessOps {

  public static void updateModelProcessGraphModelRefs(
      Map<String, Object> modelNodeContent, Map<String, String> nodeIdMap) {
    if (modelNodeContent != null) {
      if (modelNodeContent.get("processes") != null) {
        Map<String, Map<String, Object>> processes =
            (Map<String, Map<String, Object>>) modelNodeContent.get("processes");
        for (Map<String, Object> proc : processes.values()) {
          if ("GRAPH_MODEL".equals(proc.get("type"))) {
            String refNodeId = (String) proc.get("ref");
            if (nodeIdMap.get(refNodeId) != null) {
              proc.put("ref", nodeIdMap.get(refNodeId));
            }
          }
        }
      }
    }
  }
}
