package com.att.eg.cptl.capacityplanning.backend.model;

import lombok.Data;
import org.springframework.data.annotation.Id;

@Data
public class ObjectVersion<T extends IdentifiedObject> {
  @Id private String id;
  // Metadata
  private Long versionId;
  private String timestamp;
  private String userId;
  private String comment;
  private String objectId;

  // Object data
  private T object;
}
