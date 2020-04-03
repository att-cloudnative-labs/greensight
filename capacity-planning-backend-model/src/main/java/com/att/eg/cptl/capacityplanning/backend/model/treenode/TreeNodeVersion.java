package com.att.eg.cptl.capacityplanning.backend.model.treenode;

import com.att.eg.cptl.capacityplanning.backend.model.ObjectVersion;
import lombok.Data;

@Data
public class TreeNodeVersion extends ObjectVersion<TreeNode> {
  private AggregatedAccessControlInformation accessControl;
  private boolean releasable;
}
