package com.att.eg.cptl.capacityplanning.backend.model;

import org.springframework.data.annotation.Id;
import java.util.Map;

public class Layout {

  @Id private String id;

  private String ownerId;

  Map<String, Object> content;

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getOwnerId() {
    return ownerId;
  }

  public void setOwnerId(String ownerId) {
    this.ownerId = ownerId;
  }

  public Map<String, Object> getContent() {
    return content;
  }

  public void setContent(Map<String, Object> content) {
    this.content = content;
  }

}
