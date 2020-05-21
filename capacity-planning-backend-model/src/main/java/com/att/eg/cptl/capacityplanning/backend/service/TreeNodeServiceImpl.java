package com.att.eg.cptl.capacityplanning.backend.service;

import static com.att.eg.cptl.capacityplanning.backend.service.util.treenode.DependencyOps.getDeepNodeDependencies;

import com.att.eg.cptl.capacityplanning.backend.controller.history.NodeHistoryFilterType;
import com.att.eg.cptl.capacityplanning.backend.controller.util.accesscontrol.AccessControlUtil;
import com.att.eg.cptl.capacityplanning.backend.controller.util.trash.TrashUtil;
import com.att.eg.cptl.capacityplanning.backend.controller.util.treenode.TreeNodeContentValidationUtil;
import com.att.eg.cptl.capacityplanning.backend.dao.*;
import com.att.eg.cptl.capacityplanning.backend.dto.treenode.AccessPermissionDto;
import com.att.eg.cptl.capacityplanning.backend.dto.treenode.TreeNodeDto;
import com.att.eg.cptl.capacityplanning.backend.dto.treenode.TreeNodeVersionDto;
import com.att.eg.cptl.capacityplanning.backend.exception.BadRequestException;
import com.att.eg.cptl.capacityplanning.backend.exception.DocumentExistsException;
import com.att.eg.cptl.capacityplanning.backend.exception.FailedDependencyException;
import com.att.eg.cptl.capacityplanning.backend.exception.ForbiddenException;
import com.att.eg.cptl.capacityplanning.backend.exception.NotFoundException;
import com.att.eg.cptl.capacityplanning.backend.exception.TrashStateException;
import com.att.eg.cptl.capacityplanning.backend.exception.VersionConflictException;
import com.att.eg.cptl.capacityplanning.backend.model.*;
import com.att.eg.cptl.capacityplanning.backend.model.converter.DtoToModelConverter;
import com.att.eg.cptl.capacityplanning.backend.model.converter.ModelToDtoConverter;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.*;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.AccessControlledTreeObject;
import com.att.eg.cptl.capacityplanning.backend.service.util.treenode.*;
import com.mongodb.client.result.UpdateResult;
import java.util.*;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import javax.annotation.Resource;
import javax.validation.constraints.Null;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;

@SuppressWarnings("squid:S1066")
@Service
public class TreeNodeServiceImpl extends TreeNodeBaseService implements TreeNodeService {
  private static final String TREE_NODE_NOT_FOUND_MESSAGE = "Tree node not found.";

  private final TreeNodeRepository treeNodeRepository;
  private final TreeNodeLogRepository treeNodeLogRepository;

  @Resource private ModelToDtoConverter modelToDtoConverter;

  @Resource private DtoToModelConverter dtoToModelConverter;

  @Resource private AccessControlUtil accessControlUtil;

  @Resource private UserGroupRepository userGroupRepository;

  @Resource private UserMongoRepository userMongoRepository;

  @Resource private TrashUtil trashUtil;

  @Resource private TreeNodeContentValidationUtil treeNodeContentValidationUtil;

  @Autowired
  public TreeNodeServiceImpl(
      TreeNodeRepository treeNodeRepository, TreeNodeLogRepository treeNodeLogRepository) {
    super(treeNodeRepository);
    this.treeNodeRepository = treeNodeRepository;
    this.treeNodeLogRepository = treeNodeLogRepository;
  }

  protected TreeNodeBase getDepNode(TreeNodeDependency dep) {
    if (dep.getTrackingMode() == null) {
      return null;
    }
    switch (dep.getTrackingMode()) {
      case FIXED:
        if (dep.getReleaseNr() == null) {
          return null;
        }
        return this.treeNodeLogRepository.findRelease(dep.getRef(), dep.getReleaseNr(), true);
      case LATEST_RELEASE:
        TreeNodeBase rel = this.treeNodeLogRepository.findLatestRelease(dep.getRef(), true);
        if (rel != null) return rel;
        // else fall through
      case CURRENT_VERSION:
        return this.treeNodeRepository.getNode(dep.getRef(), true);
    }
    return null;
  }

  @Override
  public List<TreeNodeDto> getNode(
      String id,
      Boolean showTrash,
      Boolean sparse,
      Boolean withChildren,
      Boolean sparseChildren,
      AppUser user) {
    boolean getTrashed = showTrash;
    CombinedId cId = new CombinedId(id);
    BaseNodeInfo bni = getNodeForUser(cId.getNodeId(), user, sparse);
    TreeNode node;

    if ((cId.isRelease() || cId.isVersion()) && withChildren) {
      throw new IllegalArgumentException("can't get children for release/version");
    }

    if (cId.isRelease()) {
      TreeNodeLog release =
          treeNodeLogRepository.findRelease(cId.getNodeId(), cId.getReleaseNr(), sparse);
      node = release != null ? release.asTreeNode() : null;

    } else if (cId.isVersion()) {
      TreeNodeLog version =
          treeNodeLogRepository.findVersion(cId.getNodeId(), cId.getVersionId(), sparse);
      TreeNode versionNode = version != null ? version.asTreeNode() : null;
      // if the versionId === latest, hand out the
      // main tree node
      if (versionNode == null) {
        TreeNode tmpTreeNode = treeNodeRepository.getNode(cId.getNodeId(), sparse);
        if (tmpTreeNode.getVersion().equals(cId.getVersionId())) {
          versionNode = tmpTreeNode;
        }
      }
      node = versionNode;
    } else {
      node = treeNodeRepository.getNode(id, sparse);
    }

    if (node == null) {
      throw new NotFoundException(TREE_NODE_NOT_FOUND_MESSAGE);
    }

    if (getTrashed != trashUtil.isItemTrashed(node)) {
      throw new TrashStateException("Cannot get a node with a diverting request trash state.");
    }

    List<TreeNode> ancestors = getAncestors(node);

    List<TreeNodeDto> output = new ArrayList<>();
    List<Permission> usersPermissionsForThisNode = bni.getPermissions();
    if (!usersPermissionsForThisNode.contains(Permission.READ)) {
      throw new NotFoundException(TREE_NODE_NOT_FOUND_MESSAGE);
    }

    if (withChildren) {
      List<UserGroup> usersGroups = userGroupRepository.findByUserId(user.getId());
      List<String> usersGroupIds =
          usersGroups == null
              ? Collections.emptyList()
              : usersGroups.stream().map(UserGroup::getId).collect(Collectors.toList());

      List<TreeNode> childNodes =
          treeNodeRepository.getChildren(node.getId(), node.getAncestors().size(), sparseChildren);
      childNodes.forEach(
          child -> {
            boolean childTrashed = child.getTrashed() != null ? child.getTrashed() : false;
            if (getTrashed == childTrashed) {
              List<AccessControlledTreeObject> childAncestors = new ArrayList<>(ancestors);
              childAncestors.add(node);
              List<Permission> childPermissions =
                  accessControlUtil.getCurrentUsersPermissionsForThisNode(
                      user, child, childAncestors, usersGroupIds);
              TreeNodeDto childDto = modelToDtoConverter.createTreeNodeDto(child, childPermissions);
              childDto.setParentId(node.getId());
              childDto.setParentType(node.getType());
              if (childPermissions.contains(Permission.READ)) {
                output.add(childDto);
              }
            }
          });
    }

    // this can most likely be done on the server as well
    TreeNodeDto outputDto =
        convertToAndEnrichTreeNodeDto(node, usersPermissionsForThisNode, ancestors);
    output.add(outputDto);

    DtoOps.addUserAndGroupNames(output, this.userMongoRepository, this.userGroupRepository);

    return output;
  }

