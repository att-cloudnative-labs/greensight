package com.att.eg.cptl.capacityplanning.backend.service;

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
import com.att.eg.cptl.capacityplanning.backend.service.util.objecthistory.TreeNodeHistoryService;
import com.att.eg.cptl.capacityplanning.backend.service.util.treenode.DtoOps;
import com.att.eg.cptl.capacityplanning.backend.service.util.treenode.GraphModelContentOps;
import com.att.eg.cptl.capacityplanning.backend.service.util.treenode.PatchOps;
import com.mongodb.client.result.UpdateResult;
import java.util.*;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;

@SuppressWarnings("squid:S1066")
@Service
public class TreeNodeServiceImpl implements TreeNodeService {
  private static final String TREE_NODE_NOT_FOUND_MESSAGE = "Tree node not found.";

  @Autowired private TreeNodeRepository treeNodeRepository;
  @Autowired private TreeNodeHistoryRepository treeNodeHistoryRepository;

  @Resource private ModelToDtoConverter modelToDtoConverter;

  @Resource private DtoToModelConverter dtoToModelConverter;

  @Resource private TreeNodeHistoryService treeNodeHistoryService;

  @Resource private AccessControlUtil accessControlUtil;

  @Resource private UserGroupRepository userGroupRepository;

  @Resource private UserMongoRepository userMongoRepository;

  @Resource private TrashUtil trashUtil;

  @Resource private TreeNodeContentValidationUtil treeNodeContentValidationUtil;

