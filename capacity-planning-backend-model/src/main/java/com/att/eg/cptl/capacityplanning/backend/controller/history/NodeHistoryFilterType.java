package com.att.eg.cptl.capacityplanning.backend.controller.history;

import com.att.eg.cptl.capacityplanning.backend.model.ObjectVersion;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.TreeNode;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.apache.commons.lang.StringUtils;

/**
 * Enum representing filters for node histories, including the keyword to include in the request and
 * the operation on the dataset (Must be a reduction operation)
 */
public enum NodeHistoryFilterType {
  HAS_COMMENT(
      "hasComment", treeNodeVersion -> StringUtils.isNotBlank(treeNodeVersion.getComment()));

  private String filterName;
  private Function<ObjectVersion<TreeNode>, Boolean> filterOperation;

  private static final List<String> NODE_HISTORY_FILTER_TYPE_VALUES =
      Arrays.asList(NodeHistoryFilterType.values())
          .stream()
          .map(nodeHistoryFilterType -> nodeHistoryFilterType.filterName)
          .collect(Collectors.toList());

  private static final Map<String, NodeHistoryFilterType> NODE_HISTORY_FILTER_TYPE_NAME_TO_ENUM =
      new HashMap<>();

  NodeHistoryFilterType(
      final String filterName, final Function<ObjectVersion<TreeNode>, Boolean> filterOperation) {
    this.filterName = filterName;
    this.filterOperation = filterOperation;
  }

  static {
    Arrays.asList(NodeHistoryFilterType.values())
        .forEach(
            nodeHistoryFilterType ->
                NODE_HISTORY_FILTER_TYPE_NAME_TO_ENUM.put(
                    nodeHistoryFilterType.toString(), nodeHistoryFilterType));
  }

  public static boolean validateNodeHistoryFilterType(String filterTypeName) {
    return filterTypeName != null && NODE_HISTORY_FILTER_TYPE_VALUES.contains(filterTypeName);
  }

  public static NodeHistoryFilterType fromFilterName(String filterName) {
    return NODE_HISTORY_FILTER_TYPE_NAME_TO_ENUM.get(filterName);
  }

  public Boolean applyFilter(ObjectVersion<TreeNode> previousVersion) {
    return filterOperation.apply(previousVersion);
  }

  @Override
  public String toString() {
    return filterName;
  }
}