  @Override
  public List<TreeNodeDto> getTrashedNodes(String rootNodeId, AppUser user) {
    List<TreeNode> trashedNodes = treeNodeRepository.listTrash(rootNodeId, user.getId());
    List<UserGroup> usersGroups = userGroupRepository.findByUserId(user.getId());
    Map<String, List<TreeNode>> ancestors = getAncestorMap(trashedNodes);

    List<String> usersGroupIds =
        usersGroups == null
            ? Collections.emptyList()
            : usersGroups.stream().map(UserGroup::getId).collect(Collectors.toList());

    List<TreeNodeDto> output = new ArrayList<>();

    for (TreeNode trashedNode : trashedNodes) {
      List<Permission> nodePermissions =
          accessControlUtil.getCurrentUsersPermissionsForThisNode(
              user, trashedNode, ancestors.get(trashedNode.getId()), usersGroupIds);
      if (nodePermissions.contains(Permission.DELETE)) {
        output.add(modelToDtoConverter.createTreeNodeDto(trashedNode, nodePermissions));
      }
    }
    DtoOps.addUserAndGroupNames(output, userMongoRepository, userGroupRepository);
    return output;
  }

  @Override
  public List<TreeNodeTrackingInfo> getTrackingInfo(
      AppUser user,
      @Nullable Date updatedAfter,
      @Nullable List<String> nodeIds,
      @Nullable NodeType nodeType) {
    List<TreeNodeTrackingInfo> dtos = new ArrayList<>();

    List<String> idsToFetch = new ArrayList<>();

    if (nodeIds != null) {
      idsToFetch.addAll(nodeIds);
    } else {
      if (nodeType != null) {
        List<TreeNode> trackingNodes =
            treeNodeRepository.getAll(
                TreeNodeRepositoryCustom.ProjectionType.SPARSE, updatedAfter, nodeType);
        idsToFetch.addAll(trackingNodes.stream().map(TreeNode::getId).collect(Collectors.toList()));
      } else {
        List<TreeNode> trackingNodes =
            treeNodeRepository.getAll(
                TreeNodeRepositoryCustom.ProjectionType.SPARSE,
                updatedAfter,
                NodeType.FC_SHEET,
                NodeType.MODEL);
        idsToFetch.addAll(trackingNodes.stream().map(TreeNode::getId).collect(Collectors.toList()));
      }
    }

    for (String nodeId : idsToFetch) {
      // fixme: optimize to only fetch ancestors/user names once
      BaseNodeInfo bni = getNodeForUser(nodeId, user, true);
      if (bni != null && hazPermission(bni, Permission.READ)) {
        TreeNodeLog release = this.treeNodeLogRepository.findLatestRelease(nodeId, true);
        TreeNodeTrackingInfo nti = modelToDtoConverter.createNodeTrackingInfo(bni.getTreeNode());
        if (nti != null) {
          nti.setPathName(bni.getParentName());
          if (release != null) {
            nti.setReleaseNr(release.getReleaseNr());
            nti.setProcessDependencies(release.getProcessDependencies());
          }
          ;
          dtos.add(nti);
        }
      }
    }

    return dtos;
  }

  @Override
  public List<TreeNodeTrackingInfo> search(
      AppUser user,
      PageRequest pageRequest,
      @Nullable String searchTerm,
      @Nullable List<NodeType> nodeTypes) {
    List<TreeNodeTrackingInfo> nodesFound = new ArrayList<>();

    Collection<TreeNode> accessibleFolders;

    // fake a root node so we don't have to query it
    TreeNode fakeRoot = TreeOps.getFakeRoot();

    // first get all folders and figure out which ones are accessible.
    // for now we just assume all the subnode inherit the folders access permission
    List<TreeNode> folders = treeNodeRepository.getChildren("root", 0, true);
    List<UserGroup> usersGroups = userGroupRepository.findByUserId(user.getId());

    List<String> usersGroupIds =
        usersGroups == null
            ? Collections.emptyList()
            : usersGroups.stream().map(UserGroup::getId).collect(Collectors.toList());
    accessibleFolders =
        folders
            .stream()
            .filter(
                f ->
                    accessControlUtil.doesUserHaveReadPermission(
                        user, f, Collections.singletonList(fakeRoot), usersGroupIds))
            .collect(Collectors.toList());

    List<String> accessibleFolderIds =
        accessibleFolders.stream().map(TreeNode::getId).collect(Collectors.toList());
    Map<String, String> folderNames =
        accessibleFolders.stream().collect(Collectors.toMap(TreeNode::getId, TreeNode::getName));

    List<TreeNode> queriedNodes =
        treeNodeRepository.searchNode(searchTerm, accessibleFolderIds, pageRequest, nodeTypes);

    for (TreeNode tn : queriedNodes) {
      TreeNodeTrackingInfo ti = modelToDtoConverter.createNodeTrackingInfo(tn);
      ti.setPathName(folderNames.get(ti.getParentId()));
      nodesFound.add(ti);
    }

    return nodesFound;
  }

