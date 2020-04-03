package com.att.eg.cptl.capacityplanning.backend.service.util.treenode;

import static com.att.eg.cptl.capacityplanning.backend.service.util.treenode.GraphModelContentOps.extractGraphProcModelDeps;

import com.att.eg.cptl.capacityplanning.backend.model.treenode.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

public class DependencyOps {

  public static void updateDependencies(TreeNodeBase node, Map<String, String> nodeIdMap) {
    if ((node.getType() == NodeType.MODEL || node.getType() == NodeType.SIMULATION)
        && node.getProcessDependencies() != null
        && node.getProcessDependencies().size() > 0) {
      // if any of the dependencies is in the idMap
      if (node.getProcessDependencies()
              .stream()
              .filter(nodeIdMap.keySet()::contains)
              .collect(Collectors.toList())
              .size()
          > 0) {
        if (node.getType() == NodeType.MODEL) {
          ProcessOps.updateModelProcessGraphModelRefs(node.getContent(), nodeIdMap);
        } else if (node.getType() == NodeType.SIMULATION) {
          DependencyOps.updateSimulationDependencies(node.getContent(), nodeIdMap);
        }
      }
      List<String> updatedDependencies =
          node.getProcessDependencies()
              .stream()
              .map(
                  (d) -> {
                    return nodeIdMap.get(d) != null ? nodeIdMap.get(d) : d;
                  })
              .collect(Collectors.toList());
      node.setProcessDependencies(updatedDependencies);
    }
  }

  public static List<String> getNodeDependencies(TreeNodeBase treeNode) {
    switch (treeNode.getType()) {
      case MODEL:
        return GraphModelContentOps.getModelProcModelRefs(treeNode.getContent());
      case SIMULATION:
        return DependencyOps.getSimulationDependencies(treeNode.getContent());
      default:
        return new ArrayList<>();
    }
  }

  public static List<String> getDeepNodeDependencies(
      TreeNodeBase treeNode, Function<TreeNodeDependency, TreeNodeBase> getSparseDepNode) {
    switch (treeNode.getType()) {
      case MODEL:
        List<String> deepDependencies = new ArrayList<>();
        List<TreeNodeDependency> deps = extractGraphProcModelDeps(treeNode.getContent());
        for (TreeNodeDependency d : deps) {
          TreeNodeBase dNode = getSparseDepNode.apply(d);
          if (dNode == null) {
            throw new IllegalArgumentException("invalid process dependency");
          }
          deepDependencies.addAll(dNode.getProcessDependencies());
          deepDependencies.add(d.getRef());
        }
        return deepDependencies.stream().distinct().collect(Collectors.toList());
      case SIMULATION:
        return DependencyOps.getSimulationDependencies(treeNode.getContent());
      default:
        return new ArrayList<>();
    }
  }

  public static List<String> getSimulationDependencies(Map<String, Object> simulationNodeContent) {
    List<String> dependencies = new ArrayList<>();
    // start with the referenced model
    if (simulationNodeContent.get("ref") != null) {
      dependencies.add((String) simulationNodeContent.get("ref"));
    }
    // now get all the referenced forecast sheet IDs
    if (simulationNodeContent.get("forecasts") != null) {
      Map<String, Map<String, String>> forecasts =
          (Map<String, Map<String, String>>) simulationNodeContent.get("forecasts");
      for (String forecastId : forecasts.keySet()) {
        Map<String, String> forecast = forecasts.get(forecastId);
        String sheetRef = forecast.get("ref");
        if (sheetRef != null && !dependencies.contains(sheetRef)) {
          dependencies.add(sheetRef);
        }
      }
    }
    return dependencies;
  }

  public static void updateSimulationDependencies(
      Map<String, Object> simulationNodeContent, Map<String, String> nodeIdMap) {
    // start with the referenced model
    if (simulationNodeContent.get("ref") != null) {
      String currentModelReference = (String) simulationNodeContent.get("ref");
      if (nodeIdMap.get(currentModelReference) != null) {
        simulationNodeContent.put("ref", nodeIdMap.get(currentModelReference));
      }
    }
    // now update all the referenced forecast sheet IDs
    if (simulationNodeContent.get("forecasts") != null) {
      Map<String, Map<String, String>> forecasts =
          (Map<String, Map<String, String>>) simulationNodeContent.get("forecasts");
      for (String forecastId : forecasts.keySet()) {
        Map<String, String> forecast = forecasts.get(forecastId);
        String sheetRef = forecast.get("ref");
        if (sheetRef != null && nodeIdMap.get(sheetRef) != null) {
          forecast.put("ref", nodeIdMap.get(sheetRef));
        }
      }
    }
  }
}
