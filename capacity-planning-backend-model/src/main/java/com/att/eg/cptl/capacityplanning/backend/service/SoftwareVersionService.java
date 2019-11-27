package com.att.eg.cptl.capacityplanning.backend.service;

import com.att.eg.cptl.capacityplanning.backend.model.SoftwareVersionInfo;
import java.io.IOException;
import org.codehaus.plexus.util.xml.pull.XmlPullParserException;

public interface SoftwareVersionService {
  public SoftwareVersionInfo getModelVersionInfo() throws IOException, XmlPullParserException;
}
