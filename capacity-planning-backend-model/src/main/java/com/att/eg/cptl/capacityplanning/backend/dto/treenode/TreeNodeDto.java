package com.att.eg.cptl.capacityplanning.backend.dto.treenode;

import com.att.eg.cptl.capacityplanning.backend.model.IdentifiedObject;
import com.att.eg.cptl.capacityplanning.backend.model.NamedOwnerObject;
import com.att.eg.cptl.capacityplanning.backend.model.ProcessInterfaceDescription;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.*;
import java.util.List;
import java.util.Map;
import lombok.Data;

@Data
public class TreeNodeDto implements IdentifiedObject, NamedOwnerObject {
  private String id;
  private String name;
  private NodeType type;
  private Map<String, Object> content;
  private AccessControlType accessControl;
  private List<AccessPermissionDto> acl;
  private String description;
  private String parentId;
  private NodeType parentType;
  private Long version;
  private String ownerId;
  private String ownerName;
  private Boolean trashed;
  private String trashedDate;
  private List<Permission> currentUserAccessPermissions;
  private ProcessInterfaceDescription processInterface;
  private List<String> processDependencies;
}
