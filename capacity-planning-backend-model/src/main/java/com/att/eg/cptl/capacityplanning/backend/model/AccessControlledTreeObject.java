package com.att.eg.cptl.capacityplanning.backend.model;

import com.att.eg.cptl.capacityplanning.backend.model.treenode.AccessControlType;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.AccessPermission;
import java.util.List;

public interface AccessControlledTreeObject extends IdentifiedObject, OwnedObject {
  List<String> getAncestors();

  AccessControlType getAccessControl();

  List<AccessPermission> getAcl();
}
