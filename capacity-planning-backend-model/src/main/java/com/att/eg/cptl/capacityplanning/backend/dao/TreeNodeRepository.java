package com.att.eg.cptl.capacityplanning.backend.dao;

import com.att.eg.cptl.capacityplanning.backend.model.treenode.TreeNode;
import java.util.Collection;
import java.util.List;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface TreeNodeRepository
    extends MongoRepository<TreeNode, String>, TreeNodeRepositoryCustom {
  @Query(value = "{'ancestors': ?0}", fields = "{content:0}")
  List<TreeNode> findChildNodesByAncestor(String ancestorId);

  @Aggregation(pipeline = {"{ $match : { customerId : ?0 } }", "{ $count : total }"})
  List<TreeNode> findChildNodes(String ancestorId, int childLevel);

  /**
   * Finds all nodes under a given node (identified by it's ID) in the tree.
   *
   * @param ancestorId The ID of the ancestor to find nodes under.
   * @return The list of nodes under this node.
   */
  @Query(value = "{'ancestors': ?0}")
  List<TreeNode> findChildNodesByAncestorWithContent(String ancestorId);

  /**
   * Get all nodes whose ID appears in the given "ids" Collection.
   *
   * @param ids The list of IDs to look for.
   * @return The nodes whose IDs appear in the "ids" Collection.
   */
  List<TreeNode> findByIdIn(Collection<String> ids);

  /**
   * Get all nodes which have the specified type.
   *
   * @param type The type of TreeNode to retrieve.
   * @return The nodes of the specified type.
   */
  @Query(value = "{'type': ?0}")
  List<TreeNode> findAllByType(String type);

  @Query(value = "{'processDependencies': ?0}")
  List<TreeNode> findDependentNodes(String nodeId);
}
