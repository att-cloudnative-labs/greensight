package com.att.eg.cptl.capacityplanning.backend.model;

import java.util.Map;
import lombok.Data;

@Data
public class MetadataWithContent {
  private Map<String, Object> content;
}
