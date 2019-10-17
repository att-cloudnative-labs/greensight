package com.att.eg.cptl.capacityplanning.backendmodel.service;

import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.dao.TreeNodeRepository;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.dao.UserGroupRepository;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.dao.UserMongoRepository;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.dto.treenode.AccessPermissionDto;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.dto.treenode.TreeNodeDto;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.exception.DocumentExistsException;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.exception.FailedDependencyException;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.exception.ForbiddenException;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.exception.NotFoundException;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.exception.TrashStateException;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.exception.VersionConflictException;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.model.AccessControlledTreeObject;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.model.AppUser;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.model.ObjectHistory;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.model.ObjectVersion;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.model.UserGroup;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.model.converter.DtoToModelConverter;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.model.converter.ModelToDtoConverter;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.model.treenode.AccessControlType;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.model.treenode.AccessIdType;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.model.treenode.NodeType;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.model.treenode.Permission;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.model.treenode.TreeNode;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.util.objecthistory.TreeNodeHistoryService;
import com.att.eg.cptl.capacityplanning.backendcommon.commonutilities.accesscontrol.AccessControlUtil;
import com.att.eg.cptl.capacityplanning.backendcommon.commonutilities.trash.TrashUtil;
import com.att.eg.cptl.capacityplanning.backendcommon.commonutilities.validator.treenode.TreeNodeContentValidationUtil;
import com.att.eg.cptl.capacityplanning.backendmodel.controller.history.NodeHistoryFilterType;
import com.att.eg.cptl.capacityplanning.backendmodel.exception.BadRequestException;
import com.att.eg.cptl.capacityplanning.backendmodel.model.TreeNodeContentPatch;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@SuppressWarnings("squid:S1066")
@Service
public class TreeNodeServiceImpl implements TreeNodeService {
  private static final String TREE_NODE_NOT_FOUND_MESSAGE = "Tree node not found.";

  @Autowired private TreeNodeRepository treeNodeRepository;

  @Resource private ModelToDtoConverter modelToDtoConverter;

  @Resource private DtoToModelConverter dtoToModelConverter;

  @Resource private TreeNodeHistoryService treeNodeHistoryService;

  @Resource private AccessControlUtil accessControlUtil;

  @Resource private UserGroupRepository userGroupRepository;

  @Resource private UserMongoRepository userMongoRepository;

  @Resource private TrashUtil<String> trashUtil;

  @Resource private TreeNodeContentValidationUtil treeNodeContentValidationUtil;

  @Override
  public List<TreeNodeDto> getNode(
      String id,
      Integer versionToRetrieve,
      boolean showTrash,
      Boolean sparse,
      Integer depth,
      AppUser user) {
    TreeNode node = treeNodeRepository.findOne(id);
    if (node == null) {
      throw new NotFoundException(TREE_NODE_NOT_FOUND_MESSAGE);
    }

    List<TreeNode> ancestorsOfNode =
        node.getAncestors() == null
            ? Collections.emptyList()
            : treeNodeRepository.getAllAncestors(node.getAncestors());
    List<UserGroup> usersGroups = userGroupRepository.findByUserId(user.getId());

    List<String> usersGroupIds =
        usersGroups == null
            ? Collections.emptyList()
            : usersGroups.stream().map(UserGroup::getId).collect(Collectors.toList());

    if (versionToRetrieve != null) {
      TreeNode oldVersionOfNode = treeNodeHistoryService.getVersion(id, versionToRetrieve);
      if (oldVersionOfNode == null) {
        throw new NotFoundException("Tree node version not found");
      } else if (!accessControlUtil.doesUserHaveReadPermission(
          user, node, ancestorsOfNode, usersGroupIds)) {
        throw new ForbiddenException(
            "User does not have the privileges required to view this node.");
      }
      List<Permission> usersPermissionsForThisNode =
          accessControlUtil.getCurrentUsersPermissionsForThisNode(
              user, node, ancestorsOfNode, usersGroupIds);
      TreeNodeDto outputDto =
          convertToAndEnrichTreeNodeDto(oldVersionOfNode, usersPermissionsForThisNode);
      if (StringUtils.isNotBlank(outputDto.getParentId())
          && treeNodeRepository.exists(outputDto.getParentId())) {
        addParentTypeToTreeNodeDto(outputDto);
      }
      outputDto.setVersion(versionToRetrieve);
      if (sparse) {
        outputDto.setContent(null);
      }
      return Collections.singletonList(outputDto);
    }

    if (showTrash) {
      if (node.getTrashed() != null
          && node.getTrashed()
          && !accessControlUtil.doesUserHaveModifyPermission(
              user, node, ancestorsOfNode, usersGroupIds)) {
        throw new ForbiddenException(
            "User does not have the privileges required to restore this node"
                + ", so it cannot be viewed.");
      }
    } else {
      if (node.getTrashed() != null && node.getTrashed()) {
        throw new TrashStateException("Cannot get a trashed node without trashed flag.");
      }
      if (!accessControlUtil.doesUserHaveReadPermission(
          user, node, ancestorsOfNode, usersGroupIds)) {
        throw new ForbiddenException(
            "User does not have the privileges required to view this node.");
      }
    }

    List<TreeNode> childNodes =
            treeNodeRepository.findChildNodesByAncestorWithContent(id);

    // Filter nodes by depth parameter. 0 returns no child nodes.
    if (depth != null) {
      if (depth < 0) {
        throw new BadRequestException("Depth cannot be a negative value.");
      }
      if (depth == 0) {
        childNodes = Collections.emptyList();
      } else {
        childNodes =
            childNodes
                .stream()
                .filter(
                    childNode ->
                        childNode.getAncestors() == null
                            || childNode.getAncestors().isEmpty()
                            || countAncestorsAfterAndIncluding(childNode.getAncestors(), id)
                                <= depth)
                .collect(Collectors.toList());
      }
    }

    if (showTrash) {
      childNodes =
          filterChildNodesByModifyAccess(user, childNodes, node, ancestorsOfNode, usersGroupIds);
    } else {
      childNodes =
          filterChildNodesByReadAccess(user, childNodes, node, ancestorsOfNode, usersGroupIds);
    }

    childNodes = trashUtil.filterTrashedItems(childNodes, showTrash);

    Map<String, NodeType> idToNodeTypeMapping = new HashMap<>();
    idToNodeTypeMapping.put(node.getId(), node.getType());

    Map<String, Boolean> idToTrashedMapping = new HashMap<>();

    doWithParentNodeFromThisNode(
        node, parentNode -> idToTrashedMapping.put(parentNode.getId(), parentNode.getTrashed()));

    idToTrashedMapping.put(node.getId(), node.getTrashed());

    childNodes.forEach(
        childNode -> {
          idToNodeTypeMapping.put(childNode.getId(), childNode.getType());
          if (showTrash) {
            idToTrashedMapping.put(childNode.getId(), childNode.getTrashed());
          }
        });

    final List<TreeNodeDto> outputNodes = new ArrayList<>();

    List<Permission> usersPermissionsForThisNode =
        accessControlUtil.getCurrentUsersPermissionsForThisNode(
            user, node, ancestorsOfNode, usersGroupIds);

    TreeNodeDto outputDto = convertToAndEnrichTreeNodeDto(node, usersPermissionsForThisNode);
    addParentTypeToTreeNodeDto(outputDto);

    if (sparse) {
      outputDto.setContent(null);
    }

    if ((showTrash && trashUtil.isItemTrashed(node))
        || ((!showTrash) && !trashUtil.isItemTrashed(node))) {
      outputNodes.add(outputDto);
    }

    childNodes.forEach(
        childNode -> {
          List<TreeNode> ancestorsOfChildNode =
              childNode.getAncestors() == null
                  ? Collections.emptyList()
                  : treeNodeRepository.getAllAncestors(childNode.getAncestors());
          List<Permission> usersPermissionsForChildNode =
              accessControlUtil.getCurrentUsersPermissionsForThisNode(
                  user, childNode, ancestorsOfChildNode, usersGroupIds);

          TreeNodeDto outputTreeNodeDto =
              convertToAndEnrichTreeNodeDto(
                  childNode, idToNodeTypeMapping, usersPermissionsForChildNode);
          if (sparse) {
            outputTreeNodeDto.setContent(null);
          }

          if ((showTrash && trashUtil.isItemTrashed(childNode))
              || ((!showTrash) && !trashUtil.isItemTrashed(childNode))) {
            outputNodes.add(outputTreeNodeDto);
          }
        });

    if (showTrash) {
      return outputNodes
          .stream()
          .filter(
              outputNode ->
                  id.equals(outputNode.getId())
                      || id.equals(outputNode.getParentId())
                      || !isParentTrashed(outputNode, idToTrashedMapping))
          .collect(Collectors.toList());
    }

    return outputNodes;
  }

