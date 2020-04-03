package com.att.eg.cptl.capacityplanning.backend.service;

import com.att.eg.cptl.capacityplanning.backend.controller.history.NodeHistoryFilterType;
import com.att.eg.cptl.capacityplanning.backend.dto.treenode.TreeNodeDto;
import com.att.eg.cptl.capacityplanning.backend.dto.treenode.TreeNodeVersionDto;
import com.att.eg.cptl.capacityplanning.backend.model.*;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.NodeType;
import java.util.Date;
import java.util.List;
import javax.validation.constraints.Null;
import org.springframework.data.domain.PageRequest;
import org.springframework.lang.Nullable;

public interface TreeNodeService {
  /**
   * Get a node with the given ID.
   *
   * @param id The id to look for.
   * @param user The user who initiated the retrieval.
   * @param showTrash true to show only trashed nodes, false to exclude trashed nodes.
   * @param sparse false to return child nodes with their content field, false to omit content on
   *     child nodes.
   * @return The node if it exists.
   */
  List<TreeNodeDto> getNode(
      String id,
      Boolean showTrash,
      Boolean sparse,
      Boolean withChildren,
      Boolean sparseChildren,
      AppUser user);

  List<TreeNodeDto> getTrashedNodes(String rootNodeId, AppUser user);

  /**
   * Delete a node with the given ID.
   *
   * @param id The id of the node to delete.
   * @param versionNumber Optional version number to check for conflicts.
   * @param remove true will permanently delete the node (and all child nodes). false will trash the
   *     node & child nodes.
   * @param user The user who initiated the delete.
   * @return A list of IDs of the nodes deleted
   */
  List<String> deleteNode(String id, Long versionNumber, boolean remove, AppUser user);

  /**
   * Restore a trashed node with the given ID.
   *
   * @param id The id of the node to recover.
   * @param versionNumber Optional version number to check for conflicts.
   * @param user The user who initiated the recovery.
   */
  TreeNodeDto restoreNodeFromTrash(String id, Long versionNumber, AppUser user);

  /**
   * Create a new tree node.
   *
   * @param treeNodeDto DTO representing the node to be created.
   * @param user The user who initiated the creation.
   * @return TreeNodeDto representing the TreeNode & it's version.
   */
  TreeNodeDto createNode(TreeNodeDto treeNodeDto, AppUser user);

  /**
   * Update a tree node.
   *
   * @param treeNodeDto DTO representing the node to update.
   * @param user The user who initiated the update.
   * @param versionNumber Optional version number to check for conflicts.
   * @return TreeNodeDto representing the TreeNode and it's version.
   */
  TreeNodeDto updateNode(TreeNodeDto treeNodeDto, AppUser user, Long versionNumber, boolean sparse);

  /**
   * Get the history for a given node.
   *
   * @param nodeId The ID of the node to get the history for.
   * @param user The user who initiated the retrieval.
   * @param activeFilters List of the filters to be applied to the list of previous versions.
   * @param alwaysIncludeFirst true to always include version 1, no matter what filters are applied.
   * @return The history for the node.
   */
  List<TreeNodeVersionDto> getHistoryForNode(
      String nodeId,
      AppUser user,
      List<NodeHistoryFilterType> activeFilters,
      boolean alwaysIncludeFirst);

  /**
   * Update the description for a specific version in this node's history.
   *
   * @param nodeId The ID of the node to edit the comment for.
   * @param versionNumber The version ID to edit the comment for.
   * @param description The new comment.
   * @param user The user who initiated the edit.
   */
  void updateDescription(String nodeId, Long versionNumber, String description, AppUser user);

  /**
   * Restore a specific version of the given node.
   *
   * @param nodeId The ID of the node to restore for.
   * @param versionId The version to restore to.
   * @param user The user who initiated the rollback.
   * @return The version number of the restored version.
   */
  int restoreVersionFromHistory(String nodeId, Long versionNumber, AppUser user);

  void patchContentForNode(
      String nodeId,
      Long versionNumber,
      TreeNodeContentPatch treeNodeContentPatch,
      AppUser user,
      @Null String description);

  void moveNode(String nodeId, Long versionNumber, String newParentId, AppUser user);

  TreeNodeDto copyNode(
      String nodeId, Long versionNumber, String newParentId, String newNodeName, AppUser user);

  TreeNodeDto copyFolder(String folderId, String newFolderName, AppUser user);

  List<TreeNodeTrackingInfo> getTrackingInfo(
      AppUser user,
      @Nullable Date updatedAfter,
      @Nullable List<String> processIds,
      @Nullable NodeType nodeType);

  List<TreeNodeTrackingInfo> search(
      AppUser user,
      PageRequest pageRequest,
      @Nullable String searchTerm,
      @Nullable List<NodeType> nodeTypes);

  List<TreeNodeTrackingInfo> findSiblings(
      AppUser user,
      PageRequest pageRequest,
      String siblingReference,
      @Nullable List<NodeType> nodeTypes);
}
