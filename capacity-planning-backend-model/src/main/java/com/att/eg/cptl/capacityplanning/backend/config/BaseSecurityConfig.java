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
import org.springframework.http.HttpMethod;
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

public abstract class BaseSecurityConfig extends WebSecurityConfigurerAdapter {

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

  protected TokenAuthenticationProvider provider;

  protected SessionRepository sessionRepository;
  protected Integer expirySeconds;

  @Autowired
  public BaseSecurityConfig(
      final TokenAuthenticationProvider provider,
      @Autowired SessionRepository sessionRepository,
      @Value("${token.expirySeconds}") Integer expirySeconds) {
    super();
    this.provider = requireNonNull(provider);
    this.sessionRepository = sessionRepository;
    this.expirySeconds = expirySeconds;
  }

  @Override
  protected void configure(final AuthenticationManagerBuilder auth) {
    auth.authenticationProvider(provider);
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
