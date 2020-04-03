package com.att.eg.cptl.capacityplanning.backend.model.treenode;

import java.util.List;
import lombok.Data;

@Data
public class BaseNodeInfo {
  private TreeNode treeNode;
  private List<Permission> permissions;
  private String parentName;
}
