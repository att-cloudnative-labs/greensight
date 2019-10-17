package com.att.eg.cptl.capacityplanning.backendmodel;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.core.task.TaskExecutor;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
@EnableMongoRepositories(
    basePackages = {
      "com.att.eg.cptl.capacityplanning.backendmodel",
      "com.att.eg.cptl.capacityplanning.backendcommon"
    })
@ComponentScan(
    basePackages = {
      "com.att.eg.cptl.capacityplanning.backendmodel",
      "com.att.eg.cptl.capacityplanning.backendcommon.commonmodel",
      "com.att.eg.cptl.capacityplanning.backendcommon.commonutilities",
      "com.att.eg.cptl.capacityplanning.backendcommon.sessionmanagement"
    })
@EnableScheduling
@EnableAutoConfiguration(
    exclude = {DataSourceAutoConfiguration.class, HibernateJpaAutoConfiguration.class})
public class Application {

  @Value("${thread.core.pool.size}")
  private int corePoolSize;

  @Value("${thread.max.pool.size}")
  private int maxPoolSize;

  @Value("${simulation.run.thread.name}")
  private String simulationThreadName;

  public static void main(String[] args) throws Exception {
    SpringApplication.run(Application.class, args);
  }

  @Bean
  public TaskExecutor threadPoolTaskExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(corePoolSize);
    executor.setMaxPoolSize(maxPoolSize);
    executor.setThreadNamePrefix(simulationThreadName);
    executor.initialize();
    return executor;
  }

  @Bean
  RestTemplate restTemplate() {
    RestTemplate restTemplate = new RestTemplate();
    MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
    converter.setObjectMapper(new ObjectMapper());
    restTemplate.getMessageConverters().add(converter);
    return restTemplate;
  }
}
