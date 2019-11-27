package com.att.eg.cptl.capacityplanning.backend.dao;

import com.att.eg.cptl.capacityplanning.backend.model.ObjectVersion;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.NodeType;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.TreeNode;
import com.mongodb.client.result.UpdateResult;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.lang.Nullable;

public interface TreeNodeRepositoryCustom {
  enum ProjectionType {
    SPARSE,
    PID,
    FULL
  };

  List<TreeNode> getNodes(ProjectionType pt, Collection<String> nodeIds);

  List<TreeNode> getChildren(String parentId, int parentLevel, boolean sparse);

  List<TreeNode> getChildren(
      String parentId, int parentLevel, boolean sparse, boolean ignoreDepthLimit);

  List<TreeNode> getChildren(TreeNode node);

  ObjectVersion<TreeNode> saveIfNoConflict(
      TreeNode object, String newComment, String userId, Long versionNumberToSave);

  TreeNode saveWithoutPreviousVersion(TreeNode object);

  void trash(String id, Long version, String comment);

  List<TreeNode> listTrash(String rootId, String userId);

  List<TreeNode> getTrashedNodes(String rootId, String userId);

  void restore(String id);

  ObjectVersion<TreeNode> save(TreeNode node, String comment, String userId);

  UpdateResult update(String nodeId, Long version, Update update);

  void save(List<TreeNode> nodes, String comment, String userId);

  TreeNode getNode(String nodeId, boolean sparse);

  List<TreeNode> getAll(ProjectionType pt, @Nullable Date updatedAfter, NodeType... nodeTypes);
}
