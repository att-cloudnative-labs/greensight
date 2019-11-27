package com.att.eg.cptl.capacityplanning.backend.config;

import static lombok.AccessLevel.PRIVATE;

import com.att.eg.cptl.capacityplanning.backend.dao.SessionRepository;
import java.util.ArrayList;
import java.util.List;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.authentication.session.NullAuthenticatedSessionStrategy;
import org.springframework.security.web.session.SessionManagementFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.NegatedRequestMatcher;
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

@Configuration
@EnableWebSecurity
@PropertySource("application.properties")
@PropertySource(value = "file:///opt/ldap.config", ignoreResourceNotFound = true)
@EnableGlobalMethodSecurity(prePostEnabled = true)
@FieldDefaults(level = PRIVATE, makeFinal = true)
/**
 * Configuration for defining an external LDAP server that will be used for user authentication.
 * comment out SecurityConfig to prevent auth conflict.
 */
public class LdapConfig extends LdapBaseSecurityConfig {

  private static List<RequestMatcher> matchersList = new ArrayList<>();

  {
    matchersList.add(new AntPathRequestMatcher("/login**"));
    matchersList.add(new AntPathRequestMatcher("/version"));
    matchersList.add(new AntPathRequestMatcher("/actuator/prometheus"));
    matchersList.add(new AntPathRequestMatcher(SWAGGER_UI_URL));
    matchersList.add(new AntPathRequestMatcher(SWAGGER_API_DOCS));
    matchersList.add(new AntPathRequestMatcher(SWAGGER_CONFIG));
    matchersList.add(new AntPathRequestMatcher(SWAGGER_CONFIG_UI));
    matchersList.add(new AntPathRequestMatcher(SWAGGER_RESOURCES));
    matchersList.add(new AntPathRequestMatcher(SWAGGER_RESOURCE_CONFIG));
    matchersList.add(new AntPathRequestMatcher(SWAGGER_WEBJARS));
  }

  private final RequestMatcher publicUrls = new OrRequestMatcher(matchersList);
  private final RequestMatcher protectedUrls = new NegatedRequestMatcher(publicUrls);

  @Autowired
  public LdapConfig(
      TokenAuthenticationProvider provider,
      @Autowired SessionRepository sessionRepository,
      @Value("${token.expirySeconds}") Integer expirySeconds,
      @Autowired Environment env) {
    super(provider, sessionRepository, expirySeconds, env);
  }

  @Override
  public void configure(final WebSecurity web) {
    web.ignoring().requestMatchers(publicUrls);
    web.ignoring().antMatchers(HttpMethod.OPTIONS, "/**");
  }

  // configure required settings for http security based on ldap auth
  @Override
  protected void configure(HttpSecurity http) throws Exception {
    http.sessionManagement()
        .sessionAuthenticationStrategy(new NullAuthenticatedSessionStrategy())
        .sessionCreationPolicy(SessionCreationPolicy.NEVER)
        .and()
        .exceptionHandling()
        .defaultAuthenticationEntryPointFor(forbiddenEntryPoint(), protectedUrls)
        .and()
        .authenticationProvider(provider)
        .addFilterBefore(restAuthenticationFilter(), SessionManagementFilter.class)
        .authorizeRequests()
        .anyRequest()
        .authenticated()
        .and()
        .csrf()
        .disable()
        .httpBasic()
        .disable()
        .formLogin()
        .disable()
        .logout()
        .disable();
  }

  @Bean
  public TokenAuthenticationFilter restAuthenticationFilter() throws Exception {
    final TokenAuthenticationFilter filter =
        new TokenAuthenticationFilter(protectedUrls, sessionRepository, expirySeconds);
    filter.setAuthenticationManager(authenticationManager());
    filter.setAuthenticationSuccessHandler(successHandler());
    return filter;
  }
}
