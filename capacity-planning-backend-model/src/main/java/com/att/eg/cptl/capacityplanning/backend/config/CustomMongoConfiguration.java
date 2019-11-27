package com.att.eg.cptl.capacityplanning.backend.config;

import com.att.eg.cptl.capacityplanning.backend.converter.StringToZonedDateTimeConverter;
import com.att.eg.cptl.capacityplanning.backend.converter.ZonedDateTimeToStringConverter;
import com.mongodb.MongoClient;
import com.mongodb.MongoClientURI;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.mongodb.config.AbstractMongoConfiguration;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.convert.CustomConversions;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;

@Configuration
@Profile({"production", "development"})
public class CustomMongoConfiguration extends AbstractMongoConfiguration {

  @Value("${spring.data.mongodb.uri}")
  private String uri;

  @Value("${spring.data.mongodb.database}")
  private String database;

  @Override
  protected String getDatabaseName() {
    return database;
  }

  @Override
  @Bean
  public CustomConversions customConversions() {
    List<Converter<?, ?>> converters = new ArrayList<>();
    converters.add(new ZonedDateTimeToStringConverter());
    converters.add(new StringToZonedDateTimeConverter());
    return new CustomConversions(converters);
  }

  @Override
  public MongoClient mongoClient() {
    return new MongoClient(new MongoClientURI(uri));
  }

  @Override
  @Bean
  public MongoTemplate mongoTemplate() throws Exception {
    MongoTemplate mongoTemplate = new MongoTemplate(mongoClient(), database);
    MappingMongoConverter mongoMapping = (MappingMongoConverter) mongoTemplate.getConverter();
    mongoMapping.setCustomConversions(customConversions());
    mongoMapping.afterPropertiesSet();
    return mongoTemplate;
  }

  @Override
  protected Collection<String> getMappingBasePackages() {

    return Stream.of("com.att.eg.cptl.capacityplanning.backend").collect(Collectors.toList());
  }
}
