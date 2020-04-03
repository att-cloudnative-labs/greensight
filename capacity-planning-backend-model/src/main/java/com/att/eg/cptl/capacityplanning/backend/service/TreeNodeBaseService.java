package com.att.eg.cptl.capacityplanning.backend.service;

import com.att.eg.cptl.capacityplanning.backend.controller.util.accesscontrol.AccessControlUtil;
import com.att.eg.cptl.capacityplanning.backend.dao.*;
import com.att.eg.cptl.capacityplanning.backend.exception.UnauthorizedException;
import com.att.eg.cptl.capacityplanning.backend.model.AppUser;
import com.att.eg.cptl.capacityplanning.backend.model.UserGroup;
import com.att.eg.cptl.capacityplanning.backend.model.converter.DtoToModelConverter;
import com.att.eg.cptl.capacityplanning.backend.model.converter.ModelToDtoConverter;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.BaseNodeInfo;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.Permission;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.TreeNode;
import java.util.*;
import java.util.stream.Collectors;
import javax.annotation.Resource;

public class TreeNodeBaseService {
  private TreeNodeRepository treeNodeRepository;

  @Resource private ModelToDtoConverter modelToDtoConverter;

  @Resource private DtoToModelConverter dtoToModelConverter;

  @Resource private AccessControlUtil accessControlUtil;

  @Resource private UserGroupRepository userGroupRepository;

  @Resource private UserMongoRepository userMongoRepository;

  public TreeNodeBaseService(TreeNodeRepository treeNodeRepository) {
    this.treeNodeRepository = treeNodeRepository;
  }

  protected BaseNodeInfo getNodeForUser(String nodeId, AppUser user, boolean sparse) {
    TreeNode node = treeNodeRepository.getNode(nodeId, sparse);
    if (node == null) {
      throw new NoSuchElementException("no such tree node");
    }

    List<TreeNode> ancestors = getAncestors(node);
    List<UserGroup> usersGroups = userGroupRepository.findByUserId(user.getId());

    List<String> usersGroupIds =
        usersGroups == null
            ? Collections.emptyList()
            : usersGroups.stream().map(UserGroup::getId).collect(Collectors.toList());
    List<Permission> usersPermissionsForThisNode =
        accessControlUtil.getCurrentUsersPermissionsForThisNode(
            user, node, ancestors, usersGroupIds);

    TreeNode parentNode = ancestors.size() > 0 ? ancestors.get(ancestors.size() - 1) : null;

    BaseNodeInfo bni = new BaseNodeInfo();
    bni.setTreeNode(node);
    bni.setPermissions(usersPermissionsForThisNode);
    if (parentNode != null) {
      bni.setParentName(parentNode.getName());
    }

    return bni;
  }

  protected List<Permission> getNodePermissionsForUser(String nodeId, AppUser user) {
    return this.getNodeForUser(nodeId, user, true).getPermissions();
  }

  protected boolean hazPermission(BaseNodeInfo baseInfo, Permission p) {
    return baseInfo.getPermissions().indexOf(p) >= 0;
  }

  protected void assertPermission(BaseNodeInfo baseInfo, Permission p) {
    if (!this.hazPermission(baseInfo, p)) {
      throw new UnauthorizedException("INSUFFICIENT ACCESS RIGHTS");
    }
  }

  protected List<TreeNode> getAncestors(TreeNode node) {
    List<TreeNode> ancestorNodes =
        new ArrayList<>(
            treeNodeRepository.getNodes(
                TreeNodeRepositoryCustom.ProjectionType.SPARSE, node.getAncestors()));
    ancestorNodes.sort(
        (n1, n2) ->
            node.getAncestors().indexOf(n1.getId()) - node.getAncestors().indexOf(n2.getId()));
    return ancestorNodes;
  }

  protected Map<String, List<TreeNode>> getAncestorMap(List<TreeNode> nodes) {
    Map<String, List<TreeNode>> ancestorMap = new HashMap<>();
    Map<String, TreeNode> ancestors = new HashMap<>();
    for (TreeNode node : nodes) {
      for (String ancestorId : node.getAncestors()) {
        ancestors.putIfAbsent(ancestorId, null);
      }
    }
    List<TreeNode> ancestorNodes =
        treeNodeRepository.getNodes(
            TreeNodeRepositoryCustom.ProjectionType.SPARSE, ancestors.keySet());
    for (TreeNode augAnc : ancestorNodes) {
      ancestors.put(augAnc.getId(), augAnc);
    }
    for (TreeNode node : nodes) {
      List<TreeNode> nodesAncestors =
          node.getAncestors().stream().map(ancestors::get).collect(Collectors.toList());
      ancestorMap.put(node.getId(), nodesAncestors);
    }
    return ancestorMap;
  }

  /**
   * Generate a GUID String.
   *
   * @return A unique string.
   */
  protected String generateGuid() {
    UUID uuid = UUID.randomUUID();
    return uuid.toString();
  }
}
