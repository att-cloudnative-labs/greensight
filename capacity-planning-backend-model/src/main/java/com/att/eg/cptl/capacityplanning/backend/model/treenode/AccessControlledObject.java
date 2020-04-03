package com.att.eg.cptl.capacityplanning.backend.model.treenode;

import com.att.eg.cptl.capacityplanning.backend.model.OwnedObject;
import java.util.List;

public interface AccessControlledObject extends OwnedObject {

  AccessControlType getAccessControl();

  List<AccessPermission> getAcl();
}
