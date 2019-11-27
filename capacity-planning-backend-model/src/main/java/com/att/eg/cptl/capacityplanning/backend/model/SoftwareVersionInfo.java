package com.att.eg.cptl.capacityplanning.backend.model;

public class SoftwareVersionInfo {

  private String softwareVersion;
  private String groupId;
  private String artifactId;
  private String version;

  public SoftwareVersionInfo() {
    super();
  }

  public String getSoftwareVersion() {
    return softwareVersion;
  }

  public void setSoftwareVersion(String modelVersion) {
    this.softwareVersion = modelVersion;
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
}
