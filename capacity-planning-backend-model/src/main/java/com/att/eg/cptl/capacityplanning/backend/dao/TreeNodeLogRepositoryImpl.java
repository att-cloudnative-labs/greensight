package com.att.eg.cptl.capacityplanning.backend.dao;

import com.att.eg.cptl.capacityplanning.backend.model.treenode.*;
import com.att.eg.cptl.capacityplanning.backend.util.Constants;
import com.mongodb.client.result.UpdateResult;
import java.time.Duration;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang.StringUtils;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

@RequiredArgsConstructor
public class TreeNodeLogRepositoryImpl implements TreeNodeLogRepositoryCustom {
  private final MongoOperations operations;

  private Query queryReleasesByNode(String baseNodeId, boolean sparse) {
    Query releaseQuery =
        new Query(
                Criteria.where("baseNodeId")
                    .is(baseNodeId)
                    .andOperator(Criteria.where("releaseNr").exists(true)))
            .with(Sort.by(Sort.Direction.DESC, "releaseNr"));
    if (sparse) {
      releaseQuery.fields().exclude("content");
    }
    return releaseQuery;
  }

  private Query queryVersionsByNode(String baseNodeId, boolean sparse) {
    Query versionQuery =
        new Query(
                Criteria.where("baseNodeId")
                    .is(baseNodeId)
                    .andOperator(Criteria.where("releaseNr").exists(false)))
            .with(Sort.by(Sort.Direction.DESC, "version"));

    if (sparse) {
      versionQuery.fields().exclude("content");
    }
    return versionQuery;
  }

  private boolean isRedundant(TreeNodeLog old, TreeNodeLog update) {
    if (!old.getOwnerId().equals(update.getOwnerId())) {
      return false;
    }
    if (StringUtils.isNotBlank(old.getDescription())) {
      return false;
    }
    // never overwrite the 1st version
    if (old.getVersion().equals(0L)) {
      return false;
    }

    ZonedDateTime oldTime =
        ZonedDateTime.ofInstant(
            old.getLogDate().toInstant(), ZoneId.of(Constants.TIMESTAMP_TIME_ZONE));
    ZonedDateTime updateTime = ZonedDateTime.now();
    Duration delta = Duration.between(oldTime, updateTime);
    Duration maxMinorDuration = Duration.ofMinutes(5);

    return delta.compareTo(maxMinorDuration) <= 0;
  }

  public List<TreeNodeLog> findReleases(String baseNodeId, boolean sparse) {
    return operations.find(queryReleasesByNode(baseNodeId, sparse), TreeNodeLog.class);
  }

  public List<String> findDependentBaseNodeReleaseIds(String referringNodeId) {
    Query releaseQuery =
        new Query(
                Criteria.where("processDependencies")
                    .all(referringNodeId)
                    .andOperator(Criteria.where("releaseNr").exists(true)))
            .with(Sort.by(Sort.Direction.DESC, "releaseNr"));
    releaseQuery.fields().exclude("content");
    return operations.findDistinct(releaseQuery, "baseNodeId", TreeNodeLog.class, String.class);
  }

  @Override
  public TreeNodeLog findVersion(String baseNodeId, Long versionNr, boolean sparse) {
    Query releaseQuery =
        new Query(
            Criteria.where("baseNodeId")
                .is(baseNodeId)
                .andOperator(
                    Criteria.where("version").is(versionNr),
                    Criteria.where("releaseNr").exists(false)));
    if (sparse) {
      releaseQuery.fields().exclude("content");
    }
    return operations.findOne(releaseQuery, TreeNodeLog.class);
  }

  public List<TreeNodeLog> findVersions(String baseNodeId, boolean sparse) {
    return operations.find(queryVersionsByNode(baseNodeId, sparse), TreeNodeLog.class);
  }

  @Override
  public TreeNodeLog findRelease(String baseNodeId, Long releaseNr, boolean sparse) {
    Query releaseQuery =
        new Query(
            Criteria.where("baseNodeId")
                .is(baseNodeId)
                .andOperator(Criteria.where("releaseNr").is(releaseNr)));
    if (sparse) {
      releaseQuery.fields().exclude("content");
    }
    return operations.findOne(releaseQuery, TreeNodeLog.class);
  }

  @Override
  public TreeNodeLog findLogEntry(String releaseId, boolean sparse) {
    Query releaseQuery = new Query(Criteria.where("_id").is(releaseId));
    if (sparse) {
      releaseQuery.fields().exclude("content");
    }
    return operations.findOne(releaseQuery, TreeNodeLog.class);
  }

  @Override
  public void updateLogComment(String logEntryId, String comment) {
    Query logQuery = new Query(Criteria.where("_id").is(logEntryId));
    // fixme: this is prob not necessary
    logQuery.fields().exclude("content");
    Update descriptionUpdate = new Update().set("logComment", comment);
    UpdateResult ur = operations.updateFirst(logQuery, descriptionUpdate, TreeNodeLog.class);
    if (ur.getMatchedCount() != 1) {
      throw new RuntimeException("couldn't find log entry");
    }
  }

  public void renameReleases(String baseNodeId, String name) {
    Query releaseQuery = this.queryReleasesByNode(baseNodeId, true);
    Update nameUpdate = new Update().set("name", name);
    operations.updateFirst(releaseQuery, nameUpdate, TreeNodeLog.class);
  }

  @Override
  public TreeNodeLog findLatestRelease(String baseNodeId, boolean sparse) {
    return operations.findOne(queryReleasesByNode(baseNodeId, sparse), TreeNodeLog.class);
  }

  @Override
  public TreeNodeLog findLatestVersion(String baseNodeId, boolean sparse) {
    return operations.findOne(queryVersionsByNode(baseNodeId, sparse), TreeNodeLog.class);
  }

  @Override
  public TreeNodeLog insertRelease(TreeNodeLog release) {

    TreeNodeLog lastRelease = this.findLatestRelease(release.getBaseNodeId(), true);
    Long releaseNr =
        lastRelease != null && lastRelease.getReleaseNr() != null
            ? lastRelease.getReleaseNr() + 1
            : 1;
    release.setReleaseNr(releaseNr);
    return operations.save(release);
  }

  @Override
  public TreeNodeLog insertVersion(TreeNodeLog version) {

    TreeNodeLog lastVersion = this.findLatestVersion(version.getBaseNodeId(), true);
    if (lastVersion != null && isRedundant(lastVersion, version)) {
      operations.remove(lastVersion);
    }

    return operations.save(version);
  }

  @Override
  public List<String> getAllReleasedNodeIds(NodeType nodeType) {
    Query nodeIdQuery = new Query(Criteria.where("type").is(nodeType));
    return operations.findDistinct(nodeIdQuery, "baseNodeId", TreeNodeLog.class, String.class);
  }
}
