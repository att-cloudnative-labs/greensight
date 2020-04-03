package com.att.eg.cptl.capacityplanning.backend.model.treenode;

import com.att.eg.cptl.capacityplanning.backend.model.OwnedObject;
import com.att.eg.cptl.capacityplanning.backend.model.ProcessInterfaceDescription;
import java.util.List;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document
public class TreeNodeRelease implements OwnedObject {
  @Id private String id;
  private String objectId;
  private Long versionId;
  private Long releaseNr;
  private String timestamp;
  private String ownerId;
  private String description;
  private List<String> tags;
  private TreeNode treeNode;
  private ProcessInterfaceDescription processInterface;
  private NodeType type;
}
