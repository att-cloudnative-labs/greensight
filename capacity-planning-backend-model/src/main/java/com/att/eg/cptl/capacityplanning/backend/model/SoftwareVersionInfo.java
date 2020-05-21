package com.att.eg.cptl.capacityplanning.backend.model;

public class SoftwareVersionInfo {

  private String groupId;
  private String artifactId;
  private String version;
  private String authMode;

  public SoftwareVersionInfo() {
    super();
  }

  public String getGroupId() {
    return groupId;
  }

  public void setGroupId(String groupId) {
    this.groupId = groupId;
  }

  public String getArtifactId() {
    return artifactId;
  }

  public void setArtifactId(String artifactId) {
    this.artifactId = artifactId;
  }

  public String getVersion() {
    return version;
  }

  public void setVersion(String version) {
    this.version = version;
  }

  public void setAuthMode(String authMode) {
    this.authMode = authMode;
  }

  public String getAuthMode() {
    return authMode;
  }
}
