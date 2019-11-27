package com.att.eg.cptl.capacityplanning.backend.service.util.objecthistory;

import com.att.eg.cptl.capacityplanning.backend.dao.mongo.ObjectHistoryMongoRepository;
import com.att.eg.cptl.capacityplanning.backend.exception.NotFoundException;
import com.att.eg.cptl.capacityplanning.backend.model.IdentifiedObject;
import com.att.eg.cptl.capacityplanning.backend.model.ObjectHistory;
import com.att.eg.cptl.capacityplanning.backend.model.ObjectVersion;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Base class for dealing with objects which allow a version history to be maintained.
 *
 * @param <T> The type of object to maintain a history for.
 */
@Component
public abstract class ObjectHistoryService<T extends IdentifiedObject> {
  private Class<T> type;

  @Autowired private ObjectHistoryMongoRepository<T> objectHistoryMongoRepository;

  protected void setType(Class type) {
    this.type = type;
  }

  /**
   * Get a specific previous version of an object.
   *
   * @param objectId The primary key of the object.
   * @param versionId The incremental number identifying the previous version of the object.
   * @return
   */
  public T getVersion(String objectId, int versionId) {
    ObjectHistory<T> objectHistory =
        objectHistoryMongoRepository.findByObjectIdAndType(objectId, type.getSimpleName());
    if (objectHistory != null) {
      for (ObjectVersion<T> objectVersion : objectHistory.getPreviousVersions()) {
        if (versionId == objectVersion.getVersionId()) {
          return objectVersion.getObject();
        }
      }
    }
    return null;
  }

  /**
   * Returns the history for an object showing all previous versions and associated metadata.
   *
   * @param objectId The primary key of the object.
   * @return The history of the object.
   */
  public ObjectHistory<T> getHistoryForObject(String objectId) {
    ObjectHistory<T> objectHistory =
        objectHistoryMongoRepository.findByObjectIdAndType(objectId, type.getSimpleName());
    if (objectHistory == null) {
      throw new NotFoundException("History not found for variable.");
    }
    return objectHistoryMongoRepository.findByObjectIdAndType(objectId, type.getSimpleName());
  }

  /**
   * Edit the comment for a specific previous version of an object.
   *
   * @param objectId The primary key of the object.
   * @param versionId The incremental number identifying the previous version of the object.
   * @param comment The string forming the comment on this version.
   */
  public void editCommentForVersion(String objectId, int versionId, String comment) {
    ObjectHistory<T> objectHistory =
        objectHistoryMongoRepository.findByObjectIdAndType(objectId, type.getSimpleName());
    if (objectHistory == null) {
      throw new NotFoundException("Variable not found.");
    }
    boolean found = false;
    for (ObjectVersion<T> objectVersion : objectHistory.getPreviousVersions()) {
      if (versionId == objectVersion.getVersionId()) {
        objectVersion.setComment(comment);
        found = true;
      }
    }
    if (!found) {
      throw new NotFoundException("Version not found.");
    }
    objectHistoryMongoRepository.save(objectHistory);
  }
}
