package com.att.eg.cptl.capacityplanning.backend.model;

import java.util.List;
import lombok.Data;

@Data
public class ObjectHistory<T extends IdentifiedObject> {
  private String id;
  private String objectId;
  private String type;
  private List<ObjectVersion<T>> previousVersions;
}
