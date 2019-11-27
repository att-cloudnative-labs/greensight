package com.att.eg.cptl.capacityplanning.backend.dto;

import lombok.Data;

@Data
public class VariableInfoDto {
  private String variableName;
  private String variableId;
  private String variableUnit;
  private String projectName;
  private String projectId;
  private String projectBranchName;
  private String projectBranchId;
  // projectName.projectBranchName.variableName
  private String searchKey;
  private String variableType;
}
