package com.att.eg.cptl.capacityplanning.backend.dao;

import static org.springframework.data.mongodb.core.aggregation.Aggregation.*;
import static org.springframework.data.mongodb.core.query.Criteria.where;

import com.att.eg.cptl.capacityplanning.backend.model.treenode.TreeNode;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.TreeNodeVersion;
import com.att.eg.cptl.capacityplanning.backend.util.Constants;
import com.mongodb.client.result.UpdateResult;
import java.time.Duration;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang.StringUtils;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.lang.Nullable;

@RequiredArgsConstructor
public class TreeNodeHistoryRepositoryImpl implements TreeNodeHistoryRepositoryCustom {
  private final MongoOperations operations;

  private static final DateTimeFormatter dateTimeFormatter =
      DateTimeFormatter.ofPattern(Constants.ZONED_DATE_TIME_FORMAT);

  @Override
  public TreeNodeVersion save(
      String nodeId, Long version, String userId, @Nullable String comment) {
    TreeNodeVersion ov = new TreeNodeVersion();
    ov.setVersionId(version);
    ov.setObjectId(nodeId);
    ov.setUserId(userId);
    ov.setComment(comment);
    ov.setTimestamp(
        dateTimeFormatter.format(ZonedDateTime.now(ZoneId.of(Constants.TIMESTAMP_TIME_ZONE))));
    operations.save(ov);

    return ov;
  }

  private boolean isMinorUpdate(TreeNodeVersion old, TreeNode update) {
    if (!old.getUserId().equals(update.getOwnerId())) {
      return false;
    }
    if (StringUtils.isNotBlank(old.getComment())) {
      return false;
    }
    ZonedDateTime oldTime = ZonedDateTime.parse(old.getTimestamp());
    ZonedDateTime updateTime = ZonedDateTime.now();
    Duration delta = Duration.between(oldTime, updateTime);
    Duration maxMinorDuration = Duration.ofMinutes(5);

    if (delta.compareTo(maxMinorDuration) > 0) {
      return false;
    }

    return true;
  }

  @Override
  public TreeNodeVersion save(TreeNode treeNode, String userId, @Nullable String comment) {

    // check if this version has been saved before
    // this could happen if a manual comment has been appended earlier
    Query treeNodeCurrentVersionQuery =
        new Query(
            Criteria.where("objectId")
                .is(treeNode.getId())
                .andOperator(Criteria.where("versionId").is(treeNode.getVersion())));

    treeNodeCurrentVersionQuery.fields().exclude("object");
    TreeNodeVersion alreadySavedNode =
        operations.findOne(treeNodeCurrentVersionQuery, TreeNodeVersion.class);
    if (alreadySavedNode != null) {
      return alreadySavedNode;
    }

    // check if the last version saved can be canned
    if (treeNode.getVersion() > 1) {
      Query treeNodeLastVersionQuery =
          new Query(
              Criteria.where("objectId")
                  .is(treeNode.getId())
                  .andOperator(Criteria.where("versionId").is(treeNode.getVersion() - 1)));

      treeNodeLastVersionQuery.fields().exclude("object");
      TreeNodeVersion lastVersionNode =
          operations.findOne(treeNodeLastVersionQuery, TreeNodeVersion.class);
      if (lastVersionNode != null && isMinorUpdate(lastVersionNode, treeNode)) {
        operations.remove(lastVersionNode);
      }
    }

    TreeNodeVersion ov = new TreeNodeVersion();
    ov.setVersionId(treeNode.getVersion());
    ov.setObjectId(treeNode.getId());
    ov.setObject(treeNode);
    ov.setUserId(userId);
    ov.setComment(comment);
    ov.setTimestamp(
        dateTimeFormatter.format(ZonedDateTime.now(ZoneId.of(Constants.TIMESTAMP_TIME_ZONE))));
    operations.save(ov);
    return ov;
  }

  @Override
  public TreeNodeVersion getLatest(String nodeId, boolean sparse) {
    return null;
  }

  @Override
  public TreeNodeVersion getVersion(String nodeId, Long version) {
    Query treeNodeQuery =
        new Query(
            Criteria.where("objectId")
                .is(nodeId)
                .andOperator(Criteria.where("versionId").is(version)));
    return operations.findOne(treeNodeQuery, TreeNodeVersion.class);
  }

  // only update comments for versions created by the same user
  @Override
  public void updateComment(String nodeId, Long version, String userId, String comment) {
    Query treeNodeQuery =
        new Query(
            Criteria.where("objectId")
                .is(nodeId)
                .andOperator(
                    Criteria.where("versionId").is(version), Criteria.where("userId").is(userId)));
    Update update = new Update().set("comment", comment);
    UpdateResult ur = operations.updateFirst(treeNodeQuery, update, "treeNodeVersion");
    if (ur.getMatchedCount() != 1) {
      throw new RuntimeException("couldn't find node version");
    }
  }

  @Override
  public List<TreeNodeVersion> getVersionInfo(String nodeId) {
    AggregationResults<TreeNodeVersion> results =
        operations.aggregate(
            newAggregation(
                TreeNodeVersion.class,
                match(where("objectId").is(nodeId)),
                sort(Sort.by("versionId")),
                project("versionId", "objectId", "timestamp", "userId", "comment")),
            TreeNodeVersion.class);
    return results.getMappedResults();
  }
}
