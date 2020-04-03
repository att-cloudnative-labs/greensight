package com.att.eg.cptl.capacityplanning.backend.model.treenode;

import com.att.eg.cptl.capacityplanning.backend.model.IdentifiedObject;
import java.util.List;

public interface AccessControlledTreeObject extends IdentifiedObject, AccessControlledObject {
  List<String> getAncestors();
}