  @Override
  public List<TreeNodeDto> getNode(
      String id,
      Boolean showTrash,
      Boolean sparse,
      Boolean withChildren,
      Boolean sparseChildren,
      AppUser user) {
    boolean getTrashed = showTrash;
    TreeNode node = treeNodeRepository.getNode(id, sparse);
    if (node == null) {
      throw new NotFoundException(TREE_NODE_NOT_FOUND_MESSAGE);
    }
    if (getTrashed != trashUtil.isItemTrashed(node)) {
      throw new TrashStateException("Cannot get a node with a diverting request trash state.");
    }

    List<TreeNode> ancestors = getAncestors(node);

    List<TreeNodeDto> output = new ArrayList<>();
    List<UserGroup> usersGroups = userGroupRepository.findByUserId(user.getId());

    List<String> usersGroupIds =
        usersGroups == null
            ? Collections.emptyList()
            : usersGroups.stream().map(UserGroup::getId).collect(Collectors.toList());
    List<Permission> usersPermissionsForThisNode =
        accessControlUtil.getCurrentUsersPermissionsForThisNode(
            user, node, ancestors, usersGroupIds);
    if (!usersPermissionsForThisNode.contains(Permission.READ)) {
      throw new NotFoundException(TREE_NODE_NOT_FOUND_MESSAGE);
    }

    if (withChildren) {
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

  public List<ForecastVariableDescriptor> getVariableDescriptors(AppUser user) {
    List<ForecastVariableDescriptor> vdesc = new ArrayList<>();
    List<UserGroup> usersGroups = userGroupRepository.findByUserId(user.getId());

    List<String> usersGroupIds =
        usersGroups == null
            ? Collections.emptyList()
            : usersGroups.stream().map(UserGroup::getId).collect(Collectors.toList());
    List<TreeNode> variableNodes =
        treeNodeRepository.getAll(
            TreeNodeRepositoryCustom.ProjectionType.SPARSE,
            null,
            NodeType.FC_VARIABLE_BD,
            NodeType.FC_VARIABLE_NUM);

    Map<String, List<TreeNode>> ancestors = getAncestorMap(variableNodes);

    for (TreeNode varNode : variableNodes) {
      if (accessControlUtil.doesUserHaveReadPermission(
          user, varNode, ancestors.get(varNode.getId()), usersGroupIds)) {
        vdesc.add(
            modelToDtoConverter.createForecastVariableDescriptor(
                varNode, ancestors.get(varNode.getId())));
      }
    }
    return vdesc;
  }

  @Override
  public List<ProcessInterfaceDescription> getProcessInterfaceDescription(
      AppUser user, @Nullable Date updatedAfter, @Nullable String processId) {
    List<ProcessInterfaceDescription> dtos = new ArrayList<>();
    List<UserGroup> usersGroups = userGroupRepository.findByUserId(user.getId());

    List<String> usersGroupIds =
        usersGroups == null
            ? Collections.emptyList()
            : usersGroups.stream().map(UserGroup::getId).collect(Collectors.toList());
    List<TreeNode> pidNodes =
        treeNodeRepository.getAll(
            TreeNodeRepositoryCustom.ProjectionType.PID, updatedAfter, NodeType.MODEL);
    Map<String, List<TreeNode>> ancestors = getAncestorMap(pidNodes);

    for (TreeNode pidNode : pidNodes) {
      List<Permission> nodePermissions =
          accessControlUtil.getCurrentUsersPermissionsForThisNode(
              user, pidNode, ancestors.get(pidNode.getId()), usersGroupIds);
      if (nodePermissions.indexOf(Permission.READ) > -1) {
        ProcessInterfaceDescription pidDto =
            modelToDtoConverter.createProcessInterfaceDescription(pidNode);
        List<TreeNode> ancestorNodes = ancestors.get(pidNode.getId());
        if (ancestorNodes.size() > 0) {
          TreeNode parentNode = ancestorNodes.get(ancestorNodes.size() - 1);
          pidDto.setPathName(parentNode.getName());
        }
        dtos.add(pidDto);
      }
    }
    return dtos;
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
          List<TreeNode> dependentGraphModels = treeNodeRepository.findDependentNodes(nodeId);
          dependentGraphModels.forEach(
              depModel -> {
                boolean isTrashedNode =
                    depModel.getTrashed() != null ? depModel.getTrashed() : false;
                // if the dependent model will be deleted as part of this operation
                // as well we'll ignore the dependency
                if (!nodeIdsToBeDeleted.contains(depModel.getId()) && !isTrashedNode) {
                  throw new FailedDependencyException(
                      "Reference to one of the items deleted exists in"
                          + "another graph model. Can't perform update.");
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

    treeNodeRepository.insert(treeNode);

    // fixme: we should be able to get away without re-fetching the new node
    TreeNode savedTreeNode = treeNodeRepository.getNode(treeNode.getId(), true);
    parentNodeAncestors.add(parentNode);
    List<Permission> usersPermissionsForThisNode =
        accessControlUtil.getCurrentUsersPermissionsForThisNode(
            user, savedTreeNode, parentNodeAncestors, usersGroupIds);

    TreeNodeDto savedTreeNodeDto =
        convertToAndEnrichTreeNodeDto(treeNode, usersPermissionsForThisNode, parentNodeAncestors);
    return savedTreeNodeDto;
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
    // fixme introduce move node api as we can't move node here atm
    if (!treeNodeDto.getParentId().equals(parent.getId())) {
      throw new IllegalArgumentException("can't change parent id");
    }

    checkVersionNumber(currentNode, versionNumber);

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

    if (!sparse && currentNode.getType() == NodeType.MODEL) {
      currentNode.setContent(treeNodeDto.getContent());
      currentNode.setProcessDependencies(
          GraphModelContentOps.getModelProcModelRefs(currentNode.getContent()));
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

    // Ignore any attempts to change permissions by users who are not the owner.
    if (!user.getId().equals(currentNode.getOwnerId())) {
      currentNode.setAcl(currentNode.getAcl());
      currentNode.setAccessControl(currentNode.getAccessControl());
    }

    dtoToModelConverter.updateTreeNodeFromDto(currentNode, treeNodeDto, sparse);
    treeNodeRepository.save(currentNode);
    // fixme: this should be async
    treeNodeHistoryRepository.save(currentNode, user.getId(), "");

    TreeNode savedTreeNode = treeNodeRepository.getNode(currentNode.getId(), true);
    List<Permission> usersPermissionsForThisNode =
        accessControlUtil.getCurrentUsersPermissionsForThisNode(
            user, savedTreeNode, mainNodeAncestors, usersGroupIds);
    TreeNodeDto savedTreeNodeDto =
        convertToAndEnrichTreeNodeDto(
            savedTreeNode, usersPermissionsForThisNode, mainNodeAncestors);
    return savedTreeNodeDto;
  }

  @Override
  public List<TreeNodeVersionDto> getHistoryForNode(
      String nodeId,
      AppUser user,
      List<NodeHistoryFilterType> activeFilters,
      boolean alwaysIncludeFirst) {
    TreeNode node = treeNodeRepository.getNode(nodeId, true);
    List<TreeNode> mainNodeAncestors = getAncestors(node);
    if (node == null) {
      throw new NotFoundException(TREE_NODE_NOT_FOUND_MESSAGE);
    }

    List<UserGroup> usersGroups = userGroupRepository.findByUserId(user.getId());

    List<String> usersGroupIds =
        usersGroups == null
            ? Collections.emptyList()
            : usersGroups.stream().map(UserGroup::getId).collect(Collectors.toList());

    if (!accessControlUtil.doesUserHaveReadPermission(
        user, node, mainNodeAncestors, usersGroupIds)) {
      throw new ForbiddenException(
          "User does not have the privileges required to view this node's history.");
    }

    List<TreeNodeVersion> versions = treeNodeHistoryRepository.getVersionInfo(nodeId);
    List<TreeNodeVersionDto> versionsDto;
    // FIXME: adjust filters to new tree node versions
    if (activeFilters.size() > 0 && activeFilters.get(0).toString().equals("hasComment")) {
      List<TreeNodeVersion> usedVersions = new ArrayList<>();
      for (TreeNodeVersion v : versions) {
        if (StringUtils.isNotBlank(v.getComment())
            || (v.getVersionId().equals(1L) && alwaysIncludeFirst)) {
          usedVersions.add(v);
        }
      }
      versionsDto = modelToDtoConverter.createTreeNodeVersionsDto(usedVersions);

    } else {
      versionsDto = modelToDtoConverter.createTreeNodeVersionsDto(versions);
    }

    DtoOps.addVersionUserNames(versionsDto, this.userMongoRepository);

    return versionsDto;
  }

  /**
   * Edit the comment for a specific previous version of an object.
   *
   * @param nodeId The primary key of the object.
   * @param versionNumber The incremental number identifying the previous version of the object.
   * @param comment The string forming the comment on this version.
   */
  @Override
  public void editCommentForVersion(
      String nodeId, Long versionNumber, String comment, AppUser user) {
    TreeNode node = treeNodeRepository.getNode(nodeId, true);
    List<TreeNode> mainNodeAncestors = getAncestors(node);
    if (node == null) {
      throw new NotFoundException(TREE_NODE_NOT_FOUND_MESSAGE);
    }

    List<UserGroup> usersGroups = userGroupRepository.findByUserId(user.getId());

    List<String> usersGroupIds =
        usersGroups == null
            ? Collections.emptyList()
            : usersGroups.stream().map(UserGroup::getId).collect(Collectors.toList());

    if (!accessControlUtil.doesUserHaveModifyPermission(
        user, node, mainNodeAncestors, usersGroupIds)) {
      throw new ForbiddenException("User does not have the privileges update this node's history.");
    }
    if (versionNumber < node.getVersion()) {
      // update an old version
      treeNodeHistoryRepository.updateComment(nodeId, versionNumber, user.getId(), comment);
    } else if (versionNumber.equals(node.getVersion())) {
      // create a new version with this comment
      TreeNode fullNode = treeNodeRepository.getNode(nodeId, false);
      treeNodeHistoryRepository.save(fullNode, user.getId(), comment);
    } else {

    }

    // todo: for now we just allow for users which created the version
    // to edit the comment.
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
      String nodeId, Long versionNumber, TreeNodeContentPatch treeNodeContentPatch, AppUser user) {
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
    // FIXME: if patching fails we will end up with a unneeded version
    // in the history
    treeNodeHistoryRepository.save(node, user.getId(), "");

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

    node.setProcessDependencies(GraphModelContentOps.getModelProcModelRefs(node.getContent()));

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
   * Generate a GUID String.
   *
   * @return A unique string.
   */
  private String generateGuid() {
    UUID uuid = UUID.randomUUID();
    return uuid.toString();
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

  private List<TreeNode> getAncestors(TreeNode node) {
    List<TreeNode> ancestorNodes =
        new ArrayList<>(
            treeNodeRepository.getNodes(
                TreeNodeRepositoryCustom.ProjectionType.SPARSE, node.getAncestors()));
    ancestorNodes.sort(
        (n1, n2) ->
            node.getAncestors().indexOf(n1.getId()) - node.getAncestors().indexOf(n2.getId()));
    return ancestorNodes;
  }

  private Map<String, List<TreeNode>> getAncestorMap(List<TreeNode> nodes) {
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
}