  @Override
  public List<TreeNodeTrackingInfo> findSiblings(
      AppUser user,
      PageRequest pageRequest,
      String siblingReference,
      @Nullable List<NodeType> nodeTypes) {
    // FIXME: no paging implemented yet
    // FIMXE: build proper DB api to do this query

    BaseNodeInfo bni = getNodeForUser(siblingReference, user, true);
    assertPermission(bni, Permission.READ);

    String parentId =
        bni.getTreeNode().getAncestors().get(bni.getTreeNode().getAncestors().size() - 1);

    List<TreeNodeTrackingInfo> nodesFound = new ArrayList<>();
    List<NodeType> queryNodeTypes =
        nodeTypes != null ? nodeTypes : Collections.singletonList(NodeType.FOLDER);
    List<TreeNodeDto> childrenPlusParent = this.getNode(parentId, false, true, true, true, user);
    Optional<TreeNodeDto> parentOpt =
        childrenPlusParent.stream().filter(n -> n.getId().equals(parentId)).findFirst();
    if (parentOpt.isPresent()) {
      TreeNodeDto parent = parentOpt.get();
      List<TreeNodeDto> children =
          childrenPlusParent
              .stream()
              .filter(
                  n ->
                      n.getParentId().equals(parentId)
                          && queryNodeTypes.contains(n.getType())
                          && !n.getId().equals(siblingReference))
              .collect(Collectors.toList());
      for (TreeNodeDto tn : children) {
        TreeNode t = dtoToModelConverter.convertDtoToTreeNode(tn, Collections.emptyList());
        TreeNodeTrackingInfo ti = modelToDtoConverter.createNodeTrackingInfo(t);
        ti.setPathName(parent.getName());
        nodesFound.add(ti);
      }
    }
    return nodesFound;
  }

  /**
   * Take the given node and retrieve it's parent. Then perform some action taking the parent as a
   * parameter.
   *
   * @param treeNode The given TreeNode.
   * @param parentNodeAction The action to perform on/with the parent node.
   */
  private void doWithParentNodeFromThisNode(
      TreeNode treeNode, Consumer<TreeNode> parentNodeAction) {
    List<String> ancestorIds = treeNode.getAncestors();
    if (ancestorIds != null && !ancestorIds.isEmpty()) {
      String parentId = ancestorIds.get(ancestorIds.size() - 1);
      TreeNode parentNode = treeNodeRepository.findById(parentId).get();
      if (parentNode != null) {
        parentNodeAction.accept(parentNode);
      }
    }
  }

  @Override
  public List<String> deleteNode(String id, Long versionNumber, boolean remove, AppUser user) {
    TreeNode node = treeNodeRepository.getNode(id, true);
    List<TreeNode> mainNodeAncestors = getAncestors(node);
    if (node == null) {
      throw new NotFoundException("TreeNode with id \"" + id + "\" not found");
    }
    if (versionNumber == null) {
      throw new IllegalArgumentException("version number has to be supplied");
    }

    if (node.getTrashed() != null && node.getTrashed()) {
      return Collections.singletonList(id);
    }

    List<UserGroup> usersGroups = userGroupRepository.findByUserId(user.getId());

    List<String> usersGroupIds =
        usersGroups == null
            ? Collections.emptyList()
            : usersGroups.stream().map(UserGroup::getId).collect(Collectors.toList());

    if (!accessControlUtil.doesUserHaveDeletePermission(
        user, node, mainNodeAncestors, usersGroupIds)) {
      throw new ForbiddenException(
          "User does not have the privileges required to delete this node.");
    }
    checkVersionNumber(node, versionNumber);

    List<TreeNode> childNodes =
        treeNodeRepository.getChildren(id, node.getAncestors().size(), true);

    // collect all ids of nodes  that will be deleted as part of this operation
    List<String> nodeIdsToBeDeleted = new ArrayList<>();
    childNodes.forEach(childNodeReference -> nodeIdsToBeDeleted.add(childNodeReference.getId()));

    nodeIdsToBeDeleted.add(node.getId());

    // figure out if any graph models references any of the id's that we want to delete
    nodeIdsToBeDeleted.forEach(
        nodeId -> {
          List<String> nodesWithDependentReleases =
              treeNodeLogRepository.findDependentBaseNodeReleaseIds(nodeId);
          nodesWithDependentReleases.forEach(
              baseNodeId -> {
                if (!nodeIdsToBeDeleted.contains(baseNodeId)) {
                  throw new FailedDependencyException(
                      "Reference to one of the items deleted exists in "
                          + "the Release of another graph model. Can't perform update.");
                }
              });
          List<TreeNode> dependentGraphModels =
              treeNodeRepository.findDependentNodesByType("MODEL", nodeId);
          dependentGraphModels.forEach(
              depModel -> {
                boolean isTrashedNode =
                    depModel.getTrashed() != null ? depModel.getTrashed() : false;
                // if the dependent model will be deleted as part of this operation
                // as well we'll ignore the dependency
                if (!nodeIdsToBeDeleted.contains(depModel.getId()) && !isTrashedNode) {
                  throw new FailedDependencyException(
                      "Reference to one of the items deleted exists in"
                          + " another graph model. Can't perform update.");
                }
              });
        });

    if (remove) {
      treeNodeRepository.deleteById(id);
      childNodes.forEach(
          childNodeReference -> treeNodeRepository.deleteById(childNodeReference.getId()));
    } else {
      trashUtil.trashItem(node, treeNodeRepository);

      trashUtil.trashItems(childNodes, treeNodeRepository);
    }

    return nodeIdsToBeDeleted;
  }

