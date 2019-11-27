package com.att.eg.cptl.capacityplanning.backend.model;

import java.time.ZonedDateTime;

/** To be implemented by any object which can be Trashed. */
public interface Trashable extends IdentifiedObject {
  // This uses get instead of is so that a null value can be detected.
  Boolean getTrashed();

  void setTrashed(Boolean trashed);

  ZonedDateTime getTrashedDate();

  void setTrashedDate(ZonedDateTime zonedDateTime);

  Long getVersion();
}