  /**
   * Count the number of ancestors after and including a given ancestor.
   *
   * @param ancestorList The list of the node's ancestors.
   * @param ancestorId The Id of the ancestor to begin counting from.
   * @return The number of ancestors after and including the given ancestor.
   */
  private int countAncestorsAfterAndIncluding(List<String> ancestorList, String ancestorId) {
    if (ancestorList == null || ancestorList.isEmpty()) {
      return 0;
    }
    List<String> newAncestorList = new ArrayList<>();
    boolean ancestorFound = false;
    for (int curAncestor = 0; curAncestor < ancestorList.size(); curAncestor++) {
      if ((!ancestorFound) && ancestorId.equals(ancestorList.get(curAncestor))) {
        ancestorFound = true;
        newAncestorList.add(ancestorList.get(curAncestor));
      } else if (ancestorFound) {
        newAncestorList.add(ancestorList.get(curAncestor));
      }
    }
    return newAncestorList.size();
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
      TreeNode parentNode = treeNodeRepository.findOne(parentId);
      if (parentNode != null) {
        parentNodeAction.accept(parentNode);
      }
    }
  }

  @Override
  public List<String> deleteNode(String id, Integer versionNumber, boolean remove, AppUser user) {
    TreeNode treeNode = treeNodeRepository.findOne(id);
    if (treeNode == null) {
      throw new NotFoundException("TreeNode with id \"" + id + "\" not found");
    }

    if (treeNode.getTrashed() != null && treeNode.getTrashed()) {
      return Collections.singletonList(id);
    }

    List<TreeNode> ancestorsOfNode =
        treeNode.getAncestors() == null
            ? Collections.emptyList()
            : treeNodeRepository.getAllAncestors(treeNode.getAncestors());
    List<UserGroup> usersGroups = userGroupRepository.findByUserId(user.getId());

    List<String> usersGroupIds =
        usersGroups == null
            ? Collections.emptyList()
            : usersGroups.stream().map(UserGroup::getId).collect(Collectors.toList());

    if (!accessControlUtil.doesUserHaveDeletePermission(
        user, treeNode, ancestorsOfNode, usersGroupIds)) {
      throw new ForbiddenException(
          "User does not have the privileges required to delete this node.");
    }
    if (versionNumber != null
        && !versionNumber.equals(treeNode.getVersion())) {
      throw new VersionConflictException(
          "Version mismatch for node - "
              + versionNumber
              + " is not equal to "
              + treeNode.getVersion()
              + ".");
    }

    List<TreeNode> childNodes = treeNodeRepository.findChildNodesByAncestorWithContent(id);

    // collect all ids of nodes that will be deleted as part of this operation
    List<String> nodeIdsToBeDeleted = new ArrayList<>();
    childNodes.forEach(
        childNodeReference -> nodeIdsToBeDeleted.add(childNodeReference.getId()));

    nodeIdsToBeDeleted.add(treeNode.getId());

    // figure out if any graph models references any of the id's that we want to delete
    nodeIdsToBeDeleted.forEach(nodeId -> {
      List<TreeNode> dependentGraphModels = treeNodeRepository.findDependentNodes(nodeId);
      dependentGraphModels.forEach(depModel -> {
        boolean isTrashedNode = depModel.getTrashed() != null ? depModel.getTrashed() : false;
        // if the dependent model will be deleted as part of this opration
        // as well we'll ignore the dependency
        if (!nodeIdsToBeDeleted.contains(depModel.getId()) && !isTrashedNode) {
          throw new FailedDependencyException(
              "Reference to one of the items deleted exists in"
              + "another graph model. Can't perform update.");
        }
      });
    });

    if (remove) {
      if (versionNumber != null) {
        treeNodeRepository.deleteIfNoConflict(id, versionNumber);
      } else {
        treeNodeRepository.delete(id);
      }
      childNodes.forEach(
          childNodeReference -> treeNodeRepository.delete(childNodeReference.getId()));
    } else {
      if (versionNumber != null) {
        checkVersionNumber(id, versionNumber);
      }
      trashUtil.trashItem(
          treeNode, "Node with ID trashed directly.", user.getId(), treeNodeRepository);
      trashUtil.trashItems(
          childNodes,
          "Node trashed as a result of parent/ancestor node with ID \""
              + treeNode.getId()
              + "\" being trashed.",
          user.getId(),
          treeNodeRepository);
    }

    return nodeIdsToBeDeleted;
  }

  @Override
  public TreeNodeDto restoreNodeFromTrash(String id, Integer versionNumber, AppUser user) {
    TreeNode treeNode = treeNodeRepository.findOne(id);
    if (treeNode == null) {
      throw new NotFoundException("TreeNode with id \"" + id + "\" not found");
    }

    doWithParentNodeFromThisNode(
        treeNode,
        parentNode -> {
          if (parentNode.getTrashed() != null && parentNode.getTrashed()) {
            throw new TrashStateException("Cannot restore node which has a trashed parent.");
          }
        });

    if (versionNumber != null) {
      checkVersionNumber(id, versionNumber);
    }

    List<TreeNode> ancestorsOfNode =
        treeNode.getAncestors() == null
            ? Collections.emptyList()
            : treeNodeRepository.getAllAncestors(treeNode.getAncestors());
    List<UserGroup> usersGroups = userGroupRepository.findByUserId(user.getId());

    List<String> usersGroupIds =
        usersGroups == null
            ? Collections.emptyList()
            : usersGroups.stream().map(UserGroup::getId).collect(Collectors.toList());

    if (!accessControlUtil.doesUserHaveModifyPermission(
        user, treeNode, ancestorsOfNode, usersGroupIds)) {
      throw new ForbiddenException(
          "User does not have the privileges required to recover this node.");
    }

    List<TreeNode> childNodes = treeNodeRepository.findChildNodesByAncestorWithContent(id);

    trashUtil.restoreItem(
        treeNode, "Node with ID restored directly.", user.getId(), treeNodeRepository);
    trashUtil.restoreItems(
        childNodes,
        "Node restored as a result of parent/ancestor node with ID \""
            + treeNode.getId()
            + "\" being restored.",
        user.getId(),
        treeNodeRepository);

    TreeNode savedNode = treeNodeRepository.findOne(id);

    List<Permission> usersPermissionsForThisNode =
        accessControlUtil.getCurrentUsersPermissionsForThisNode(
            user, savedNode, ancestorsOfNode, usersGroupIds);

    TreeNodeDto outputDto = convertToAndEnrichTreeNodeDto(savedNode, usersPermissionsForThisNode);

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

    TreeNode parentNode = treeNodeRepository.findOne(treeNodeDto.getParentId());
    if (parentNode == null) {
      throw new NotFoundException("Parent not found for node.");
    }

    if (parentNode.getTrashed() != null && parentNode.getTrashed()) {
      throw new TrashStateException("Cannot create node under trashed parent node.");
    }

    List<TreeNode> ancestorsOfParent =
        parentNode.getAncestors() == null
            ? Collections.emptyList()
            : treeNodeRepository.getAllAncestors(parentNode.getAncestors());
    List<UserGroup> usersGroups = userGroupRepository.findByUserId(user.getId());

    List<String> usersGroupIds =
        usersGroups == null
            ? Collections.emptyList()
            : usersGroups.stream().map(UserGroup::getId).collect(Collectors.toList());

    /* meta node get some special accessc ontrol handling.
     * users with read only access to a simulationresult should be able
     * to create meta nodes underneath it.
     */
    boolean isMetaNode =
        treeNodeDto.getType() == NodeType.META && parentNode.getType() == NodeType.SIMULATIONRESULT;
    // Check for create permission on parent node.
    if (!(accessControlUtil.doesUserHaveCreatePermission(
            user, parentNode, ancestorsOfParent, usersGroupIds)
        || isMetaNode)) {
      throw new ForbiddenException(
          "User does not have the required privileges to create a node here.");
    }

    TreeNode treeNode =
        dtoToModelConverter.convertDtoToTreeNode(
            treeNodeDto, createTreeNodeAncestorsList(treeNodeDto));

    treeNode.setOwnerId(user.getId());

    if (StringUtils.isBlank(treeNodeDto.getId())) {
      treeNode.setId(generateGuid());
    } else if (treeNodeRepository.exists(treeNode.getId())) {
      throw new DocumentExistsException(
          "A node with this ID already exists. The ID can be omitted for auto-generation.");
    }

    ObjectVersion<TreeNode> savedTreeNodeVersion =
        treeNodeRepository.save(treeNode, null, user.getId());
    TreeNode savedTreeNode = savedTreeNodeVersion.getObject();
    List<TreeNode> ancestorsOfNode =
        savedTreeNode.getAncestors() == null
            ? Collections.emptyList()
            : treeNodeRepository.getAllAncestors(savedTreeNode.getAncestors());
    List<Permission> usersPermissionsForThisNode =
        accessControlUtil.getCurrentUsersPermissionsForThisNode(
            user, savedTreeNode, ancestorsOfNode, usersGroupIds);
    TreeNodeDto savedTreeNodeDto =
        convertToAndEnrichTreeNodeDto(savedTreeNode, usersPermissionsForThisNode);
    savedTreeNodeDto.setVersion(savedTreeNodeVersion.getVersionId());
    addParentTypeToTreeNodeDto(savedTreeNodeDto);
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
      TreeNodeDto treeNodeDto, AppUser user, Integer versionNumber, boolean sparse) {
    validateTreeNode(treeNodeDto, true, sparse);
    if (treeNodeDto.getAccessControl() == null) {
      treeNodeDto.setAccessControl(AccessControlType.INHERIT);
    }

    TreeNode currentNode = treeNodeRepository.findOne(treeNodeDto.getId());

    if (currentNode == null) {
      throw new NotFoundException(
          "TreeNode with ID \"" + treeNodeDto.getId() + "\" was not found.");
    }

    if (currentNode.getTrashed() != null && currentNode.getTrashed()) {
      throw new TrashStateException("You cannot update a trashed node.");
    }

    if (versionNumber != null
        && !versionNumber.equals(currentNode.getVersion())) {
      throw new VersionConflictException(
          "Version mismatch for node - "
              + versionNumber
              + " is not equal to "
              + currentNode.getVersion()
              + ".");
    }

    List<TreeNode> ancestorsOfNode =
        currentNode.getAncestors() == null
            ? Collections.emptyList()
            : treeNodeRepository.getAllAncestors(currentNode.getAncestors());
    List<UserGroup> usersGroups = userGroupRepository.findByUserId(user.getId());

    List<String> usersGroupIds =
        usersGroups == null
            ? Collections.emptyList()
            : usersGroups.stream().map(UserGroup::getId).collect(Collectors.toList());

    if (!accessControlUtil.doesUserHaveModifyPermission(
        user, currentNode, ancestorsOfNode, usersGroupIds)) {
      throw new ForbiddenException("User does not have the privileges required to edit this node.");
    }

    List<String> ancestors = createTreeNodeAncestorsList(treeNodeDto);
    TreeNode treeNode = dtoToModelConverter.convertDtoToTreeNode(treeNodeDto, ancestors);
    treeNode.setOwnerId(currentNode.getOwnerId());
    if (StringUtils.isNotBlank(treeNodeDto.getOwnerId())) {
      if (user.getId().equals(currentNode.getOwnerId())) {
        if (!userMongoRepository.exists(treeNodeDto.getOwnerId())) {
          throw new BadRequestException(
              "The ownerId (\""
                  + treeNodeDto.getOwnerId()
                  + "\") which was passed does not exist.");
        }
        treeNode.setOwnerId(treeNodeDto.getOwnerId());
      } else if (!treeNodeDto.getOwnerId().equals(currentNode.getOwnerId())) {
        throw new ForbiddenException("Only the owner of a node can change it's ownerId.");
      }
    } else {
      treeNode.setOwnerId(currentNode.getOwnerId());
    }

    if (!sparse) {
      treeNode.setProcessDependencies(getModelProcModelRefs(treeNode.getContent()));
      List<String> removedPortIds = getRemovedPortIds(currentNode, treeNodeDto);
      if (!removedPortIds.isEmpty()) {
        List<TreeNode> dependentGraphModels =
            treeNodeRepository.findDependentNodes(treeNode.getId());
        throwExceptionIfPortRefAppearsInConnections(dependentGraphModels, removedPortIds);
      }
    }

    // Ignore any attempts to change permissions by users who are not the owner.
    if (!user.getId().equals(currentNode.getOwnerId())) {
      treeNode.setAcl(currentNode.getAcl());
      treeNode.setAccessControl(currentNode.getAccessControl());
    }

    // Override with current content if sparse is true.
    if (sparse && treeNodeDto.getContent() == null) {
      treeNode.setContent(currentNode.getContent());
    }

    ObjectVersion<TreeNode> savedTreeNodeVersion;
    List<TreeNode> childNodesToBeUpdated =
        checkForAndUpdateChildNodeAncestorsBeforeMove(treeNodeDto, ancestors);
    String ancestorId = treeNodeDto.getId();
    if (versionNumber != null) {
      savedTreeNodeVersion =
          treeNodeRepository.saveIfNoConflict(treeNode, null, user.getId(), versionNumber);
    } else {
      savedTreeNodeVersion = treeNodeRepository.save(treeNode, null, user.getId());
    }
    for (TreeNode childNodeToBeUpdated : childNodesToBeUpdated) {
      treeNodeRepository.save(
          childNodeToBeUpdated,
          "Ancestors updated as a result of an ancestor node (ID:\""
              + ancestorId
              + "\") being moved.",
          user.getId());
    }
    TreeNode savedTreeNode = savedTreeNodeVersion.getObject();
    List<Permission> usersPermissionsForThisNode =
        accessControlUtil.getCurrentUsersPermissionsForThisNode(
            user, savedTreeNode, ancestorsOfNode, usersGroupIds);
    TreeNodeDto savedTreeNodeDto =
        convertToAndEnrichTreeNodeDto(savedTreeNode, usersPermissionsForThisNode);
    int savedVersionNumber = savedTreeNodeVersion.getVersionId();
    savedTreeNodeDto.setVersion(savedVersionNumber);
    addParentTypeToTreeNodeDto(savedTreeNodeDto);
    return savedTreeNodeDto;
  }

  @Override
  public ObjectHistory<TreeNode> getHistoryForNode(
      String nodeId,
      AppUser user,
      List<NodeHistoryFilterType> activeFilters,
      boolean alwaysIncludeFirst) {
    TreeNode node = treeNodeRepository.findOne(nodeId);
    if (node == null) {
      throw new NotFoundException(TREE_NODE_NOT_FOUND_MESSAGE);
    }

    List<TreeNode> ancestorsOfNode =
        node.getAncestors() == null
            ? Collections.emptyList()
            : treeNodeRepository.getAllAncestors(node.getAncestors());
    List<UserGroup> usersGroups = userGroupRepository.findByUserId(user.getId());

    List<String> usersGroupIds =
        usersGroups == null
            ? Collections.emptyList()
            : usersGroups.stream().map(UserGroup::getId).collect(Collectors.toList());

    if (!accessControlUtil.doesUserHaveReadPermission(user, node, ancestorsOfNode, usersGroupIds)) {
      throw new ForbiddenException(
          "User does not have the privileges required to view this node's history.");
    }

    ObjectHistory<TreeNode> nodeHistory = treeNodeHistoryService.getHistoryForObject(nodeId);
    if (nodeHistory == null) {
      throw new NotFoundException("Tree node history not found.");
    }

    ObjectVersion<TreeNode> firstVersion = null;
    if (alwaysIncludeFirst) {
      firstVersion = getFirstObjectVersion(nodeHistory);
    }

    if (nodeHistory.getPreviousVersions() != null) {
      activeFilters.forEach(
          filter ->
              nodeHistory.setPreviousVersions(
                  nodeHistory
                      .getPreviousVersions()
                      .stream()
                      .filter(filter::applyFilter)
                      .collect(Collectors.toList())));

      if (alwaysIncludeFirst) {
        boolean firstAlreadyPresent = false;
        for (ObjectVersion<TreeNode> previousVersion : nodeHistory.getPreviousVersions()) {
          if (previousVersion.getVersionId() == 1) {
            firstAlreadyPresent = true;
            break;
          }
        }
        if (!firstAlreadyPresent) {
          nodeHistory.getPreviousVersions().add(firstVersion);
        }
      }
    }

    return nodeHistory;
  }

  /**
   * Edit the comment for a specific previous version of an object.
   *
   * @param nodeId The primary key of the object.
   * @param versionId The incremental number identifying the previous version of the object.
   * @param comment The string forming the comment on this version.
   */
  @Override
  public void editCommentForVersion(String nodeId, int versionId, String comment, AppUser user) {
    TreeNode node = treeNodeRepository.findOne(nodeId);
    if (node == null) {
      throw new NotFoundException(TREE_NODE_NOT_FOUND_MESSAGE);
    }

    List<TreeNode> ancestorsOfNode =
        node.getAncestors() == null
            ? Collections.emptyList()
            : treeNodeRepository.getAllAncestors(node.getAncestors());
    List<UserGroup> usersGroups = userGroupRepository.findByUserId(user.getId());

    List<String> usersGroupIds =
        usersGroups == null
            ? Collections.emptyList()
            : usersGroups.stream().map(UserGroup::getId).collect(Collectors.toList());

    if (!accessControlUtil.doesUserHaveModifyPermission(
        user, node, ancestorsOfNode, usersGroupIds)) {
      throw new ForbiddenException(
          "User does not have the privileges required to edit comments on this node's history.");
    }

    treeNodeHistoryService.editCommentForVersion(nodeId, versionId, comment);
  }

  @Override
  public int restoreVersionFromHistory(String nodeId, int versionId, AppUser user) {
    if (StringUtils.isNotBlank(nodeId)) {
      TreeNode node = treeNodeRepository.findOne(nodeId);
      if (node == null) {
        throw new NotFoundException("Tree node not found.");
      }
      if (node.getTrashed() != null && node.getTrashed()) {
        throw new TrashStateException("You cannot restore a version of a trashed node.");
      }

      List<TreeNode> ancestorsOfNode =
          node.getAncestors() == null
              ? Collections.emptyList()
              : treeNodeRepository.getAllAncestors(node.getAncestors());
      List<UserGroup> usersGroups = userGroupRepository.findByUserId(user.getId());

      List<String> usersGroupIds =
          usersGroups == null
              ? Collections.emptyList()
              : usersGroups.stream().map(UserGroup::getId).collect(Collectors.toList());

      if (!accessControlUtil.doesUserHaveModifyPermission(
          user, node, ancestorsOfNode, usersGroupIds)) {
        throw new ForbiddenException(
            "User does not have the privileges required to edit comments on this node's history.");
      }

      String newComment = "Restored from version " + versionId;
      TreeNode previousVersion = treeNodeHistoryService.getVersion(nodeId, versionId);
      if (previousVersion.getTrashed() != null && previousVersion.getTrashed()) {
        throw new TrashStateException(
            "You cannot restore a node to a previous version which is trashed.");
      }
      return restoreVersion(previousVersion, newComment, user.getId());
    } else {
      throw new BadRequestException("Blank versionId in request.");
    }
  }

  @Override
  public TreeNodeDto patchContentForNode(
      String nodeId, Integer versionId, TreeNodeContentPatch treeNodeContentPatch, AppUser user) {
    if (StringUtils.isNotBlank(nodeId)) {
      TreeNode node = treeNodeRepository.findOne(nodeId);
      if (node == null) {
        throw new NotFoundException("Tree node not found.");
      }
      if (node.getTrashed() != null && node.getTrashed()) {
        throw new TrashStateException("You cannot patch a trashed node.");
      }

      if (versionId != null
          && !versionId.equals(node.getVersion())) {
        throw new VersionConflictException(
            "Version mismatch for node - "
                + versionId
                + " is not equal to "
                + node.getVersion()
                + ".");
      }

      List<TreeNode> ancestorsOfNode =
          node.getAncestors() == null
              ? Collections.emptyList()
              : treeNodeRepository.getAllAncestors(node.getAncestors());
      List<UserGroup> usersGroups = userGroupRepository.findByUserId(user.getId());

      List<String> usersGroupIds =
          usersGroups == null
              ? Collections.emptyList()
              : usersGroups.stream().map(UserGroup::getId).collect(Collectors.toList());

      if (!accessControlUtil.doesUserHaveModifyPermission(
          user, node, ancestorsOfNode, usersGroupIds)) {
        throw new ForbiddenException(
            "User does not have the privileges required to edit this node.");
      }

      patchNode(node, treeNodeContentPatch);

      TreeNode currentNode = treeNodeRepository.findOne(nodeId);
      List<String> removedPortIds = getRemovedPortIds(currentNode, node);
      if (!removedPortIds.isEmpty()) {
        List<TreeNode> dependentGraphModels =
            treeNodeRepository.findDependentNodes(currentNode.getId());
        throwExceptionIfPortRefAppearsInConnections(dependentGraphModels, removedPortIds);
      }

      node.setProcessDependencies(getModelProcModelRefs(node.getContent()));

      ObjectVersion<TreeNode> savedTreeNodeVersion;
      if (versionId != null) {
        savedTreeNodeVersion =
            treeNodeRepository.saveIfNoConflict(
                node, null, user.getId(), versionId);
      } else {
        throw new BadRequestException("versionId is required for conflict check.");
      }

      TreeNode savedTreeNode = savedTreeNodeVersion.getObject();
      List<Permission> usersPermissionsForThisNode =
          accessControlUtil.getCurrentUsersPermissionsForThisNode(
              user, savedTreeNode, ancestorsOfNode, usersGroupIds);
      TreeNodeDto savedTreeNodeDto =
          convertToAndEnrichTreeNodeDto(savedTreeNode, usersPermissionsForThisNode);
      int savedVersionNumber = savedTreeNodeVersion.getVersionId();
      savedTreeNodeDto.setVersion(savedVersionNumber);
      addParentTypeToTreeNodeDto(savedTreeNodeDto);
      savedTreeNodeDto.setContent(null);
      return savedTreeNodeDto;
    } else {
      throw new BadRequestException("Blank versionId in request.");
    }
  }

  private void patchNode(TreeNode treeNode, TreeNodeContentPatch treeNodeContentPatch) {
    Map<String, Object> nodeContent = treeNode.getContent();
    if (nodeContent == null) {
      nodeContent = new HashMap<>();
    }
    Map<String, Object> fieldsToAdd = treeNodeContentPatch.getAdded();
    Map<String, Object> fieldsToUpdate = treeNodeContentPatch.getUpdated();
    Map<String, Object> fieldsToDelete = treeNodeContentPatch.getDeleted();

    addFieldsToContent(nodeContent, fieldsToAdd);
    updateFieldsInContent(nodeContent, fieldsToUpdate);
    deleteFieldsInContent(nodeContent, fieldsToDelete);
  }

  private void addFieldsToContent(Map<String, Object> content, Map<String, Object> fieldsToAdd) {
    if (fieldsToAdd != null) {
      for (Map.Entry<String, Object> entry : fieldsToAdd.entrySet()) {
        if (entry.getValue() instanceof Map) {
          if (content.get(entry.getKey()) == null) {
            content.put(entry.getKey(), new HashMap<>());
          } else if ((content.get(entry.getKey()) instanceof List)) {
            Map<String, Object> arrayAddList = (Map<String, Object>) entry.getValue();
            List<Object> l = new ArrayList<>((List)content.get(entry.getKey()));
            for (Map.Entry<String, Object> updateEntry : arrayAddList.entrySet()) {
              // ignoring the index for adding. i guess that's ok (:)
              l.add(updateEntry.getValue());
            }
            content.put(entry.getKey(), l);
            continue;
          } else if (!(content.get(entry.getKey()) instanceof HashMap)) {
            content.put(entry.getKey(), new HashMap<>((Map<String, Object>) entry.getValue()));
          }
          addFieldsToContent(
              (Map<String, Object>) content.get(entry.getKey()),
              (Map<String, Object>) entry.getValue());
        } else {
          content.put(entry.getKey(), entry.getValue());
        }
      }
    }
  }

  private void updateFieldsInContent(
      Map<String, Object> content, Map<String, Object> fieldsToUpdate) {
    if (fieldsToUpdate != null) {
      for (Map.Entry<String, Object> entry : fieldsToUpdate.entrySet()) {
        if (entry.getValue() instanceof Map) {
          if (content.get(entry.getKey()) == null) {
            content.put(entry.getKey(), new HashMap<>());
          } else if ((content.get(entry.getKey()) instanceof List)) {
            Map<String, Object> arrayUpdateList = (Map<String, Object>) entry.getValue();
            List<Object> l = new ArrayList<>((List)content.get(entry.getKey()));
            for (Map.Entry<String, Object> updateEntry : arrayUpdateList.entrySet()) {
              Integer arrayIndex = Integer.parseInt(updateEntry.getKey());
              if (l.get(arrayIndex) instanceof HashMap
                  && updateEntry.getValue() instanceof HashMap) {
                updateFieldsInContent(
                    (Map<String, Object>)l.get(arrayIndex),
                    (Map<String, Object>)updateEntry.getValue());
              } else {
                l.set(arrayIndex, updateEntry.getValue());
              }
            }
            content.put(entry.getKey(), l);
            continue;
          } else if (!(content.get(entry.getKey()) instanceof HashMap)) {
            content.put(entry.getKey(), new HashMap<>((Map<String, Object>) entry.getValue()));
          }
          updateFieldsInContent(
              (Map<String, Object>) content.get(entry.getKey()),
              (Map<String, Object>) entry.getValue());
        } else {
          content.put(entry.getKey(), entry.getValue());
        }
      }
    }
  }

  private void deleteFieldsInContent(
      Map<String, Object> content, Map<String, Object> fieldsToDelete) {
    if (fieldsToDelete != null) {
      for (Map.Entry<String, Object> entry : fieldsToDelete.entrySet()) {
        if ((content.get(entry.getKey()) instanceof List)) {
          Map<String, Object> arrayDeleteList = (Map<String, Object>) entry.getValue();
          List<Object> l = new ArrayList<>((List)content.get(entry.getKey()));
          for (Map.Entry<String, Object> updateEntry : arrayDeleteList.entrySet()) {
            // FIXME: this is most likely broken for multiple deletes
            l.remove(Integer.parseInt(updateEntry.getKey()));
          }
          content.put(entry.getKey(), l);
          continue;
        }
        if (entry.getValue() instanceof Map) {
          deleteFieldsInContent(
              (Map<String, Object>) content.get(entry.getKey()),
              (Map<String, Object>) entry.getValue());
        } else {
          content.remove(entry.getKey());
        }
      }
    }
  }

  /**
   * Restore a tree node to the given previous version.
   *
   * @param previousVersion The previous version of the node.
   * @param newComment The comment to save with the newly created version of this node (which has
   *     the content of the previous version)
   * @param userId The userId of the user who initiated the restore.
   * @return The version number of the newly restored version.
   */
  private int restoreVersion(TreeNode previousVersion, String newComment, String userId) {
    if (previousVersion != null) {
      ObjectVersion savedVersion = treeNodeRepository.save(previousVersion, newComment, userId);
      return savedVersion.getVersionId();
    } else {
      throw new NotFoundException("Version not found.");
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
            && !userGroupRepository.exists(accessPermissionDto.getId())) {
          throw new NotFoundException(
              "Group with ID \"" + accessPermissionDto.getId() + "\" in acl list not found.");
        } else if (accessPermissionDto.getType().equals(AccessIdType.USER)
            && !userMongoRepository.exists(accessPermissionDto.getId())) {
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
   * Create the list of ancestors for a TreeNode by taking it's parent's ancestors and adding the
   * parent to this list.
   *
   * @param treeNodeDto TreeNodeDto representing the tree node to build the ancestor list for.
   * @return Ordered List of the node's ancestors.
   */
  private List<String> createTreeNodeAncestorsList(TreeNodeDto treeNodeDto) {
    if (StringUtils.isNotBlank(treeNodeDto.getParentId())) {
      String parentId = treeNodeDto.getParentId();
      TreeNode parentNode = treeNodeRepository.findOne(parentId);
      if (parentNode == null) {
        throw new NotFoundException("Parent node not found.");
      } else {
        if (parentNode.getAncestors() != null
            && parentNode.getAncestors().contains(treeNodeDto.getId())) {
          throw new BadRequestException(
              "You cannot set a child node of <i>this node</i> as <i>this node's</i> parent.");
        }
      }
      List<String> parentAncestors = parentNode.getAncestors();
      List<String> nodeAncestors = new ArrayList<>();
      if (parentAncestors != null) {
        nodeAncestors.addAll(parentAncestors);
      }
      nodeAncestors.add(parentId);
      return nodeAncestors;
    } else {
      throw new BadRequestException("Parent not defined.");
    }
  }

  /**
   * Replace the path to a given ancestor in the child nodes of this node, in preparation for moving
   * it.
   *
   * @param treeNodeDto TreeNodeDto representing the node being moved.
   * @param newAncestors The new list of ancestors for this node.
   * @return List of TreeNodes, representing the child nodes of the node being moved, with the path
   *     to the node being moved replaced by the new path.
   */
  private List<TreeNode> checkForAndUpdateChildNodeAncestorsBeforeMove(
      TreeNodeDto treeNodeDto, List<String> newAncestors) {
    TreeNode currentTreeNode = treeNodeRepository.findOne(treeNodeDto.getId());
    if (currentTreeNode.getAncestors() != null
        && !currentTreeNode.getAncestors().equals(newAncestors)) {
      List<TreeNode> currentChildNodes =
          treeNodeRepository.findChildNodesByAncestorWithContent(treeNodeDto.getId());
      for (TreeNode currentChildNode : currentChildNodes) {
        replacePathToAncestor(currentChildNode, treeNodeDto.getId(), newAncestors);
      }
      return currentChildNodes;
    }
    return Collections.emptyList();
  }

  /**
   * Replace the path to a given ancestor, to accomodate for moving nodes.
   *
   * @param treeNode The node to replace the path to a given ancestor in.
   * @param ancestorId The ID of the ancestor to replace the path for.
   * @param newParentAncestors The new ancestors of the parent.
   */
  private void replacePathToAncestor(
      TreeNode treeNode, String ancestorId, List<String> newParentAncestors) {
    List<String> currentAncestors = treeNode.getAncestors();
    int indexOfAncestor = currentAncestors.indexOf(ancestorId);

    List<String> ancestorsFromUpdatedAncestorInclusive =
        currentAncestors.subList(indexOfAncestor, currentAncestors.size());
    List<String> updatedAncestorsList = new ArrayList<>();
    updatedAncestorsList.addAll(newParentAncestors);
    updatedAncestorsList.addAll(ancestorsFromUpdatedAncestorInclusive);
    treeNode.setAncestors(updatedAncestorsList);
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
   * Add the type of the parent for the node represented by this DTO, to this DTO.
   *
   * @param treeNodeDto The DTO to add the parent's type to.
   */
  private void addParentTypeToTreeNodeDto(TreeNodeDto treeNodeDto) {
    if (StringUtils.isNotBlank(treeNodeDto.getParentId())) {
      // This is already checked for existence.
      TreeNode parentNode = treeNodeRepository.findOne(treeNodeDto.getParentId());
      treeNodeDto.setParentType(parentNode.getType());
    }
  }

  /**
   * Add the current version number to the given DTO.
   *
   * @param outputTreeNodeDto The DTO to add the version number to.
   */
  private void addVersionToNode(TreeNodeDto outputTreeNodeDto) {
    ObjectHistory<TreeNode> nodeHistory =
        treeNodeHistoryService.getHistoryForObject(outputTreeNodeDto.getId());
    outputTreeNodeDto.setVersion(getCurrentVersionNumberFromObjectHistory(nodeHistory));
  }

  /**
   * Get the version number for the newest version of the node stored in this ObjectHistory.
   *
   * @param objectHistory The history for this node.
   * @return The current version number for the newest version stored in this ObjectHistory.
   */
  private int getCurrentVersionNumberFromObjectHistory(ObjectHistory<TreeNode> objectHistory) {
    int currentVersionNumber = 0;
    List<ObjectVersion<TreeNode>> previousObjectVersions = objectHistory.getPreviousVersions();
    for (ObjectVersion objectVersion : previousObjectVersions) {
      if (objectVersion.getVersionId() >= currentVersionNumber) {
        currentVersionNumber = objectVersion.getVersionId();
      }
    }
    return currentVersionNumber;
  }

  /**
   * Remove nodes from the list if the current user does not have read access for them.
   *
   * @param user The current user.
   * @param childNodes The list of nodes to filter.
   * @param nodeBeingRetrieved The root node being retrieved.
   * @param nodesAncestors The ancestors of this node.
   * @param usersGroupIds A list of group Ids for groups which the user belongs to.
   * @return The list of child nodes with invisible nodes removed.
   */
  private List<TreeNode> filterChildNodesByReadAccess(
      AppUser user,
      List<TreeNode> childNodes,
      TreeNode nodeBeingRetrieved,
      List<TreeNode> nodesAncestors,
      List<String> usersGroupIds) {
    List<TreeNode> filteredList = new ArrayList<>();

    Map<String, AccessControlledTreeObject> idToNodeMapping = new HashMap<>();
    idToNodeMapping.put(nodeBeingRetrieved.getId(), nodeBeingRetrieved);
    nodesAncestors.forEach(nodeAncestor -> idToNodeMapping.put(nodeAncestor.getId(), nodeAncestor));
    childNodes.forEach(childNode -> idToNodeMapping.put(childNode.getId(), childNode));

    for (TreeNode childNode : childNodes) {
      List<AccessControlledTreeObject> nodeAncestors = new ArrayList<>();
      List<String> ancestorIds = childNode.getAncestors();
      if (ancestorIds != null) {
        ancestorIds.forEach(ancestorId -> nodeAncestors.add(idToNodeMapping.get(ancestorId)));
      }

      if (accessControlUtil.doesUserHaveReadPermission(
          user, childNode, nodeAncestors, usersGroupIds)) {
        filteredList.add(childNode);
      }
    }

    return filteredList;
  }

  /**
   * Remove nodes from the list if the current user does not have modify access for them.
   *
   * @param user The current user.
   * @param childNodes The list of nodes to filter.
   * @param nodeBeingRetrieved The root node being retrieved.
   * @param nodesAncestors The ancestors of this node.
   * @param usersGroupIds A list of group Ids for groups which the user belongs to.
   * @return The list of child nodes with unmodifiable nodes removed.
   */
  private List<TreeNode> filterChildNodesByModifyAccess(
      AppUser user,
      List<TreeNode> childNodes,
      TreeNode nodeBeingRetrieved,
      List<TreeNode> nodesAncestors,
      List<String> usersGroupIds) {
    List<TreeNode> filteredList = new ArrayList<>();

    Map<String, AccessControlledTreeObject> idToNodeMapping = new HashMap<>();
    idToNodeMapping.put(nodeBeingRetrieved.getId(), nodeBeingRetrieved);
    nodesAncestors.forEach(nodeAncestor -> idToNodeMapping.put(nodeAncestor.getId(), nodeAncestor));
    childNodes.forEach(childNode -> idToNodeMapping.put(childNode.getId(), childNode));

    for (TreeNode childNode : childNodes) {
      List<AccessControlledTreeObject> nodeAncestors = new ArrayList<>();
      List<String> ancestorIds = childNode.getAncestors();
      if (ancestorIds != null) {
        ancestorIds.forEach(ancestorId -> nodeAncestors.add(idToNodeMapping.get(ancestorId)));
      }

      if (accessControlUtil.doesUserHaveModifyPermission(
          user, childNode, nodeAncestors, usersGroupIds)) {
        filteredList.add(childNode);
      }
    }

    return filteredList;
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
      TreeNode treeNode, List<Permission> userPermissionsForThisNode) {
    TreeNodeDto treeNodeDto =
        modelToDtoConverter.createTreeNodeDto(treeNode, userPermissionsForThisNode);
    return addExtraFieldsToTreeNodeDto(treeNodeDto);
  }

  /**
   * Convert a TreeNode to a DTO representation and add any additional fields not readily available
   * on the model object.
   *
   * @param treeNode The node to convert.
   * @param idToNodeTypeMapping Mapping of id to node type for all nodes in the tree, allowing
   *     "type" fields to be populated.
   * @param userPermissionsForThisNode The permissions which the current user has for this node.
   * @return TreeNodeDto representing the TreeNode to be returned.
   */
  private TreeNodeDto convertToAndEnrichTreeNodeDto(
      TreeNode treeNode,
      Map<String, NodeType> idToNodeTypeMapping,
      List<Permission> userPermissionsForThisNode) {
    TreeNodeDto treeNodeDto =
        modelToDtoConverter.createTreeNodeDtoFromChildNode(
            treeNode, idToNodeTypeMapping, userPermissionsForThisNode);
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
    AppUser user = userMongoRepository.findById(treeNodeDto.getOwnerId());
    if (user != null) {
      treeNodeDto.setOwnerName(user.getUsername());
    }

    if (treeNodeDto.getAcl() != null) {
      treeNodeDto
          .getAcl()
          .forEach(
              accessPermissionDto -> {
                if (AccessIdType.USER.equals(accessPermissionDto.getType())
                    && StringUtils.isNotBlank(accessPermissionDto.getId())) {
                  AppUser aclUser = userMongoRepository.findById(accessPermissionDto.getId());
                  if (aclUser != null) {
                    accessPermissionDto.setName(aclUser.getUsername());
                  }
                } else if (AccessIdType.GROUP.equals(accessPermissionDto.getType())
                    && StringUtils.isNotBlank(accessPermissionDto.getId())) {
                  UserGroup userGroup = userGroupRepository.findOne(accessPermissionDto.getId());
                  if (userGroup != null) {
                    accessPermissionDto.setName(userGroup.getUserGroupName());
                  }
                }
              });
    }

    return treeNodeDto;
  }

  /**
   * Determines if the parent of this node is trashed, using the provided id to trashed flag
   * mapping.
   *
   * @param outputDto The TreeNodeDto to check for a trashed parent.
   * @param idToTrashedMapping Mapping of ID to trashed flag for all nodes in the response.
   * @return True if the parent is trashed.
   */
  private Boolean isParentTrashed(TreeNodeDto outputDto, Map<String, Boolean> idToTrashedMapping) {
    if (outputDto.getParentId() == null) {
      return false;
    }
    Boolean parentTrashedFlag = idToTrashedMapping.get(outputDto.getParentId());
    return parentTrashedFlag != null && parentTrashedFlag;
  }

  /**
   * Checks if the provided version number matches the current version number for this node.
   *
   * @param id The id of the node to check.
   * @param referencedVersionNumber The version number to check for a match.
   * @throws VersionConflictException If the version does not match.
   */
  private void checkVersionNumber(String id, Integer referencedVersionNumber) {
    ObjectHistory<TreeNode> objectHistory = treeNodeHistoryService.getHistoryForObject(id);
    if (objectHistory == null) {
      throw new NotFoundException("ObjectHistory not found for node with ID \"" + id + "\"");
    } else {
      int currentVersionNumber = this.getCurrentVersionNumber(objectHistory);
      if (currentVersionNumber != referencedVersionNumber) {
        throw new VersionConflictException(
            "Version mismatch for node - "
                + referencedVersionNumber
                + " is not equal to "
                + currentVersionNumber
                + ".");
      }
    }
  }

  /**
   * Get the current version Id to be used for the current newest persisted previous version stored
   * in this ObjectHistory.
   *
   * @param objectHistory The ObjectHistory for which to get the latest version Id.
   * @return The current versionId. 0 if there are currently no versions (By design this should not
   *     occur)
   */
  private int getCurrentVersionNumber(ObjectHistory<TreeNode> objectHistory) {
    int currentVersionNumber = 0;
    List<ObjectVersion<TreeNode>> previousObjectVersions = objectHistory.getPreviousVersions();
    for (ObjectVersion objectVersion : previousObjectVersions) {
      if (objectVersion.getVersionId() >= currentVersionNumber) {
        currentVersionNumber = objectVersion.getVersionId();
      }
    }
    return currentVersionNumber;
  }

  /**
   * Get the first version of a node.
   *
   * @param treeNodeHistory The history of the node to get the first version of.
   * @return The first version of the node in this history.
   */
  private ObjectVersion<TreeNode> getFirstObjectVersion(ObjectHistory<TreeNode> treeNodeHistory) {
    for (ObjectVersion<TreeNode> objectVersion : treeNodeHistory.getPreviousVersions()) {
      if (1 == objectVersion.getVersionId()) {
        return objectVersion;
      }
    }
    throw new NotFoundException("First tree node version not present in node's history.");
  }

  private List<String> getModelNodePortIds(Map<String, Object> modelNodeContent, String portType) {
    List<String> portIds = new ArrayList<>();
    if (modelNodeContent != null) {
      if (modelNodeContent.get(portType) != null) {
        Map<String, Object> ports = (Map<String, Object>) modelNodeContent.get(portType);
        portIds.addAll(ports.keySet());
      }
    }
    return portIds;
  }

  private List<String> getRemovedPortIds(TreeNode oldNode, TreeNodeDto updatedNode) {
    if (oldNode.getType() == NodeType.MODEL && updatedNode.getType() == NodeType.MODEL) {
      return getRemovedPortIdsFromContent(oldNode.getContent(), updatedNode.getContent());
    }
    return new ArrayList<>();
  }

  private List<String> getRemovedPortIds(TreeNode oldNode, TreeNode updatedNode) {
    if (oldNode.getType() == NodeType.MODEL && updatedNode.getType() == NodeType.MODEL) {
      return getRemovedPortIdsFromContent(oldNode.getContent(), updatedNode.getContent());
    }
    return new ArrayList<>();
  }

  private List<String> getRemovedPortIdsFromContent(Map<String, Object> oldNodeContent,
      Map<String, Object> updatedNodeContent) {
    List<String> portIds = new ArrayList<>();
    List<String> oldIn = getModelNodePortIds(oldNodeContent, "inports");
    List<String> updatedIn = getModelNodePortIds(updatedNodeContent, "inports");
    for (String oldInportId : oldIn) {
      if (!updatedIn.contains(oldInportId)) {
        portIds.add(oldInportId);
      }
    }
    List<String> oldOut = getModelNodePortIds(oldNodeContent, "outports");
    List<String> updatedOut = getModelNodePortIds(updatedNodeContent, "outports");
    for (String oldOutportId : oldOut) {
      if (!updatedOut.contains(oldOutportId)) {
        portIds.add(oldOutportId);
      }
    }
    return portIds;
  }

  private List<String> getModelProcPortRefs(Map<String, Object> modelNodeContent, String portType) {
    List<String> portIds = new ArrayList<>();
    if (modelNodeContent != null) {
      if (modelNodeContent.get("processes") != null) {
        Map<String, Map<String, Object>> processes =
            (Map<String, Map<String, Object>>) modelNodeContent.get("processes");
        for (Map<String, Object> proc : processes.values()) {
          if (proc.get(portType) != null) {
            Map<String, Object> ports = (Map<String, Object>) proc.get(portType);
            for (Object port : ports.values()) {
              Map<String, Object> portMap = (Map<String, Object>) port;
              if (portMap.get("ref") != null) {
                portIds.add((String) portMap.get("ref"));
              }
            }
          }
        }
      }
    }
    return portIds;
  }

  private List<String> getModelProcModelRefs(Map<String, Object> modelNodeContent) {
    List<String> modelRefIds = new ArrayList<>();
    if (modelNodeContent != null) {
      if (modelNodeContent.get("processes") != null) {
        Map<String, Map<String, Object>> processes =
            (Map<String, Map<String, Object>>) modelNodeContent.get("processes");
        for (Map<String, Object> proc : processes.values()) {
          if ("GRAPH_MODEL".equals(proc.get("type"))) {
            modelRefIds.add((String) proc.get("ref"));
          }
        }
      } else if (modelNodeContent.get("modelRef") != null) {
        modelRefIds.add((String) modelNodeContent.get("modelRef"));
      }
    }
    return modelRefIds;
  }

  // get a map of process port ref id -> process port id for a given port type
  private Map<String, String> getModelProcPortMap(
      Map<String, Object> modelNodeContent, String portType) {
    Map<String, String> portIdMap = new HashMap<>();
    if (modelNodeContent != null) {
      if (modelNodeContent.get("processes") != null) {
        Map<String, Map<String, Object>> processes =
            (Map<String, Map<String, Object>>) modelNodeContent.get("processes");
        for (Map<String, Object> proc : processes.values()) {
          if (proc.get(portType) != null) {
            Map<String, Object> ports = (Map<String, Object>) proc.get(portType);
            for (Entry<String, Object> port : ports.entrySet()) {
              String processPortId = port.getKey();
              Map<String, Object> portMap = (Map<String, Object>) port.getValue();
              if (portMap.get("ref") != null) {
                portIdMap.put((String) portMap.get("ref"), processPortId);
              }
            }
          }
        }
      }
    }
    return portIdMap;
  }

  private List<String> getModelConnectionPortIds(Map<String, Object> modelNodeContent) {
    List<String> connectionPortIds = new ArrayList<>();
    if (modelNodeContent.get("connections") != null) {
      Map<String, Map<String, String>> connections =
          (Map<String, Map<String, String>>) modelNodeContent.get("connections");
      for (Map<String, String> connection : connections.values()) {
        if (connection.get("source") != null) {
          connectionPortIds.add(connection.get("source"));
        }
        if (connection.get("destination") != null) {
          connectionPortIds.add(connection.get("destination"));
        }
      }
    }
    return connectionPortIds;
  }

  private void throwExceptionIfPortRefAppearsInConnections(
      List<TreeNode> allModels, List<String> portIds) {

    // start with collecting all models that use the portIds given.

    // TODO: could optimize by only looking for the processes with the ref
    // of the graph model that is about to be updated
    for (TreeNode treeNode : allModels) {
      List<String> offendingProcessPortIds = new ArrayList<>();
      if (treeNode.getContent() != null) {
        Map<String, String> inProcPortRefMap =
            getModelProcPortMap(treeNode.getContent(), "inports");
        Map<String, String> outProcPortRefMap =
            getModelProcPortMap(treeNode.getContent(), "outports");
        for (String portId : portIds) {
          if (inProcPortRefMap.containsKey(portId)) {
            offendingProcessPortIds.add(inProcPortRefMap.get(portId));
          }
          if (outProcPortRefMap.containsKey(portId)) {
            offendingProcessPortIds.add(outProcPortRefMap.get(portId));
          }
        }
        if (!offendingProcessPortIds.isEmpty()) {
          List<String> connectionPortIds = getModelConnectionPortIds(treeNode.getContent());
          if (!Collections.disjoint(offendingProcessPortIds, connectionPortIds)) {
            throw new FailedDependencyException(
                "Reference to the port deleted exists in other graph model. Can't perform update.");
          }
        }
      }
    }
  }
}
