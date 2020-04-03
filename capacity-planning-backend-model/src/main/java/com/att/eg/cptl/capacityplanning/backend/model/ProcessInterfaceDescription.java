package com.att.eg.cptl.capacityplanning.backend.model;

import java.util.List;
import java.util.Map;
import lombok.Data;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document
public class ProcessInterfaceDescription {
  private String description;
  private String name;
  private String objectType;
  private String objectId;
  private String implementation;
  private Map<String, Object> portTemplates;
  private Map<String, Object> inports;
  private Map<String, Object> outports;
  private List<String> dependencies;
  private String parentId;
  private String pathName;
  private String versionId;
  private Long releaseNr;
}
