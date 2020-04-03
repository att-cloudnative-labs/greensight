package com.att.eg.cptl.capacityplanning.backend.model.treenode;

import static com.att.eg.cptl.capacityplanning.backend.util.Constants.UUID_LENGTH;

public class CombinedId {
  // possible process ids:
  // <UUID>
  // <UUID>@<VERSION-NR>
  // <UUID>@r<RELEASE-NR>
  public static boolean isVersion(String procId) {
    return (!isRelease(procId) && procId.contains("@"));
  }

  public static boolean isNode(String procId) {
    return !procId.contains("@");
  }

  public static boolean isRelease(String procId) {
    return (procId.contains("@r"));
  }

  public boolean isVersion() {
    return CombinedId.isVersion(this.combinedId);
  }

  public boolean isNode() {
    return CombinedId.isNode(this.combinedId);
  }

  public boolean isRelease() {
    return CombinedId.isRelease(this.combinedId);
  }

  public static String genVersion(String nodeId, Long versionId) {
    return nodeId + "@" + versionId;
  }

  public static String genRelease(String nodeId, Long releaseNr) {
    return nodeId + "@r" + releaseNr;
  }

  private static String getAppendix(String cid) {
    if (CombinedId.isRelease(cid)) {
      return cid.substring(UUID_LENGTH + 2);
    } else {
      return cid.substring(UUID_LENGTH + 1);
    }
  }

  private String combinedId;

  public CombinedId(String id) {
    this.combinedId = id;
  }

  private String getAppendix() {
    return CombinedId.getAppendix(this.combinedId);
  }

  public Long getReleaseNr() {
    return CombinedId.getReleaseNr(this.combinedId);
  }

  public static Long getReleaseNr(String cid) {
    return CombinedId.isRelease(cid) ? Long.parseLong(CombinedId.getAppendix(cid)) : null;
  }

  public Long getVersionId() {
    return CombinedId.getVersionId(this.combinedId);
  }

  public static Long getVersionId(String cid) {
    return CombinedId.isVersion(cid) ? Long.parseLong(CombinedId.getAppendix(cid)) : null;
  }

  public String getNodeId() {
    return CombinedId.getNodeId(this.combinedId);
  }

  public static String getNodeId(String cid) {
    if (CombinedId.isNode(cid)) {
      return cid;
    }
    return cid.substring(0, UUID_LENGTH);
  }
}
