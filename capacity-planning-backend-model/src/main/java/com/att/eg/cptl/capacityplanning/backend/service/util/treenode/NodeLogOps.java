package com.att.eg.cptl.capacityplanning.backend.service.util.treenode;

import com.att.eg.cptl.capacityplanning.backend.model.AppUser;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.TreeNode;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.TreeNodeLog;

public class NodeLogOps {
  public static TreeNodeLog create(TreeNode baseNode, AppUser user, String comment) {
    TreeNodeLog version = TreeNodeLog.from(baseNode);
    version.setOwnerId(user.getId());
    version.setLogComment(comment);
    return version;
  }

  public static TreeNodeLog duplicate(TreeNodeLog entry) {
    return null;
  }
}
