package com.att.eg.cptl.capacityplanning.backend.model.treenode;

/** The types of AccessControl which a TreeNode can have. */
public enum AccessControlType {
  PRIVATE,
  PUBLIC_READ_ONLY,
  PUBLIC_READ_WRITE,
  ADVANCED,
  INHERIT
}
