package com.att.eg.cptl.capacityplanning.backendmodel.service;

import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.dto.treenode.TreeNodeDto;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.model.AppUser;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.model.ObjectHistory;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.model.treenode.TreeNode;
import com.att.eg.cptl.capacityplanning.backendmodel.controller.history.NodeHistoryFilterType;
import com.att.eg.cptl.capacityplanning.backendmodel.model.TreeNodeContentPatch;
import java.util.List;

public interface TreeNodeService {
  /**
   * Get a node with the given ID.
   *
   * @param id The id to look for.
   * @param user The user who initiated the retrieval.
   * @param showTrash true to show only trashed nodes, false to exclude trashed nodes.
   * @param sparse false to return child nodes with their content field, false to omit content on
   *     child nodes.
   * @param depth limits the nodes in the response to a given depth eg. 2 would show as far as
   *     grandchild nodes and 3 as far as great grandchild nodes.
   * @return The node if it exists.
   */
  List<TreeNodeDto> getNode(
      String id,
      Integer versionToRetrieve,
      boolean showTrash,
      Boolean sparse,
      Integer depth,
      AppUser user);

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
  List<String> deleteNode(String id, Integer versionNumber, boolean remove, AppUser user);

  /**
   * Restore a trashed node with the given ID.
   *
   * @param id The id of the node to recover.
   * @param versionNumber Optional version number to check for conflicts.
   * @param user The user who initiated the recovery.
   */
  TreeNodeDto restoreNodeFromTrash(String id, Integer versionNumber, AppUser user);

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
  TreeNodeDto updateNode(
      TreeNodeDto treeNodeDto, AppUser user, Integer versionNumber, boolean sparse);

  /**
   * Get the history for a given node.
   *
   * @param nodeId The ID of the node to get the history for.
   * @param user The user who initiated the retrieval.
   * @param activeFilters List of the filters to be applied to the list of previous versions.
   * @param alwaysIncludeFirst true to always include version 1, no matter what filters are applied.
   * @return The history for the node.
   */
  ObjectHistory<TreeNode> getHistoryForNode(
      String nodeId,
      AppUser user,
      List<NodeHistoryFilterType> activeFilters,
      boolean alwaysIncludeFirst);

  /**
   * Edit the comment for a specific version in this node's history.
   *
   * @param nodeId The ID of the node to edit the comment for.
   * @param versionId The version ID to edit the comment for.
   * @param comment The new comment.
   * @param user The user who initiated the edit.
   */
  void editCommentForVersion(String nodeId, int versionId, String comment, AppUser user);

  /**
   * Restore a specific version of the given node.
   *
   * @param nodeId The ID of the node to restore for.
   * @param versionId The version to restore to.
   * @param user The user who initiated the rollback.
   * @return The version number of the restored version.
   */
  int restoreVersionFromHistory(String nodeId, int versionId, AppUser user);

  TreeNodeDto patchContentForNode(
      String nodeId, Integer versionId, TreeNodeContentPatch treeNodeContentPatch, AppUser user);
}
