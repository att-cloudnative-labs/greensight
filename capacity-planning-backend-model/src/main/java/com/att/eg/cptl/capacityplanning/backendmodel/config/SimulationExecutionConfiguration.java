package com.att.eg.cptl.capacityplanning.backendmodel.config;

import javax.script.ScriptEngineManager;
import jdk.nashorn.api.scripting.NashornScriptEngine;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SimulationExecutionConfiguration {

  @Bean
  public NashornScriptEngine nashornScriptEngine() {
    ScriptEngineManager scriptEngineManager = new ScriptEngineManager();
    return (NashornScriptEngine) scriptEngineManager.getEngineByName("nashorn");
  }
}
