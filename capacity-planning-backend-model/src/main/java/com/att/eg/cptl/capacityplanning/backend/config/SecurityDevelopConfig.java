package com.att.eg.cptl.capacityplanning.backend.config;

import static lombok.AccessLevel.PRIVATE;

import com.att.eg.cptl.capacityplanning.backend.dao.SessionRepository;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter;

@Configuration
@Profile("development")
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class SecurityDevelopConfig extends BaseSecurityConfig {

  @Autowired
  public SecurityDevelopConfig(
      TokenAuthenticationProvider provider,
      @Autowired SessionRepository sessionRepository,
      @Value("${token.expirySeconds}") Integer expirySeconds) {
    super(provider, sessionRepository, expirySeconds);
  }

  @Bean
  public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurerAdapter() {
      @Override
      public void addCorsMappings(CorsRegistry registry) {
        registry
            .addMapping("/**")
            .allowedOrigins("*")
            .allowedMethods("OPTIONS", "GET", "POST", "PUT", "DELETE")
            .allowedHeaders("Access-Control-Allow-Origin", "Accept", "X-requested-with")
            .exposedHeaders("Origin", "Accept", "Access-Control-Allow-Origin")
            .allowCredentials(false)
            .maxAge(3600);
      }
    };
  }

  @Bean
  public FilterRegistrationBean corsFilter() {
    CorsConfiguration config = new CorsConfiguration();
    config.addAllowedOrigin("http://localhost:4100");
    config.addAllowedHeader("*");
    config.addAllowedMethod("*");
    config.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    FilterRegistrationBean bean = new FilterRegistrationBean(new CorsFilter(source));
    bean.setOrder(0);
    return bean;
  }
}
