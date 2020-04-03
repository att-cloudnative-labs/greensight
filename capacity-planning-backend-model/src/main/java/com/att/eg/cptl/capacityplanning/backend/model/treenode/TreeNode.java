package com.att.eg.cptl.capacityplanning.backend.model.treenode;

import com.att.eg.cptl.capacityplanning.backend.model.Trashable;
import java.time.ZonedDateTime;
import java.util.*;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Version;
import org.springframework.data.domain.Persistable;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.lang.Nullable;

@Data
@Document
public class TreeNode
    implements AccessControlledTreeObject, Trashable, Persistable<String>, TreeNodeBase {
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
  @Version private Long version;
  @LastModifiedDate private Date lastModifiedDate;
  private List<TreeNodeAncestor> augmentedAncestors;

  @Override
  public boolean isNew() {
    return id == null;
  }

  public static TreeNode from(TreeNodeBase treeNode) {
    TreeNode cpy = new TreeNode();
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
    cpy.setId(treeNode.getId());
    cpy.setLastModifiedDate(treeNode.getLastModifiedDate());

    return cpy;
  }
}
