package com.att.eg.cptl.capacityplanning.backend.service.util.objecthistory;

import com.att.eg.cptl.capacityplanning.backend.model.treenode.TreeNode;
import org.springframework.stereotype.Component;

@Component
public class TreeNodeHistoryService extends ObjectHistoryService<TreeNode> {
  public TreeNodeHistoryService() {
    this.setType(TreeNode.class);
  }
}
