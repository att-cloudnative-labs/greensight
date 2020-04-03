package com.att.eg.cptl.capacityplanning.backend.service.util.treenode;

import com.att.eg.cptl.capacityplanning.backend.model.treenode.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class TreeOps {
    public static TreeNode getFakeRoot(){
        TreeNode fakeRoot = new TreeNode();
        fakeRoot.setId("root");
        fakeRoot.setName("root");
        fakeRoot.setType(NodeType.FOLDER);
        fakeRoot.setAncestors(new ArrayList<>());
        fakeRoot.setAccessControl(AccessControlType.ADVANCED);
        AccessPermission ap = new AccessPermission();
        ap.setType(AccessIdType.ALL);
        ap.setPermissions(Arrays.asList(Permission.READ, Permission.CREATE));
        return fakeRoot;
    }
}
