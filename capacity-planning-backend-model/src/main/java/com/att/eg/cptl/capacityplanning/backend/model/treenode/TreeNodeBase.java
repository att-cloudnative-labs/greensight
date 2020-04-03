package com.att.eg.cptl.capacityplanning.backend.model.treenode;

import java.time.ZonedDateTime;
import java.util.Date;
import java.util.List;
import java.util.Map;
import org.springframework.lang.Nullable;

public interface TreeNodeBase {

  String getId();

  void setId(String id);

  String getName();

  void setName(String name);

  NodeType getType();

  void setType(NodeType type);

  Map<String, Object> getContent();

  void setContent(Map<String, Object> content);

  List<String> getAncestors();

  void setAncestors(List<String> ancestors);

  String getDescription();

  void setDescription(String description);

  String getOwnerId();

  void setOwnerId(String ownerId);

  AccessControlType getAccessControl();

  void setAccessControl(AccessControlType accessControl);

  List<AccessPermission> getAcl();

  void setAcl(List<AccessPermission> acl);

  @Nullable
  Boolean getTrashed();

  void setTrashed(@Nullable Boolean trashed);

  ZonedDateTime getTrashedDate();

  void setTrashedDate(ZonedDateTime trashedDate);

  List<String> getProcessDependencies();

  void setProcessDependencies(List<String> processDependencies);

  Long getVersion();

  void setVersion(Long version);

  Date getLastModifiedDate();

  void setLastModifiedDate(Date lastModifiedDate);
}
