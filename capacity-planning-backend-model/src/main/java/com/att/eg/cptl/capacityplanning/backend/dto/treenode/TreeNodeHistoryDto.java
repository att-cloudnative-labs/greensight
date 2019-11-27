package com.att.eg.cptl.capacityplanning.backend.dto.treenode;

import com.att.eg.cptl.capacityplanning.backend.model.ObjectVersion;
import java.util.List;
import lombok.Data;

@Data
public class TreeNodeHistoryDto {
  private String id;
  private String objectId;
  private List<ObjectVersion<TreeNodeDto>> previousVersions;
}
