package com.att.eg.cptl.capacityplanning.backend.dao;

import com.att.eg.cptl.capacityplanning.backend.model.treenode.AggregatedAccessControlInformation;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.TreeNode;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.TreeNodeVersion;
import java.util.List;
import org.springframework.lang.Nullable;

public interface TreeNodeHistoryRepositoryCustom {

  TreeNodeVersion save(
      TreeNode treeNode,
      String ownerId,
      AggregatedAccessControlInformation aci,
      @Nullable String description);

  TreeNodeVersion getLatest(String nodeId, boolean sparse);

  TreeNodeVersion getVersion(String nodeId, Long version);

  List<TreeNodeVersion> getVersionInfo(String nodeId);

  void updateDescription(String nodeId, Long version, String ownerId, String description);
}
