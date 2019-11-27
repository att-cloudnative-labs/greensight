package com.att.eg.cptl.capacityplanning.backend.service.util.treenode;

import com.att.eg.cptl.capacityplanning.backend.dto.treenode.TreeNodeDto;
import com.att.eg.cptl.capacityplanning.backend.exception.FailedDependencyException;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.NodeType;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.TreeNode;
import java.util.*;

public class GraphModelContentOps {
  public static List<String> getModelNodePortIds(
      Map<String, Object> modelNodeContent, String portType) {
    List<String> portIds = new ArrayList<>();
    if (modelNodeContent != null) {
      if (modelNodeContent.get(portType) != null) {
        Map<String, Object> ports = (Map<String, Object>) modelNodeContent.get(portType);
        portIds.addAll(ports.keySet());
      }
    }
    return portIds;
  }

  public static List<String> getRemovedPortIds(TreeNode oldNode, TreeNodeDto updatedNode) {
    if (oldNode.getType() == NodeType.MODEL && updatedNode.getType() == NodeType.MODEL) {
      return getRemovedPortIdsFromContent(oldNode.getContent(), updatedNode.getContent());
    }
    return new ArrayList<>();
  }

  public static List<String> getRemovedPortIds(TreeNode oldNode, TreeNode updatedNode) {
    if (oldNode.getType() == NodeType.MODEL && updatedNode.getType() == NodeType.MODEL) {
      return getRemovedPortIdsFromContent(oldNode.getContent(), updatedNode.getContent());
    }
    return new ArrayList<>();
  }

  public static List<String> getRemovedPortIdsFromContent(
      Map<String, Object> oldNodeContent, Map<String, Object> updatedNodeContent) {
    List<String> portIds = new ArrayList<>();
    List<String> oldIn = getModelNodePortIds(oldNodeContent, "inports");
    List<String> updatedIn = getModelNodePortIds(updatedNodeContent, "inports");
    for (String oldInportId : oldIn) {
      if (!updatedIn.contains(oldInportId)) {
        portIds.add(oldInportId);
      }
    }
    List<String> oldOut = getModelNodePortIds(oldNodeContent, "outports");
    List<String> updatedOut = getModelNodePortIds(updatedNodeContent, "outports");
    for (String oldOutportId : oldOut) {
      if (!updatedOut.contains(oldOutportId)) {
        portIds.add(oldOutportId);
      }
    }
    return portIds;
  }

  public static List<String> getModelProcPortRefs(
      Map<String, Object> modelNodeContent, String portType) {
    List<String> portIds = new ArrayList<>();
    if (modelNodeContent != null) {
      if (modelNodeContent.get("processes") != null) {
        Map<String, Map<String, Object>> processes =
            (Map<String, Map<String, Object>>) modelNodeContent.get("processes");
        for (Map<String, Object> proc : processes.values()) {
          if (proc.get(portType) != null) {
            Map<String, Object> ports = (Map<String, Object>) proc.get(portType);
            for (Object port : ports.values()) {
              Map<String, Object> portMap = (Map<String, Object>) port;
              if (portMap.get("ref") != null) {
                portIds.add((String) portMap.get("ref"));
              }
            }
          }
        }
      }
    }
    return portIds;
  }

  public static List<String> getModelProcModelRefs(Map<String, Object> modelNodeContent) {
    List<String> modelRefIds = new ArrayList<>();
    if (modelNodeContent != null) {
      if (modelNodeContent.get("processes") != null) {
        Map<String, Map<String, Object>> processes =
            (Map<String, Map<String, Object>>) modelNodeContent.get("processes");
        for (Map<String, Object> proc : processes.values()) {
          if ("GRAPH_MODEL".equals(proc.get("type"))) {
            modelRefIds.add((String) proc.get("ref"));
          }
        }
      } else if (modelNodeContent.get("modelRef") != null) {
        modelRefIds.add((String) modelNodeContent.get("modelRef"));
      }
    }
    return modelRefIds;
  }

  // get a map of process port ref id -> process port id for a given port type
  public static Map<String, String> getModelProcPortMap(
      Map<String, Object> modelNodeContent, String portType) {
    Map<String, String> portIdMap = new HashMap<>();
    if (modelNodeContent != null) {
      if (modelNodeContent.get("processes") != null) {
        Map<String, Map<String, Object>> processes =
            (Map<String, Map<String, Object>>) modelNodeContent.get("processes");
        for (Map<String, Object> proc : processes.values()) {
          if (proc.get(portType) != null) {
            Map<String, Object> ports = (Map<String, Object>) proc.get(portType);
            for (Map.Entry<String, Object> port : ports.entrySet()) {
              String processPortId = port.getKey();
              Map<String, Object> portMap = (Map<String, Object>) port.getValue();
              if (portMap.get("ref") != null) {
                portIdMap.put((String) portMap.get("ref"), processPortId);
              }
            }
          }
        }
      }
    }
    return portIdMap;
  }

  public static List<String> getModelConnectionPortIds(Map<String, Object> modelNodeContent) {
    List<String> connectionPortIds = new ArrayList<>();
    if (modelNodeContent.get("connections") != null) {
      Map<String, Map<String, String>> connections =
          (Map<String, Map<String, String>>) modelNodeContent.get("connections");
      for (Map<String, String> connection : connections.values()) {
        if (connection.get("source") != null) {
          connectionPortIds.add(connection.get("source"));
        }
        if (connection.get("destination") != null) {
          connectionPortIds.add(connection.get("destination"));
        }
      }
    }
    return connectionPortIds;
  }

  public static void throwExceptionIfPortRefAppearsInConnections(
      List<TreeNode> allModels, List<String> portIds) {

    // start with collecting all models that use the portIds given.

    // TODO: could optimize by only looking for the processes with the ref
    // of the graph model that is about to be updated
    for (TreeNode treeNode : allModels) {
      List<String> offendingProcessPortIds = new ArrayList<>();
      if (treeNode.getContent() != null) {
        Map<String, String> inProcPortRefMap =
            getModelProcPortMap(treeNode.getContent(), "inports");
        Map<String, String> outProcPortRefMap =
            getModelProcPortMap(treeNode.getContent(), "outports");
        for (String portId : portIds) {
          if (inProcPortRefMap.containsKey(portId)) {
            offendingProcessPortIds.add(inProcPortRefMap.get(portId));
          }
          if (outProcPortRefMap.containsKey(portId)) {
            offendingProcessPortIds.add(outProcPortRefMap.get(portId));
          }
        }
        if (!offendingProcessPortIds.isEmpty()) {
          List<String> connectionPortIds = getModelConnectionPortIds(treeNode.getContent());
          if (!Collections.disjoint(offendingProcessPortIds, connectionPortIds)) {
            throw new FailedDependencyException(
                "Reference to the port deleted exists in other graph model. Can't perform update.");
          }
        }
      }
    }
  }
}
