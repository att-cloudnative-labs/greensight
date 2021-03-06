package com.att.eg.cptl.capacityplanning.backend.dao;

import static org.springframework.data.mongodb.core.aggregation.Aggregation.*;
import static org.springframework.data.mongodb.core.aggregation.ArrayOperators.ReverseArray.reverseArrayOf;
import static org.springframework.data.mongodb.core.aggregation.VariableOperators.mapItemsOf;
import static org.springframework.data.mongodb.core.query.Criteria.where;

import com.att.eg.cptl.capacityplanning.backend.model.ObjectVersion;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.NodeType;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.TreeNode;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.TreeNodeAncestor;
import com.mongodb.client.result.UpdateResult;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.lang.Nullable;

@RequiredArgsConstructor
public class TreeNodeRepositoryImpl implements TreeNodeRepositoryCustom {
  private final MongoOperations operations;

  private ProjectionOperation getTreeNodeProjection(boolean sparse) {
    return getTreeNodeProjection(sparse ? ProjectionType.SPARSE : ProjectionType.FULL);
  }

  private ProjectionOperation getTreeNodeProjection(ProjectionType ptype) {
    ProjectionOperation sparseProject =
        project(
            "id",
            "version",
            "type",
            "description",
            "ownerId",
            "accessControl",
            "acl",
            "ancestors",
            "trashed",
            "trashedDate",
            "processDependencies",
            "name");
    switch (ptype) {
      default:
      case SPARSE:
        return sparseProject;
      case PID:
        // FIXME
        // this should only include content.inports and content.outports
        // return sparseProject.andInclude("content.inports", "content.outports");
        // but this will break the spring persistence layer
        // fall through to FULL for now
      case FULL:
        return sparseProject.andInclude("content");
    }
  }

  private ProjectionOperation getTreeNodeAncestorProjection() {
    return project(
        "id",
        "version",
        "type",
        "ownerId",
        "accessControl",
        "acl",
        "trashed",
        "trashedDate",
        "name");
  }

  @Override
  public List<TreeNode> getChildren(TreeNode node) {
    int parentLevel = node.getAncestors().size();
    return getChildren(node.getId(), parentLevel, true);
  }

  @Override
  public List<TreeNode> getNodes(ProjectionType pt, Collection<String> nodeIds) {

    AggregationResults<TreeNode> results =
        operations.aggregate(
            newAggregation(
                TreeNode.class,
                // select treeNode with the proper id
                match(where("id").in(nodeIds)),
                getTreeNodeProjection(pt)),
            TreeNode.class);
    return results.getMappedResults();
  }

  @Override
  public List<TreeNode> getChildren(String parentId, int parentLevel, boolean sparse) {
    return getChildren(parentId, parentLevel, sparse, false);
  }

  @Override
  public List<TreeNode> getChildren(
      String parentId, int parentLevel, boolean sparse, boolean ignoreDepthLimit) {
    int childLevel = parentLevel + 1;
    Criteria depthLimit = where("ancestors").size(childLevel);

    String arrayChildQuery = String.format("ancestors.%d", parentLevel);
    Criteria isChild = where(arrayChildQuery).is(parentId);

    Criteria notTrashed = where("trashed").ne(true);

    Criteria combinedChildCriteria =
        ignoreDepthLimit
            ? isChild.andOperator(notTrashed)
            : isChild.andOperator(notTrashed, depthLimit);

    AggregationResults<TreeNode> results =
        operations.aggregate(
            newAggregation(
                TreeNode.class, match(combinedChildCriteria), getTreeNodeProjection(sparse)),
            TreeNode.class);
    return results.getMappedResults();
  }

  @Override
  public ObjectVersion<TreeNode> saveIfNoConflict(
      TreeNode object, String newComment, String userId, Long versionNumberToSave) {
    operations.save(object);
    return null;
  }

