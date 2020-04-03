package com.att.eg.cptl.capacityplanning.backend.model.treenode;

import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class AggregatedAccessControlInformation implements AccessControlledObject {
  private AccessControlType accessControl;
  private List<AccessPermission> acl;
  private String ownerId;

  public static AggregatedAccessControlInformation fromAccessControlledObject(
      AccessControlledObject aco) {
    AggregatedAccessControlInformation aaci = new AggregatedAccessControlInformation();
    if (aco == null) {
      aaci.setAccessControl(AccessControlType.PRIVATE);
    } else {
      aaci.setOwnerId(aco.getOwnerId());
      aaci.setAccessControl(aco.getAccessControl());
      if (aco.getAcl() != null
          && aco.getAcl().size() > 0
          && aco.getAccessControl() == AccessControlType.ADVANCED) {
        List<AccessPermission> permissionList = new ArrayList<>();

        for (AccessPermission perm : aco.getAcl()) {
          AccessPermission newAp = new AccessPermission();
          newAp.setId(perm.getId());
          newAp.setPermissions(new ArrayList<>(perm.getPermissions()));
          newAp.setType(perm.getType());
        }
        aaci.setAcl(permissionList);
      }
    }
    return aaci;
  }
}
