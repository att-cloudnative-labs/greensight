package com.att.eg.cptl.capacityplanning.backend.model;

import lombok.Data;
import org.springframework.data.annotation.Id;

@Data
public class ObjectVersion<T extends IdentifiedObject> implements OwnedObject {
  @Id private String id;
  // Metadata
  private Long versionId;
  private String timestamp;
  private String ownerId;
  private String description;
  private String objectId;

  // Object data
  private T object;
}