  private List<TreeNode> filterOutHiddenTrashNodes(List<TreeNode> nodes) {
    List<String> availableNodes = nodes.stream().map(TreeNode::getId).collect(Collectors.toList());
    List<TreeNode> hiddenNodes = new ArrayList<>();
    for (TreeNode node : nodes) {
      for (String ancestorId : node.getAncestors()) {
        if (availableNodes.contains(ancestorId)) {
          hiddenNodes.add(node);
        }
      }
    }

    return nodes.stream().filter(n -> !hiddenNodes.contains(n)).collect(Collectors.toList());
  }

  private List<TreeNode> findTrashedNodes(String rootId, String userId) {
    AggregationResults<TreeNode> results =
        operations.aggregate(
            newAggregation(
                TreeNode.class,
                match(where("ancestors").in(rootId).andOperator(where("trashed").is(true))),
                getTreeNodeProjection(true)),
            TreeNode.class);
    return results.getMappedResults();
  }

  @Override
  public List<TreeNode> listTrash(String rootId, String userId) {
    List<TreeNode> trashedNodes = findTrashedNodes(rootId, userId);
    List<TreeNode> filteredTrashNodes = filterOutHiddenTrashNodes(trashedNodes);
    return filteredTrashNodes;
  }

  @Override
  public List<TreeNode> getTrashedNodes(String rootId, String userId) {
    List<TreeNode> trashedNodes = findTrashedNodes(rootId, userId);
    return trashedNodes;
  }

  @Override
  public TreeNode getNode(String nodeId, boolean sparse) {
    Query treeNodeQuery = new Query(Criteria.where("id").is(nodeId));
    if (sparse) {
      treeNodeQuery.fields().exclude("content");
    }
    return operations.findOne(treeNodeQuery, TreeNode.class);
  }

  @Override
  public TreeNode saveWithoutPreviousVersion(TreeNode object) {
    return null;
  }

  @Override
  public void trash(String id, Long version, String comment) {
    Query treeNodeQuery = new Query(Criteria.where("id").is(id));
    operations.updateFirst(
        treeNodeQuery,
        new Update().set("trashed", true).set("trashedDate", ZonedDateTime.now()),
        TreeNode.class);
  }

  @Override
  public void restore(String id) {
    Query treeNodeQuery = new Query(Criteria.where("id").is(id));
    operations.updateFirst(treeNodeQuery, new Update().set("trashed", false), TreeNode.class);
  }

  @Override
  public UpdateResult update(String nodeId, Long version, Update update) {
    Query treeNodeQuery =
        new Query(Criteria.where("id").is(nodeId).andOperator(where("version").is(version)));
    return operations.updateFirst(treeNodeQuery, update, TreeNode.class);
  }

  @Override
  public ObjectVersion<TreeNode> save(TreeNode node, String comment, String userId) {
    operations.save(node);
    return null;
  }

  @Override
  public void save(List<TreeNode> nodes, String comment, String userId) {
    operations.save(nodes);
  }

  @Override
  public List<TreeNode> getAll(
      ProjectionType pt, @Nullable Date updatedAfter, NodeType... nodeTypes) {
    Criteria aggregatedSelection;
    Criteria selectByType = where("type").in((Object[]) nodeTypes);
    Criteria selectNoTrash = where("trashed").ne(true);

    if (updatedAfter != null) {
      Criteria selectByLastModified = where("lastModifiedDate").gt(updatedAfter);
      aggregatedSelection = selectByType.andOperator(selectNoTrash, selectByLastModified);
    } else {
      aggregatedSelection = selectByType.andOperator(selectNoTrash);
    }
    AggregationResults<TreeNode> results =
        operations.aggregate(
            newAggregation(TreeNode.class, match(aggregatedSelection), getTreeNodeProjection(pt)),
            TreeNode.class);
    return results.getMappedResults();
  }

