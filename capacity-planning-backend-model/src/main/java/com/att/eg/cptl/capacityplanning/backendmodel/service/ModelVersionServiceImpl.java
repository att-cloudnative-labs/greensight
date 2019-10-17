package com.att.eg.cptl.capacityplanning.backendmodel.service;

import com.att.eg.cptl.capacityplanning.backendmodel.exception.EmptyCacheException;
import com.att.eg.cptl.capacityplanning.backendmodel.model.ModelVersionInfo;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import javax.script.Invocable;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;
import org.apache.log4j.Logger;
import org.apache.maven.model.Model;
import org.apache.maven.model.io.xpp3.MavenXpp3Reader;
import org.codehaus.plexus.util.xml.pull.XmlPullParserException;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ModelVersionServiceImpl implements ModelVersionService, InitializingBean {
  private static final Logger LOGGER = Logger.getLogger(ModelVersionServiceImpl.class);

  @Value("${script.engine.name}")
  private String scriptEngineName;

  private boolean isCached = false;
  private Object cachedSimulationVersion = null;

  @Override
  public ModelVersionInfo getModelVersionInfo() throws IOException, XmlPullParserException {
    MavenXpp3Reader reader = new MavenXpp3Reader();
    ModelVersionInfo versionInfo = new ModelVersionInfo();
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

      versionInfo.setModelVersion(model.getId());
      versionInfo.setGroupId(model.getGroupId());
      versionInfo.setArtifactId(model.getArtifactId());
      versionInfo.setVersion(model.getVersion());

      return versionInfo;
    }
    throw new IOException("failed to load pom");
  }

  /**
   * Get simulation version from the cache file.
   *
   * @return simulation version info.
   */
  public Object getSimVersionInfo() {
    if (isCached) {
      return cachedSimulationVersion;
    } else {
      throw new EmptyCacheException("simulation version has not been cached.");
    }
  }

  /**
   * Cache the simulation version from the cpt-simulation jar so to be returned with no delay.
   *
   * @throws ScriptException to handle script exception at 105/6
   * @throws NoSuchMethodException handles invocation exceptions at 110
   */
  private void cacheSimVersion() throws ScriptException, NoSuchMethodException {
    ScriptEngine engine = new ScriptEngineManager(null).getEngineByName(scriptEngineName);
    try {
      engine.eval("load('classpath:dist-js/cpt-simulation-version.js')");
      Invocable invocable = (Invocable) engine;
      cachedSimulationVersion = invocable.invokeFunction("getVersion");
      isCached = true;
    } catch (Exception e) {
      LOGGER.info(e);
    }
  }

  @Override
  public void afterPropertiesSet() throws Exception {
    cacheSimVersion();
  }
}
