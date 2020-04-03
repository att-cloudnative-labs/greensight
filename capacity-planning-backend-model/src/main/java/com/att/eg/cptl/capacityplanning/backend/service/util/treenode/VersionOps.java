package com.att.eg.cptl.capacityplanning.backend.service.util.treenode;

import com.att.eg.cptl.capacityplanning.backend.dao.TreeNodeHistoryRepository;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.CombinedId;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.TreeNode;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.TreeNodeVersion;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class VersionOps {
  public static List<TreeNode> fetchVersionNodes(
      List<String> processIds, TreeNodeHistoryRepository historyRepository) {

    List<TreeNode> versions = new ArrayList<>();
    // FIXME: build API to fetch all versions at once
    for (String id : processIds) {
      CombinedId cid = new CombinedId(id);
      if (cid.isVersion()) {
        TreeNodeVersion v = historyRepository.getVersion(cid.getNodeId(), cid.getVersionId());
        if (v != null) {
          TreeNode t = v.getObject();
          t.setId(id);
          // overwrite access control settings
          // with aggregated access control from the version
          t.setAccessControl(v.getAccessControl().getAccessControl());
          t.setAcl(v.getAccessControl().getAcl());
          t.setAncestors(Collections.emptyList());
          versions.add(t);
        }
      }
    }
    return versions;
  }

  public static TreeNode fetchVersionNode(
      String processId, TreeNodeHistoryRepository historyRepository) {
    List<TreeNode> nodes =
        VersionOps.fetchVersionNodes(Collections.singletonList(processId), historyRepository);
    return nodes.size() > 0 ? nodes.get(0) : null;
  }
}