  @Override
  public TreeNodeDto restoreNodeFromTrash(String id, Long versionNumber, AppUser user) {
    TreeNode node = treeNodeRepository.getNode(id, true);
    if (node == null) {
      throw new NotFoundException("TreeNode with id \"" + id + "\" not found");
    }

    if (node.getAncestors() == null || node.getAncestors().size() < 1) {
      throw new IllegalArgumentException("trying to delete root node");
    }

    if (versionNumber == null) {
      throw new IllegalArgumentException("need to supply version number for restore");
    }

    checkVersionNumber(node, versionNumber);

    List<TreeNode> mainNodeAncestors = getAncestors(node);

    TreeNode parent = mainNodeAncestors.get(mainNodeAncestors.size() - 1);
    if (parent.getTrashed() != null && parent.getTrashed()) {
      throw new TrashStateException("Cannot restore node which has a trashed parent.");
    }

    List<UserGroup> usersGroups = userGroupRepository.findByUserId(user.getId());

    List<String> usersGroupIds =
        usersGroups == null
            ? Collections.emptyList()
            : usersGroups.stream().map(UserGroup::getId).collect(Collectors.toList());

    if (!accessControlUtil.doesUserHaveModifyPermission(
        user, node, mainNodeAncestors, usersGroupIds)) {
      throw new ForbiddenException(
          "User does not have the privileges required to recover this node.");
    }

    ArrayList<String> siblingNames = new ArrayList<String>();
    List<TreeNode> siblingNodes = treeNodeRepository.getChildren(parent);
    siblingNodes.forEach(
        s -> {
          siblingNames.add(s.getName());
        });
    if (siblingNames.contains(node.getName())) {
      throw new DocumentExistsException("A node with this name already exists. Cannot restore.");
    }

    List<TreeNode> restorableChildNodes =
        treeNodeRepository.getTrashedNodes(node.getId(), user.getId());

    treeNodeRepository.restore(node.getId());
    for (TreeNode rNode : restorableChildNodes) {
      treeNodeRepository.restore(rNode.getId());
      // fixme: add to history
    }

    TreeNodeDto outputDto = new TreeNodeDto();

    return outputDto;
  }

  /**
   * Create a TreeNode.
   *
   * @param treeNodeDto TreeNodeDto representing the TreeNode to create.
   * @return TreeNodeDto representing the newly created TreeNode & it's version.
   */
  @Override
  public TreeNodeDto createNode(TreeNodeDto treeNodeDto, AppUser user) {
    validateTreeNode(treeNodeDto, false, false);
    if (treeNodeDto.getAccessControl() == null) {
      treeNodeDto.setAccessControl(AccessControlType.INHERIT);
    }

    TreeNode parentNode = treeNodeRepository.getNode(treeNodeDto.getParentId(), true);
    if (parentNode == null) {
      throw new NotFoundException("Parent not found for node.");
    }

    if (parentNode.getTrashed() != null && parentNode.getTrashed()) {
      throw new TrashStateException("Cannot create node under trashed parent node.");
    }

    List<TreeNode> parentNodeAncestors = getAncestors(parentNode);

    List<UserGroup> usersGroups = userGroupRepository.findByUserId(user.getId());

    List<String> usersGroupIds =
        usersGroups == null
            ? Collections.emptyList()
            : usersGroups.stream().map(UserGroup::getId).collect(Collectors.toList());

    /* meta node get some special access control handling.
     * users with read only access to a simulationresult should be able
     * to create meta nodes underneath it.
     */
    boolean isMetaNode =
        treeNodeDto.getType() == NodeType.META && parentNode.getType() == NodeType.SIMULATIONRESULT;
    // Check for create permission on parent node.
    if (!(accessControlUtil.doesUserHaveCreatePermission(
            user, parentNode, parentNodeAncestors, usersGroupIds)
        || isMetaNode)) {
      throw new ForbiddenException(
          "User does not have the required privileges to create a node here.");
    }

    List<String> ancestors = new ArrayList<>(parentNode.getAncestors());
    ancestors.add(parentNode.getId());

    TreeNode treeNode = dtoToModelConverter.convertDtoToTreeNode(treeNodeDto, ancestors);

    treeNode.setOwnerId(user.getId());
    treeNode.setVersion(null);

    if (StringUtils.isBlank(treeNodeDto.getId())) {
      treeNode.setId(generateGuid());
    } else if (treeNodeRepository.existsById(treeNode.getId())) {
      throw new DocumentExistsException(
          "A node with this ID already exists. The ID can be omitted for auto-generation.");
    }

    ArrayList<String> siblingNames = new ArrayList<String>();
    List<TreeNode> siblingNodes = treeNodeRepository.getChildren(parentNode);
    String originalName = treeNode.getName();
    siblingNodes.forEach(
        s -> {
          siblingNames.add(s.getName());
        });
    if (siblingNames.contains(treeNode.getName())) {
      // Automatically rename the node if the name is already taken
      int index = 1;
      do {
        treeNode.setName(originalName + " " + Integer.toString(index++));
      } while (siblingNames.contains(treeNode.getName()));
    }
    treeNodeRepository.insert(treeNode);

    treeNode.setVersion(0L);
    parentNodeAncestors.add(parentNode);
    List<Permission> usersPermissionsForThisNode =
        accessControlUtil.getCurrentUsersPermissionsForThisNode(
            user, treeNode, parentNodeAncestors, usersGroupIds);

    return convertToAndEnrichTreeNodeDto(
        treeNode, usersPermissionsForThisNode, parentNodeAncestors);
  }

