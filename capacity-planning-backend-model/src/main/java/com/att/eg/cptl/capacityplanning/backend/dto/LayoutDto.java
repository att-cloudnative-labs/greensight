package com.att.eg.cptl.capacityplanning.backend.dto;

import com.att.eg.cptl.capacityplanning.backend.model.Layout;
import java.util.List;
import java.util.Map;
import lombok.Data;

@Data
public class LayoutDto {
  private String id;
  private Map<String, Object> content;
  private String ownerId;
}
