package com.att.eg.cptl.capacityplanning.backend.model.treenode;

import com.att.eg.cptl.capacityplanning.backend.model.IdentifiedObject;
import com.att.eg.cptl.capacityplanning.backend.model.OwnedObject;
import java.util.List;

public interface AccessControlledTreeObject extends IdentifiedObject, OwnedObject {
  List<String> getAncestors();

  AccessControlType getAccessControl();

  List<AccessPermission> getAcl();
}