  /**
   * Update a TreeNode.
   *
   * @param treeNodeDto TreeNodeDto representing the content of the TreeNode to update
   * @param user The user who triggered the change.
   * @param versionNumber The version number which this update is based on.
   * @return TreeNodeDto representing the updated TreeNode & it's version.
   */
  @Override
  public TreeNodeDto updateNode(
      TreeNodeDto treeNodeDto, AppUser user, Long versionNumber, boolean sparse) {
    validateTreeNode(treeNodeDto, true, sparse);
    if (treeNodeDto.getAccessControl() == null) {
      treeNodeDto.setAccessControl(AccessControlType.INHERIT);
    }

    // always fetch full content. since we need to send the whole node back to the server after an
    // update
    // fixme: send partial updates to db
    TreeNode currentNode = treeNodeRepository.getNode(treeNodeDto.getId(), false);

    if (currentNode == null) {
      throw new NotFoundException(
          "TreeNode with ID \"" + treeNodeDto.getId() + "\" was not found.");
    }

    if (currentNode.getTrashed() != null && currentNode.getTrashed()) {
      throw new TrashStateException("You cannot update a trashed node.");
    }

    if (currentNode.getAncestors().size() < 1) {
      throw new IllegalArgumentException("can't update the root node");
    }
    List<TreeNode> mainNodeAncestors = getAncestors(currentNode);

    TreeNode parent = mainNodeAncestors.get(mainNodeAncestors.size() - 1);

    if (!treeNodeDto.getParentId().equals(parent.getId())) {
      throw new IllegalArgumentException("can't change parent id");
    }
    if (versionNumber != null) {
      checkVersionNumber(currentNode, versionNumber);
    }

    List<UserGroup> usersGroups = userGroupRepository.findByUserId(user.getId());

    List<String> usersGroupIds =
        usersGroups == null
            ? Collections.emptyList()
            : usersGroups.stream().map(UserGroup::getId).collect(Collectors.toList());

    if (!accessControlUtil.doesUserHaveModifyPermission(
        user, currentNode, mainNodeAncestors, usersGroupIds)) {
      throw new ForbiddenException("User does not have the privileges required to edit this node.");
    }

    if (StringUtils.isNotBlank(treeNodeDto.getOwnerId())) {
      if (!userMongoRepository.existsById(treeNodeDto.getOwnerId())) {
        throw new BadRequestException(
            "The ownerId (\"" + treeNodeDto.getOwnerId() + "\") which was passed does not exist.");
      }

      if (!treeNodeDto.getOwnerId().equals(currentNode.getOwnerId())) {
        if (user.getId().equals(currentNode.getOwnerId())) {
          currentNode.setOwnerId(treeNodeDto.getOwnerId());
        } else {
          throw new ForbiddenException("Only the owner of a node can change it's ownerId.");
        }
      }
    }

    // are we changing the nodes name?
    if (currentNode.getName().compareTo(treeNodeDto.getName()) != 0) {
      // check if one of the siblings uses the name
      ArrayList<String> siblingNames = new ArrayList<>();
      List<TreeNode> siblingNodes = treeNodeRepository.getChildren(parent);
      siblingNodes.forEach(
          s -> {
            siblingNames.add(s.getName());
          });
      if (siblingNames.contains(treeNodeDto.getName())) {
        throw new DocumentExistsException(
            "A node with this name already exists. Please choose a different name.");
      }
      // change the name in all releases
      treeNodeLogRepository.renameReleases(currentNode.getId(), treeNodeDto.getName());
    }

    if (!sparse) {
      currentNode.setContent(treeNodeDto.getContent());
      List<String> deepDependencies = getDeepNodeDependencies(currentNode, this::getDepNode);
      if (deepDependencies.contains(currentNode.getId())) {
        throw new IllegalArgumentException("there is a cyclic dependency in this node");
      }
      currentNode.setProcessDependencies(deepDependencies);
      if (currentNode.getType() == NodeType.MODEL) {
        List<String> removedPortIds =
            GraphModelContentOps.getRemovedPortIds(currentNode, treeNodeDto);
        if (!removedPortIds.isEmpty()) {
          // fixme make this smarter
          List<TreeNode> dependentGraphModels =
              treeNodeRepository.findDependentNodes(currentNode.getId());
          GraphModelContentOps.throwExceptionIfPortRefAppearsInConnections(
              dependentGraphModels, removedPortIds);
        }
      }
    }

    // Ignore any attempts to change permissions by users who are not the owner.
    if (!user.getId().equals(currentNode.getOwnerId())) {
      currentNode.setAcl(currentNode.getAcl());
      currentNode.setAccessControl(currentNode.getAccessControl());
    }

    // save a copy of the old node
    treeNodeLogRepository.insertVersion(NodeLogOps.create(currentNode, user, ""));

    dtoToModelConverter.updateTreeNodeFromDto(currentNode, treeNodeDto, sparse);
    treeNodeRepository.save(currentNode);

    TreeNode savedTreeNode = treeNodeRepository.getNode(currentNode.getId(), true);
    List<Permission> usersPermissionsForThisNode =
        accessControlUtil.getCurrentUsersPermissionsForThisNode(
            user, savedTreeNode, mainNodeAncestors, usersGroupIds);
    return convertToAndEnrichTreeNodeDto(
        savedTreeNode, usersPermissionsForThisNode, mainNodeAncestors);
  }

  @Override
  public List<TreeNodeVersionDto> getHistoryForNode(
      String nodeId,
      AppUser user,
      List<NodeHistoryFilterType> activeFilters,
      boolean alwaysIncludeFirst) {
    BaseNodeInfo bni = getNodeForUser(nodeId, user, true);
    assertPermission(bni, Permission.READ);

    List<TreeNodeLog> versions = treeNodeLogRepository.findVersions(nodeId, true);

    // the latest version is our main node
    versions.add(TreeNodeLog.from(bni.getTreeNode()));

    List<TreeNodeLog> usedVersions = new ArrayList<>();
    // FIXME: adjust filters to new tree node versions
    if (activeFilters.size() > 0 && activeFilters.get(0).toString().equals("hasDescription")) {

      long firstVersion = Long.MAX_VALUE;
      for (TreeNodeLog v : versions) {
        if (v.getVersion() < firstVersion) {
          firstVersion = v.getVersion();
        }
        if (firstVersion == 0L) break;
      }
      for (TreeNodeLog v : versions) {
        if (StringUtils.isNotBlank(v.getLogComment())
            || (v.getVersion().equals(firstVersion) && alwaysIncludeFirst)) {
          usedVersions.add(v);
        }
      }
    } else {
      usedVersions = versions;
    }

    List<TreeNodeVersionDto> versionsDto = new ArrayList<>();
    for (TreeNodeLog v : usedVersions) {
      TreeNodeVersionDto vDto = modelToDtoConverter.createTreeNodeVersion(v);
      vDto.setCurrentUserAccessPermissions(bni.getPermissions());
      versionsDto.add(vDto);
    }

    DtoOps.lookupOwnerNames(versionsDto, this.userMongoRepository);

    return versionsDto;
  }

  /**
   * Edit the description for a specific previous version of an object.
   *
   * @param nodeId The primary key of the object.
   * @param versionNumber The incremental number identifying the previous version of the object.
   * @param description The string forming the description on this version.
   */
  @Override
  public void updateDescription(
      String nodeId, Long versionNumber, String description, AppUser user) {
    BaseNodeInfo bni = getNodeForUser(nodeId, user, true);
    assertPermission(bni, Permission.MODIFY);

    TreeNodeLog version = treeNodeLogRepository.findVersion(nodeId, versionNumber, true);
    if (version == null) {
      throw new NotFoundException(TREE_NODE_NOT_FOUND_MESSAGE);
    }

    treeNodeLogRepository.updateLogComment(version.getId(), description);
  }

