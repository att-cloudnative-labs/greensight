package com.att.eg.cptl.capacityplanning.backend.model.treenode;

import com.att.eg.cptl.capacityplanning.backend.model.Trashable;
import java.time.ZonedDateTime;
import java.util.Date;
import java.util.List;
import java.util.Map;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Version;
import org.springframework.data.domain.Persistable;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.lang.Nullable;

@Data
@Document
public class TreeNode implements AccessControlledTreeObject, Trashable, Persistable<String> {
  @Id private String id;
  private String name;
  private NodeType type;
  private Map<String, Object> content;
  private List<String> ancestors;
  private String description;
  private String ownerId;
  private AccessControlType accessControl;
  private List<AccessPermission> acl;
  @Nullable private Boolean trashed;
  private ZonedDateTime trashedDate;
  private List<String> processDependencies;
  @Version private Long version;
  @LastModifiedDate private Date lastModifiedDate;

  @Override
  public boolean isNew() {
    return id == null;
  }
}