  public TreeNode getNodeWithAncestors(String nodeId, Boolean sparse) {

    VariableOperators.Map mapTreeNodeAncestorsArrayToAugmentedAncestorArray =
        mapItemsOf(reverseArrayOf("ancestorsArray"))
            .as("ancInfo")
            .andApply(
                aoc -> {
                  Document ancInfo = new Document();
                  ancInfo.append("nodeId", "$$ancInfo._id");
                  ancInfo.append("nodeVersion", "$$ancInfo.version");
                  ancInfo.append("ownerId", "$$ancInfo.ownerId");
                  ancInfo.append("accessControl", "$$ancInfo.accessControl");
                  ancInfo.append("ancestors", "$$ancInfo.ancestors");
                  ancInfo.append("acl", "$$ancInfo.acl");
                  ancInfo.append("type", "$$ancInfo.type");
                  ancInfo.append("trashed", "$$ancInfo.trashed");
                  return ancInfo;
                });

    AggregationResults<TreeNode> results =
        operations.aggregate(
            newAggregation(
                TreeNode.class,
                // select treeNode with the proper id
                match(where("id").is(nodeId)),
                // get ownerDetails
                lookup("appUser", "ownerId", "userId", "ownerArray"),
                unwind("ownerArray"),
                // take the treeNode IDs from the ancestors list and grab the full nodes
                // stuff them into ancestors array
                lookup("treeNode", "ancestors", "_id", "ancestorsArray"),
                // reduce fields to what's needed and create augmenterAncestors array
                getTreeNodeProjection(sparse)
                    .and(mapTreeNodeAncestorsArrayToAugmentedAncestorArray)
                    .as("augmentedAncestors")
                    .andExpression("ownerArray.username")
                    .as("ownerName"),
                limit(1)),
            TreeNode.class);
    TreeNode node = results.getUniqueMappedResult();
    // bring the augmented ancestors array in proper shape
    node.getAugmentedAncestors().sort(Comparator.comparingInt(a -> a.getAncestors().size()));
    return results.getUniqueMappedResult();
  }

  private List<TreeNodeAncestor> getAugmentedAncestors(Collection<String> ancestorId) {

    AggregationResults<TreeNodeAncestor> results =
        operations.aggregate(
            newAggregation(
                TreeNode.class,
                // select treeNode with the proper id
                match(where("id").in(ancestorId)),
                // get ownerDetails
                //                lookup("appUser", "ownerId", "userId", "ownerArray"),
                //                unwind("ownerArray"),
                getTreeNodeAncestorProjection().andExpression("id").as("nodeId")),
            TreeNodeAncestor.class);
    return results.getMappedResults();
  }

  private void populateAncestors(List<TreeNode> nodes) {
    Map<String, TreeNodeAncestor> ancestors = new HashMap<>();
    for (TreeNode node : nodes) {
      for (String ancestorId : node.getAncestors()) {
        ancestors.putIfAbsent(ancestorId, null);
      }
    }
    List<TreeNodeAncestor> augmentedAncestors = getAugmentedAncestors(ancestors.keySet());
    for (TreeNodeAncestor augAnc : augmentedAncestors) {
      ancestors.put(augAnc.getNodeId(), augAnc);
    }
    for (TreeNode node : nodes) {
      List<TreeNodeAncestor> nodesAncestors =
          node.getAncestors().stream().map(ancestors::get).collect(Collectors.toList());
      node.setAugmentedAncestors(nodesAncestors);
    }
  }

  @Override
  public List<TreeNode> searchNode(
      @Nullable String searchTerm,
      Collection<String> folderIds,
      Pageable pageable,
      List<NodeType> nodeTypes) {
    // get all nodes that are children of the available folder or that are themselves
    // an available folder
    String parentFolderId = String.format("ancestors.%d", 1);
    Criteria hasNodeType = where("type").in(nodeTypes);
    Criteria notTrashed = where("trashed").ne(true);
    Criteria availableSubnodes =
        where(parentFolderId).in(folderIds).andOperator(where("ancestors").size(2));
    Criteria isVisibleNode = hasNodeType.orOperator(where("id").in(folderIds), availableSubnodes);
    Criteria fullCriteria =
        searchTerm != null
            ? isVisibleNode.andOperator(Criteria.where("name").regex(searchTerm, "i"), notTrashed)
            : isVisibleNode.andOperator(notTrashed);

    Query searchQuery = new Query(fullCriteria).with(pageable);

    return operations.find(searchQuery, TreeNode.class);
  }
}