  @Override
  public int restoreVersionFromHistory(String nodeId, Long versionNumber, AppUser user) {
    if (StringUtils.isNotBlank(nodeId)) {
      TreeNode node = treeNodeRepository.getNode(nodeId, true);
      if (node == null) {
        throw new NotFoundException("Tree node not found.");
      }
      if (node.getTrashed() != null && node.getTrashed()) {
        throw new TrashStateException("You cannot restore a version of a trashed node.");
      }
      List<TreeNode> mainNodeAncestors = getAncestors(node);

      List<UserGroup> usersGroups = userGroupRepository.findByUserId(user.getId());

      List<String> usersGroupIds =
          usersGroups == null
              ? Collections.emptyList()
              : usersGroups.stream().map(UserGroup::getId).collect(Collectors.toList());

      if (!accessControlUtil.doesUserHaveModifyPermission(
          user, node, mainNodeAncestors, usersGroupIds)) {
        throw new ForbiddenException(
            "User does not have the privileges required to edit comments on this node's history.");
      }
      // fixme: implement restore
    }

    return 0;
  }

  @Override
  public void patchContentForNode(
      String nodeId,
      Long versionNumber,
      TreeNodeContentPatch treeNodeContentPatch,
      AppUser user,
      @Null String description) {
    if (StringUtils.isBlank(nodeId)) {
      throw new BadRequestException("Blank versionId in request.");
    }
    TreeNode node = treeNodeRepository.getNode(nodeId, false);
    if (node == null) {
      throw new NotFoundException("Tree node not found.");
    }
    if (node.getTrashed() != null && node.getTrashed()) {
      throw new TrashStateException("You cannot patch a trashed node.");
    }

    if (versionNumber == null) {
      throw new BadRequestException("versionId is required for conflict check.");
    }

    if (node.getContent() == null) {
      throw new BadRequestException("can't patch node without content");
    }

    Map<String, Object> originalContentCopy = PatchOps.cloneContent(node.getContent());

    checkVersionNumber(node, versionNumber);

    List<TreeNode> mainNodeAncestors = getAncestors(node);

    List<UserGroup> usersGroups = userGroupRepository.findByUserId(user.getId());

    List<String> usersGroupIds =
        usersGroups == null
            ? Collections.emptyList()
            : usersGroups.stream().map(UserGroup::getId).collect(Collectors.toList());

    if (!accessControlUtil.doesUserHaveModifyPermission(
        user, node, mainNodeAncestors, usersGroupIds)) {
      throw new ForbiddenException("User does not have the privileges required to edit this node.");
    }
    AggregatedAccessControlInformation aaci =
        accessControlUtil.getAggregatedAccessControl(node, mainNodeAncestors);

    // FIXME: if patching fails we will end up with a unneeded version
    // in the history
    treeNodeLogRepository.insertVersion(
        NodeLogOps.create(node, user, description != null ? description : ""));

    /*
     * FIXME: it would be way better to build a mongodb update command
     *  from the treeNodeContentPatch. we wouldn't have to fetch
     *  the whole content upfront. this is left for later optimization.
     */
    PatchOps.patchNode(node, treeNodeContentPatch);

    List<String> removedPortIds =
        GraphModelContentOps.getRemovedPortIdsFromContent(originalContentCopy, node.getContent());
    if (!removedPortIds.isEmpty()) {
      List<TreeNode> dependentGraphModels = treeNodeRepository.findDependentNodes(node.getId());
      GraphModelContentOps.throwExceptionIfPortRefAppearsInConnections(
          dependentGraphModels, removedPortIds);
    }
    List<String> deepDependencies = getDeepNodeDependencies(node, this::getDepNode);
    if (deepDependencies.contains(node.getId())) {
      throw new IllegalArgumentException("there is a cyclic dependency in this node");
    }
    node.setProcessDependencies(deepDependencies);

    treeNodeRepository.save(node);
  }

  @Override
  public void moveNode(String nodeId, Long versionNumber, String newParentId, AppUser user) {
    if (StringUtils.isBlank(nodeId)) {
      throw new BadRequestException("Blank versionId in request.");
    }
    TreeNode node = treeNodeRepository.getNode(nodeId, true);
    List<TreeNode> mainNodeAncestors = getAncestors(node);
    if (node == null) {
      throw new NotFoundException("Tree node not found.");
    }
    if (node.getTrashed() != null && node.getTrashed()) {
      throw new TrashStateException("You cannot patch a trashed node.");
    }

    if (versionNumber == null) {
      throw new BadRequestException("versionId is required for conflict check.");
    }

    if (nodeId.equals("root")) {
      throw new BadRequestException("cannot move root node.");
    }

    List<UserGroup> usersGroups = userGroupRepository.findByUserId(user.getId());

    List<String> usersGroupIds =
        usersGroups == null
            ? Collections.emptyList()
            : usersGroups.stream().map(UserGroup::getId).collect(Collectors.toList());

    if (!accessControlUtil.doesUserHaveDeletePermission(
        user, node, mainNodeAncestors, usersGroupIds)) {
      throw new ForbiddenException("User does not have the privileges required to move this node.");
    }
    checkVersionNumber(node, versionNumber);

    TreeNode newParentNode = treeNodeRepository.getNode(newParentId, true);
    List<TreeNode> newParentNodeAncestors = getAncestors(newParentNode);

    if (!accessControlUtil.doesUserHaveCreatePermission(
        user, newParentNode, newParentNodeAncestors, usersGroupIds)) {
      throw new ForbiddenException(
          "User does not have the privileges required to move this node to new parent.");
    }

    ArrayList<String> siblingNames = new ArrayList<String>();
    List<TreeNode> siblingNodes = treeNodeRepository.getChildren(newParentNode);
    siblingNodes.forEach(
        s -> {
          siblingNames.add(s.getName());
        });
    if (siblingNames.contains(node.getName())) {
      throw new DocumentExistsException(
          "A node with this name already exists. Please choose a different name.");
    }

    List<String> newAncestors = new ArrayList<>(newParentNode.getAncestors());
    newAncestors.add(newParentNode.getId());

    UpdateResult mainNodeUpdateResult =
        treeNodeRepository.update(
            nodeId, versionNumber, new Update().set("ancestors", newAncestors));
    if (mainNodeUpdateResult.getModifiedCount() != 1) {
      throw new BadRequestException("failed to move node.");
    }

    List<TreeNode> childNodes =
        treeNodeRepository.getChildren(nodeId, node.getAncestors().size(), true, true);
    for (TreeNode childNode : childNodes) {
      List<String> childAncestors = generateNewAncestors(childNode, nodeId, newAncestors);
      UpdateResult childNodeUpdateResult =
          treeNodeRepository.update(
              childNode.getId(),
              childNode.getVersion(),
              new Update().set("ancestors", childAncestors));
      if (childNodeUpdateResult.getModifiedCount() != 1) {
        throw new BadRequestException("failed to move node.");
      }
    }
  }

