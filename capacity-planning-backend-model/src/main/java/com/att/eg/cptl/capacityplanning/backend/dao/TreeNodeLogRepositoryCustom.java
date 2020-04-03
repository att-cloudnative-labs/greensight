package com.att.eg.cptl.capacityplanning.backend.dao;

import com.att.eg.cptl.capacityplanning.backend.model.treenode.NodeType;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.TreeNodeLog;
import java.util.List;

public interface TreeNodeLogRepositoryCustom {
  List<TreeNodeLog> findReleases(String nodeId, boolean sparse);

  List<String> findDependentBaseNodeReleaseIds(String referringNodeId);

  List<TreeNodeLog> findVersions(String nodeId, boolean sparse);

  TreeNodeLog findRelease(String baseNodeId, Long releaseNr, boolean sparse);

  TreeNodeLog findVersion(String baseNodeId, Long versionNr, boolean sparse);

  TreeNodeLog findLogEntry(String logEntryId, boolean sparse);

  TreeNodeLog findLatestRelease(String baseNodeId, boolean sparse);

  TreeNodeLog findLatestVersion(String baseNodeId, boolean sparse);

  TreeNodeLog insertRelease(TreeNodeLog release);

  TreeNodeLog insertVersion(TreeNodeLog version);

  void updateLogComment(String logEntryId, String comment);

  void renameReleases(String baseNodeId, String name);

  List<String> getAllReleasedNodeIds(NodeType nodeType);
}
