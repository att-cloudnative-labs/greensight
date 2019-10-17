package com.att.eg.cptl.capacityplanning.backendmodel.config;

import static lombok.AccessLevel.PRIVATE;

import com.att.eg.cptl.capacityplanning.backendcommon.sessionmanagement.config.BaseSecurityConfig;
import com.att.eg.cptl.capacityplanning.backendcommon.sessionmanagement.config.TokenAuthenticationProvider;
import com.att.eg.cptl.capacityplanning.backendcommon.sessionmanagement.dao.SessionRepository;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;

@Configuration
@Profile({"production"})
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class SecurityConfig extends BaseSecurityConfig {

  @Autowired
  public SecurityConfig(
      TokenAuthenticationProvider provider,
      @Autowired SessionRepository sessionRepository,
      @Value("${token.expirySeconds}") Integer expirySeconds) {
    super(provider, sessionRepository, expirySeconds);
  }
}