  @Override
  public TreeNodeDto copyNode(
      String nodeId, Long versionNumber, String newParentId, String newNodeName, AppUser user) {
    BaseNodeInfo sourceNode = getNodeForUser(nodeId, user, false);
    hazPermission(sourceNode, Permission.READ);
    BaseNodeInfo targetNode = getNodeForUser(newParentId, user, true);
    hazPermission(targetNode, Permission.MODIFY);

    if (targetNode.getTreeNode().getType() != NodeType.FOLDER) {
      throw new BadRequestException("TreeNode can only be copied into a folder.");
    }

    String copiedNodeName = sourceNode.getTreeNode().getName() + " - copy";

    ArrayList<String> siblingNames = new ArrayList<String>();
    List<TreeNode> siblingNodes = treeNodeRepository.getChildren(targetNode.getTreeNode());
    siblingNodes.forEach(
        s -> {
          siblingNames.add(s.getName());
        });
    if (siblingNames.contains(copiedNodeName)) {
      throw new DocumentExistsException(
          "A node with this name already exists. Please choose a different name.");
    }

    TreeNode copiedTreeNode = sourceNode.getTreeNode();
    List<String> newAncestors =
        sourceNode
            .getTreeNode()
            .getAncestors()
            .subList(0, sourceNode.getTreeNode().getAncestors().size() - 1);
    newAncestors.add(newParentId);
    copiedTreeNode.setAncestors(newAncestors);
    copiedTreeNode.setId(this.generateGuid());
    copiedTreeNode.setVersion(0L);
    copiedTreeNode.setName(copiedNodeName);
    this.treeNodeRepository.insert(copiedTreeNode);

    List<TreeNodeLog> releases = this.treeNodeLogRepository.findReleases(nodeId, false);
    releases.forEach(
        (r) -> {
          r.setId(generateGuid());
          r.setBaseNodeId(copiedTreeNode.getId());
          r.setAncestors(copiedTreeNode.getAncestors());
          r.setOwnerId(user.getId());
          r.setName(copiedNodeName);
        });
    this.treeNodeLogRepository.insert(releases);

    TreeNodeDto nodeDto =
        modelToDtoConverter.createTreeNodeDto(copiedTreeNode, targetNode.getPermissions());
    nodeDto.setParentId(newParentId);
    // i guess it's always a folder for now.
    nodeDto.setParentType(NodeType.FOLDER);
    return nodeDto;
  }

  @Override
  public TreeNodeDto copyFolder(String folderId, String newFolderName, AppUser user) {
    BaseNodeInfo sourceFolder = getNodeForUser(folderId, user, true);
    hazPermission(sourceFolder, Permission.READ);

    if (sourceFolder.getTreeNode().getType() != NodeType.FOLDER) {
      throw new BadRequestException("copyFolder source node has to be a folder.");
    }

    String targetFolderUuid = generateGuid();
    Map<String, String> nodeIdMap = new HashMap<>();
    List<TreeNodeLog> targetReleases = new ArrayList<>();
    List<TreeNode> targetNodes = new ArrayList<>();

    List<TreeNode> sourceChildNodes =
        treeNodeRepository.getChildren(
            folderId, sourceFolder.getTreeNode().getAncestors().size(), false);
    for (TreeNode sourceNode : sourceChildNodes) {
      String sourceNodeId = sourceNode.getId();
      TreeNode targetNode = makeTreeNodeUniqueAgain(sourceNode, targetFolderUuid);
      targetNodes.add(targetNode);
      nodeIdMap.put(sourceNodeId, targetNode.getId());
      List<TreeNodeLog> sourceNodeReleases =
          this.treeNodeLogRepository.findReleases(sourceNodeId, false);
      sourceNodeReleases.forEach(
          (r) -> {
            r.setId(generateGuid());
            r.setBaseNodeId(targetNode.getId());
            r.setOwnerId(user.getId());
            r.setAncestors(targetNode.getAncestors());
            targetReleases.add(r);
          });
    }
    for (TreeNode targetNode : targetNodes) {
      DependencyOps.updateDependencies(targetNode, nodeIdMap);
    }
    for (TreeNodeLog targetRelease : targetReleases) {
      DependencyOps.updateDependencies(targetRelease, nodeIdMap);
    }

    TreeNode targetFolder = sourceFolder.getTreeNode();
    targetFolder.setId(targetFolderUuid);
    targetFolder.setOwnerId(user.getId());
    targetFolder.setAncestors(Collections.singletonList("root"));
    targetFolder.setName(sourceFolder.getTreeNode().getName() + " - copy");

    treeNodeRepository.insert(targetFolder);
    treeNodeRepository.insert(targetNodes);
    treeNodeLogRepository.insert(targetReleases);

    TreeNodeDto targetFolderDto =
        modelToDtoConverter.createTreeNodeDto(targetFolder, sourceFolder.getPermissions());
    targetFolderDto.setParentId("root");
    targetFolderDto.setParentType(NodeType.FOLDER);
    return targetFolderDto;
  }

  private TreeNode makeTreeNodeUniqueAgain(TreeNode sourceTreeNode, String parentId) {
    List<String> newAncestors =
        sourceTreeNode.getAncestors().subList(0, sourceTreeNode.getAncestors().size() - 1);
    newAncestors.add(parentId);
    sourceTreeNode.setAncestors(newAncestors);
    sourceTreeNode.setId(this.generateGuid());
    sourceTreeNode.setVersion(0L);
    return sourceTreeNode;
  }

