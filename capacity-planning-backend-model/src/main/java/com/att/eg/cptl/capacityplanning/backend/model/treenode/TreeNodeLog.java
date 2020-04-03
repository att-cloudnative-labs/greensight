package com.att.eg.cptl.capacityplanning.backend.model.treenode;

import java.time.ZonedDateTime;
import java.util.*;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.lang.Nullable;

@Data
@Document
public class TreeNodeLog implements TreeNodeBase {
  @Id private String id;
  private String name;
  private NodeType type;
  private Map<String, Object> content;
  private List<String> ancestors;
  private String description;
  private String ownerId;
  private AccessControlType accessControl;
  private List<AccessPermission> acl;
  @Nullable private Boolean trashed;
  private ZonedDateTime trashedDate;
  private List<String> processDependencies;
  private Long version;

  private Date lastModifiedDate;
  private List<TreeNodeAncestor> augmentedAncestors;

  private Long releaseNr;
  @LastModifiedDate private Date logDate;
  private String baseNodeId;
  private List<String> tags;
  private String logComment;

  public static TreeNodeLog from(TreeNodeBase treeNode) {
    TreeNodeLog cpy = new TreeNodeLog();
    cpy.setId(treeNode.getId());
    cpy.setName(treeNode.getName());
    cpy.setType(treeNode.getType());
    cpy.setContent(treeNode.getContent());
    cpy.setAncestors(treeNode.getAncestors());
    cpy.setAccessControl(treeNode.getAccessControl());
    cpy.setVersion(treeNode.getVersion() == null ? 0 : treeNode.getVersion());
    if (treeNode.getAcl() != null) {
      cpy.setAcl(new ArrayList<>(treeNode.getAcl()));
    }
    cpy.setDescription(treeNode.getDescription());
    cpy.setOwnerId(treeNode.getOwnerId());
    cpy.setTrashed(treeNode.getTrashed());
    if (treeNode.getTrashedDate() != null) {
      cpy.setTrashedDate(treeNode.getTrashedDate());
    }

    if (treeNode.getProcessDependencies() != null) {
      cpy.setProcessDependencies(treeNode.getProcessDependencies());
    }
    cpy.setBaseNodeId(treeNode.getId());
    cpy.setId(UUID.randomUUID().toString());
    cpy.setLastModifiedDate(treeNode.getLastModifiedDate());
    cpy.setLogDate(treeNode.getLastModifiedDate());

    return cpy;
  }

  public TreeNode asTreeNode() {
    TreeNode tn = TreeNode.from(this);
    tn.setId(this.getBaseNodeId());
    return tn;
  }
}
