package com.att.eg.cptl.capacityplanning.backend.model;

import lombok.Data;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document
public class ForecastVariableDescriptor {
  private String variableName;
  private String variableId;
  private String variableUnit;
  private String projectName;
  private String projectId;
  private String projectBranchName;
  private String projectBranchId;
  private String searchKey;
  private String variableType;
}