  /**
   * Validate this TreeNodeDto, paying attention to whether it is a create or update operation.
   *
   * @param treeNodeDto The TreeNodeDto being created/updated.
   * @param update true if this is an update operation, false otherwise.
   */
  private void validateTreeNode(TreeNodeDto treeNodeDto, boolean update, boolean sparse) {
    if (treeNodeDto == null) {
      throw new BadRequestException("TreeNode should not be null.");
    }
    // While this if statement could, of course, be merged with the nested one, it is better to
    // leave it like this in order to support additional update-specific validation checks in the
    // future.
    if (update) {
      if (StringUtils.isBlank(treeNodeDto.getId())) {
        throw new BadRequestException("No ID on tree node.");
      }
    }
    if (StringUtils.isBlank(treeNodeDto.getName())) {
      throw new BadRequestException("TreeNode must have a name.");
    }
    if (treeNodeDto.getType() == null) {
      throw new BadRequestException("No type on tree node.");
    }
    if (StringUtils.isBlank(treeNodeDto.getParentId())) {
      throw new BadRequestException("TreeNode must have a parent.");
    }
    if (treeNodeDto.getParentId().equals(treeNodeDto.getId())) {
      throw new BadRequestException("TreeNode cannot be it's own parent.");
    }
    if (treeNodeDto.getAcl() != null) {
      for (AccessPermissionDto accessPermissionDto : treeNodeDto.getAcl()) {
        if (accessPermissionDto.getPermissions() != null) {
          List<Permission> permissions = accessPermissionDto.getPermissions();
          permissions.forEach(
              permission -> {
                if (permission == null) {
                  throw new BadRequestException("Permission in ACL entry cannot be set to null.");
                }
              });
        } else {
          accessPermissionDto.setPermissions(Collections.emptyList());
        }
        if ((accessPermissionDto.getType().equals(AccessIdType.GROUP)
                || accessPermissionDto.getType().equals(AccessIdType.USER))
            && StringUtils.isBlank(accessPermissionDto.getId())) {
          throw new BadRequestException("acl entry with USER or GROUP type must have an ID set.");
        }
        if (accessPermissionDto.getType().equals(AccessIdType.GROUP)
            && !userGroupRepository.existsById(accessPermissionDto.getId())) {
          throw new NotFoundException(
              "Group with ID \"" + accessPermissionDto.getId() + "\" in acl list not found.");
        } else if (accessPermissionDto.getType().equals(AccessIdType.USER)
            && !userMongoRepository.existsById(accessPermissionDto.getId())) {
          throw new NotFoundException(
              "User with ID \"" + accessPermissionDto.getId() + "\" in acl list not found.");
        }
      }
    }
    if (!sparse) {
      treeNodeContentValidationUtil.validateTreeNodeDtoContent(treeNodeDto);
    }
  }

  /**
   * Replace the path to a given ancestor, to accomodate for moving nodes.
   *
   * @param treeNode The node to replace the path to a given ancestor in.
   * @param ancestorId The ID of the ancestor to replace the path for.
   * @param newParentAncestors The new ancestors of the parent.
   */
  private List<String> generateNewAncestors(
      TreeNode treeNode, String ancestorId, List<String> newParentAncestors) {
    List<String> currentAncestors = treeNode.getAncestors();
    int indexOfAncestor = currentAncestors.indexOf(ancestorId);

    List<String> ancestorsFromUpdatedAncestorInclusive =
        currentAncestors.subList(indexOfAncestor, currentAncestors.size());
    List<String> updatedAncestorsList = new ArrayList<>();
    updatedAncestorsList.addAll(newParentAncestors);
    updatedAncestorsList.addAll(ancestorsFromUpdatedAncestorInclusive);
    return updatedAncestorsList;
  }

  /**
   * Convert a TreeNode to a DTO representation and add any additional fields not readily available
   * on the model object.
   *
   * @param treeNode The node to convert.
   * @param userPermissionsForThisNode The permissions which the current user has for this node.
   * @return TreeNodeDto representing the TreeNode to be returned.
   */
  private TreeNodeDto convertToAndEnrichTreeNodeDto(
      TreeNode treeNode, List<Permission> userPermissionsForThisNode, List<TreeNode> ancestors) {
    TreeNodeDto treeNodeDto =
        modelToDtoConverter.createTreeNodeDto(treeNode, userPermissionsForThisNode, ancestors);
    return addExtraFieldsToTreeNodeDto(treeNodeDto);
  }

  /**
   * Populate all "name" fields in a TreeNodeDto.
   *
   * @param treeNodeDto The TreeNodeDto to populate the fields of.
   * @return TreeNodeDto with "name" fields populated.
   */
  private TreeNodeDto addExtraFieldsToTreeNodeDto(TreeNodeDto treeNodeDto) {
    if (StringUtils.isBlank(treeNodeDto.getOwnerId())) {
      return treeNodeDto;
    }

    // fixme: move lookup to the DB
    if (treeNodeDto.getAcl() != null) {
      treeNodeDto
          .getAcl()
          .forEach(
              accessPermissionDto -> {
                if (AccessIdType.USER.equals(accessPermissionDto.getType())
                    && StringUtils.isNotBlank(accessPermissionDto.getId())) {
                  AppUser aclUser = userMongoRepository.findById(accessPermissionDto.getId()).get();
                  if (aclUser != null) {
                    accessPermissionDto.setName(aclUser.getUsername());
                  }
                } else if (AccessIdType.GROUP.equals(accessPermissionDto.getType())
                    && StringUtils.isNotBlank(accessPermissionDto.getId())) {
                  UserGroup userGroup =
                      userGroupRepository.findById(accessPermissionDto.getId()).get();
                  if (userGroup != null) {
                    accessPermissionDto.setName(userGroup.getUserGroupName());
                  }
                }
              });
    }

    return treeNodeDto;
  }

  /**
   * Checks if the provided version number matches the current version number for this node.
   *
   * @param referencedVersionNumber The version number to check for a match.
   * @throws VersionConflictException If the version does not match.
   */
  private void checkVersionNumber(TreeNode node, Long referencedVersionNumber) {
    if (referencedVersionNumber == null || node == null) {
      throw new VersionConflictException("no sufficient version information");
    }
    if (referencedVersionNumber.equals(-1L)) {
      return;
    }
    if (!referencedVersionNumber.equals(node.getVersion())) {
      throw new VersionConflictException(
          "version mismatch " + referencedVersionNumber + "!=" + node.getVersion());
    }
  }
}
