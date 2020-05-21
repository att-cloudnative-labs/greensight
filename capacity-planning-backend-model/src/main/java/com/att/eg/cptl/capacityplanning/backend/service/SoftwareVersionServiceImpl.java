package com.att.eg.cptl.capacityplanning.backend.service;

import com.att.eg.cptl.capacityplanning.backend.model.SoftwareVersionInfo;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.maven.model.Model;
import org.apache.maven.model.io.xpp3.MavenXpp3Reader;
import org.codehaus.plexus.util.xml.pull.XmlPullParserException;
import org.springframework.stereotype.Service;

@Service
public class SoftwareVersionServiceImpl implements SoftwareVersionService {
  private static final Logger LOGGER = LogManager.getLogger(SoftwareVersionServiceImpl.class);

  @Override
  public SoftwareVersionInfo getModelVersionInfo() throws IOException, XmlPullParserException {
    MavenXpp3Reader reader = new MavenXpp3Reader();
    SoftwareVersionInfo versionInfo = new SoftwareVersionInfo();
    InputStream in = null;
    try {
      in = new FileInputStream("pom.xml");
    } catch (Exception e) {
      LOGGER.info(e);
    }
    if (in == null) {
      try {
        in =
            getClass()
                .getResourceAsStream(
                    "/META-INF/maven/" + "cptl.capacityplanning/modelbackend/pom.xml");
      } catch (Exception e) {
        LOGGER.info(e);
      }
    }
    if (in != null) {
      Model model = reader.read(in);

      versionInfo.setGroupId(model.getGroupId());
      versionInfo.setArtifactId(model.getArtifactId());
      versionInfo.setVersion(model.getVersion());

      return versionInfo;
    }
    throw new IOException("failed to load pom");
  }
}
