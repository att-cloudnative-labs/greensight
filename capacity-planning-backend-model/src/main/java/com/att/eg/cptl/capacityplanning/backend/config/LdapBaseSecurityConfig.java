package com.att.eg.cptl.capacityplanning.backend.config;

import static java.util.Objects.requireNonNull;
import static org.springframework.http.HttpStatus.FORBIDDEN;

import com.att.eg.cptl.capacityplanning.backend.dao.SessionRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpMethod;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.core.support.LdapContextSource;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.security.web.authentication.session.NullAuthenticatedSessionStrategy;
import org.springframework.security.web.session.SessionManagementFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.NegatedRequestMatcher;
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

public abstract class LdapBaseSecurityConfig extends WebSecurityConfigurerAdapter {

  protected static final String SWAGGER_UI_URL = "/swagger-ui.html";
  protected static final String SWAGGER_API_DOCS = "/v2/api-docs";
  protected static final String SWAGGER_CONFIG = "/configuration/security";
  protected static final String SWAGGER_CONFIG_UI = "/configuration/ui";
  protected static final String SWAGGER_RESOURCES = "/swagger-resources";
  protected static final String SWAGGER_WEBJARS = "/webjars/**";
  protected static final String SWAGGER_RESOURCE_CONFIG = "/swagger-resources/configuration/ui";

  private static List<RequestMatcher> matchersList = new ArrayList<>();

  static {
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
  private final Environment env;
  protected TokenAuthenticationProvider provider;

  protected SessionRepository sessionRepository;
  protected Integer expirySeconds;

  @Autowired
  public LdapBaseSecurityConfig(
      final TokenAuthenticationProvider provider,
      @Autowired SessionRepository sessionRepository,
      @Value("${token.expirySeconds}") Integer expirySeconds,
      @Autowired Environment env) {
    super();
    this.provider = requireNonNull(provider);
    this.sessionRepository = sessionRepository;
    this.expirySeconds = expirySeconds;
    this.env = env;
  }

  // set auth type as ldap and define samaccount based on LDAP search filter
  @Override
  public void configure(AuthenticationManagerBuilder auth) {
    try {
      auth.authenticationProvider(provider)
          .ldapAuthentication()
          .userSearchFilter("(sAMAccountName={0})")
          .contextSource(contextSource());
    } catch (Exception e) {
      e.printStackTrace();
    }
  }

  @Override
  public void configure(final WebSecurity web) {
    web.ignoring().requestMatchers(publicUrls);
    web.ignoring().antMatchers(HttpMethod.OPTIONS, "/**");
  }

  @Override
  protected void configure(final HttpSecurity http) throws Exception {
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
        .formLogin()
        .disable()
        .httpBasic()
        .disable()
        .logout()
        .disable();
  }

  /*context source bean initialization for BIAS LDAP server
   * (pick up variables from properties file)
   */
  @Bean
  public LdapContextSource contextSource() {
    LdapContextSource contextSource = new LdapContextSource();
    contextSource.setUrl(env.getProperty("ldap.url"));
    contextSource.setBase(env.getProperty("ldap.base"));
    contextSource.setUserDn(env.getProperty("ldap.userDn"));
    contextSource.setPassword(env.getProperty("ldap.password"));
    contextSource.setPooled(true);
    contextSource.setReferral("follow");
    contextSource.afterPropertiesSet();
    return contextSource;
  }

  // fitting Cross-Origin Resource Sharing (CORS) support
  @Bean
  public CorsFilter corsFilter() {
    final UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    final CorsConfiguration config = new CorsConfiguration();
    config.setAllowCredentials(true);
    config.addAllowedOrigin("*");
    config.addAllowedHeader("*");
    config.addAllowedMethod("OPTIONS");
    config.addAllowedMethod("HEAD");
    config.addAllowedMethod("GET");
    config.addAllowedMethod("PUT");
    config.addAllowedMethod("POST");
    config.addAllowedMethod("DELETE");
    config.addAllowedMethod("PATCH");
    source.registerCorsConfiguration("/**", config);
    return new CorsFilter(source);
  }

  @Bean
  public LdapTemplate ldapTemplate() {
    return new LdapTemplate(contextSource());
  }

  @Bean
  public TokenAuthenticationFilter restAuthenticationFilter() throws Exception {
    final TokenAuthenticationFilter filter =
        new TokenAuthenticationFilter(protectedUrls, sessionRepository, expirySeconds);
    filter.setAuthenticationManager(authenticationManager());
    filter.setAuthenticationSuccessHandler(successHandler());
    return filter;
  }

  @Bean
  public SimpleUrlAuthenticationSuccessHandler successHandler() {
    final SimpleUrlAuthenticationSuccessHandler successHandler =
        new SimpleUrlAuthenticationSuccessHandler();
    successHandler.setRedirectStrategy(new NoRedirectStrategy());
    return successHandler;
  }

  /** Disable Spring boot automatic filter registration. */
  @Bean
  public FilterRegistrationBean disableAutoRegistration(final TokenAuthenticationFilter filter) {
    final FilterRegistrationBean registration = new FilterRegistrationBean(filter);
    registration.setEnabled(false);
    return registration;
  }

  @Bean
  protected AuthenticationEntryPoint forbiddenEntryPoint() {
    return new HttpStatusEntryPoint(FORBIDDEN);
  }
}
