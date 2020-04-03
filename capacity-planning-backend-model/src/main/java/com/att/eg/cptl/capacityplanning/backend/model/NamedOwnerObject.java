package com.att.eg.cptl.capacityplanning.backend.model;

public interface NamedOwnerObject extends OwnedObject {
  String getOwnerName();

  void setOwnerName(String ownerName);
}
