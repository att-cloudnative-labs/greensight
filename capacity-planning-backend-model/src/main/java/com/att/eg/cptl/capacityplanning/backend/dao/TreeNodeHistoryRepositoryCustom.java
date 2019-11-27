package com.att.eg.cptl.capacityplanning.backend.dao;

import com.att.eg.cptl.capacityplanning.backend.model.treenode.TreeNode;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.TreeNodeVersion;
import java.util.List;
import org.springframework.lang.Nullable;

public interface TreeNodeHistoryRepositoryCustom {
  TreeNodeVersion save(String nodeId, Long version, String userId, @Nullable String comment);

  TreeNodeVersion save(TreeNode treeNode, String userId, @Nullable String comment);

  TreeNodeVersion getLatest(String nodeId, boolean sparse);

  TreeNodeVersion getVersion(String nodeId, Long version);

  List<TreeNodeVersion> getVersionInfo(String nodeId);

  void updateComment(String nodeId, Long version, String userId, String comment);
}
