package com.att.eg.cptl.capacityplanning.backendmodel.service;

import com.att.eg.cptl.capacityplanning.backendmodel.model.ModelVersionInfo;
import java.io.IOException;
import org.codehaus.plexus.util.xml.pull.XmlPullParserException;

public interface ModelVersionService {

  public ModelVersionInfo getModelVersionInfo() throws IOException, XmlPullParserException;
}
