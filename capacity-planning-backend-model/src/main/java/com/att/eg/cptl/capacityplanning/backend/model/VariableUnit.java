package com.att.eg.cptl.capacityplanning.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.data.annotation.Id;

@JsonIgnoreProperties(ignoreUnknown = true)
public class VariableUnit {

  @Id private String id;

  private String title;

  private Boolean isCustom;

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public Boolean getIsCustom() {
    return isCustom;
  }

  public void setIsCustom(Boolean isCustom) {
    this.isCustom = isCustom;
  }
}
