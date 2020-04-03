package com.att.eg.cptl.capacityplanning.backend.model;

import lombok.Data;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document
public class ForecastVariableDescriptor {
  private String variableName;
  private String variableId;
  private String variableUnit;
  private String sheetName;
  private String sheetId;
  private String folderName;
  private String folderId;
  private String searchKey;
  private String variableType;
}
