package com.att.eg.cptl.capacityplanning.backend.dao.mongo;

import com.att.eg.cptl.capacityplanning.backend.model.IdentifiedObject;
import com.att.eg.cptl.capacityplanning.backend.model.ObjectHistory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface ObjectHistoryMongoRepository<T extends IdentifiedObject>
    extends MongoRepository<ObjectHistory<T>, String> {

  @Query("{'objectId': ?0, 'type': ?1}")
  ObjectHistory<T> findByObjectIdAndType(String objectId, String type);
}
